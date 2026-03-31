import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { loadMenuCatalog } from "../_shared/catalog-repository.ts";
import {
  normalizeIngredient,
  uniqueIngredients
} from "../../../src/features/ingredients/lib/ingredient-utils.ts";
import { guardGeneratedMealContent } from "../../../src/features/meal-plans/lib/ai-response-guard.ts";
import { buildDailyMealPlanWithCandidates } from "../../../src/features/meal-plans/lib/plan-generator.ts";
import {
  MEAL_TYPES,
  type ChildProfile,
  type MealRecommendation,
  type MealType
} from "../../../src/types/domain.ts";

interface GenerateMealPlanRequest {
  child: ChildProfile;
  mealInputs: Record<MealType, string[]>;
}

interface OpenAiConfig {
  apiKey: string;
  model: string;
}

interface AiSubstituteItem {
  ingredient: string;
  substitutes: string[];
}

interface AiMealResponse {
  selectedMenu: string;
  recommendation: string;
  missingIngredients: string[];
  missingIngredientExplanation: string;
  substitutes: AiSubstituteItem[];
  recipe: string[];
  caution: string;
}

interface NormalizedAiMealResponse extends Omit<AiMealResponse, "substitutes"> {
  substitutes: Record<string, string[]>;
}

interface AiGenerationOutcome {
  result: MealRecommendation;
  validationStatus: string;
  fallbackUsed: boolean;
  requestPayload: unknown;
  responsePayload: unknown;
}

class RequestValidationError extends Error {}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const AI_PROMPT_VERSION = "openai-meal-copy-v1";
const MAX_CANDIDATES = 3;
const AI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    selectedMenu: { type: "string" },
    recommendation: { type: "string" },
    missingIngredients: {
      type: "array",
      items: { type: "string" }
    },
    missingIngredientExplanation: { type: "string" },
    substitutes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          ingredient: { type: "string" },
          substitutes: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["ingredient", "substitutes"]
      }
    },
    recipe: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" }
    },
    caution: { type: "string" }
  },
  required: [
    "selectedMenu",
    "recommendation",
    "missingIngredients",
    "missingIngredientExplanation",
    "substitutes",
    "recipe",
    "caution"
  ]
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new RequestValidationError(`${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function parseOptionalString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function parseStringArrayField(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new RequestValidationError(`${fieldName} must be an array of strings`);
  }

  const nextValues = value.flatMap((item) => {
    if (typeof item !== "string") {
      throw new RequestValidationError(`${fieldName} must be an array of strings`);
    }

    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  });

  return nextValues;
}

function parseAgeMonths(value: unknown) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new RequestValidationError("child.ageMonths must be a non-negative number");
  }

  return parsedValue;
}

function parseGenerateMealPlanRequest(value: unknown): GenerateMealPlanRequest {
  if (!isRecord(value)) {
    throw new RequestValidationError("Request body must be an object");
  }

  if (!isRecord(value.child)) {
    throw new RequestValidationError("child must be an object");
  }

  if (!isRecord(value.mealInputs)) {
    throw new RequestValidationError("mealInputs must be an object");
  }

  const now = new Date().toISOString();

  return {
    child: {
      id: parseRequiredString(value.child.id, "child.id"),
      name: parseRequiredString(value.child.name, "child.name"),
      ageMonths: parseAgeMonths(value.child.ageMonths),
      birthDate: parseOptionalString(value.child.birthDate),
      allergies: parseStringArrayField(value.child.allergies ?? [], "child.allergies"),
      createdAt: parseOptionalString(value.child.createdAt, now),
      updatedAt: parseOptionalString(value.child.updatedAt, now)
    },
    mealInputs: {
      breakfast: parseStringArrayField(value.mealInputs.breakfast, "mealInputs.breakfast"),
      lunch: parseStringArrayField(value.mealInputs.lunch, "mealInputs.lunch"),
      dinner: parseStringArrayField(value.mealInputs.dinner, "mealInputs.dinner")
    }
  };
}

function getOpenAiConfig(): OpenAiConfig | null {
  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4.1"
  };
}

function stripMarkdownFence(value: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/u, "").replace(/\s*```$/u, "").trim();
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAiSubstituteItems(value: unknown): value is AiSubstituteItem[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.ingredient === "string" &&
      isStringArray(item.substitutes)
  );
}

function isAiMealResponse(value: unknown): value is AiMealResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    typeof value.selectedMenu === "string" &&
    typeof value.recommendation === "string" &&
    isStringArray(value.missingIngredients) &&
    typeof value.missingIngredientExplanation === "string" &&
    isAiSubstituteItems(value.substitutes) &&
    isStringArray(value.recipe) &&
    typeof value.caution === "string"
  );
}

function mapSubstitutesToItems(substitutes: Record<string, string[]>) {
  return Object.entries(substitutes).map(([ingredient, items]) => ({
    ingredient,
    substitutes: items
  }));
}

function normalizeSubstituteItems(items: AiSubstituteItem[]) {
  return Object.fromEntries(
    items.map((item) => [
      normalizeIngredient(item.ingredient),
      uniqueIngredients(item.substitutes)
    ])
  );
}

function normalizeAiMealResponse(response: AiMealResponse): NormalizedAiMealResponse {
  return {
    selectedMenu: response.selectedMenu.trim(),
    recommendation: response.recommendation.trim(),
    missingIngredients: uniqueIngredients(response.missingIngredients),
    missingIngredientExplanation: response.missingIngredientExplanation.trim(),
    substitutes: normalizeSubstituteItems(response.substitutes),
    recipe: response.recipe.map((step) => step.trim()).filter(Boolean).slice(0, 3),
    caution: response.caution.trim()
  };
}

function hasSameNormalizedSet(left: string[], right: string[]) {
  const leftValues = uniqueIngredients(left);
  const rightValues = uniqueIngredients(right);

  if (leftValues.length !== rightValues.length) {
    return false;
  }

  const rightSet = new Set(rightValues.map((item) => normalizeIngredient(item)));
  return leftValues.every((item) => rightSet.has(normalizeIngredient(item)));
}

function buildAllowedValueMap(items: string[]) {
  return new Map(items.map((item) => [normalizeIngredient(item), item] as const));
}

function validateAiStructuredFields(
  response: NormalizedAiMealResponse,
  selectedResult: MealRecommendation,
  candidates: MealRecommendation[]
) {
  const candidateNameSet = new Set(candidates.map((candidate) => candidate.name));

  if (!candidateNameSet.has(response.selectedMenu) || response.selectedMenu !== selectedResult.name) {
    return false;
  }

  if (!hasSameNormalizedSet(response.missingIngredients, selectedResult.missingIngredients)) {
    return false;
  }

  if (!hasSameNormalizedSet(Object.keys(response.substitutes), Object.keys(selectedResult.substitutes))) {
    return false;
  }

  const allowedSubstituteMap = new Map(
    Object.entries(selectedResult.substitutes).map(([ingredient, substitutes]) => [
      normalizeIngredient(ingredient),
      buildAllowedValueMap(substitutes)
    ] as const)
  );

  return Object.entries(response.substitutes).every(([ingredient, substitutes]) => {
    const allowedValues = allowedSubstituteMap.get(normalizeIngredient(ingredient));

    if (!allowedValues) {
      return false;
    }

    return uniqueIngredients(substitutes).every((substitute) =>
      allowedValues.has(normalizeIngredient(substitute))
    );
  });
}

function createSupabaseLogClient(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey || !authorization) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function writeAiGenerationLog(
  request: Request,
  mealType: MealType,
  validationStatus: string,
  fallbackUsed: boolean,
  requestPayload: unknown,
  responsePayload: unknown
) {
  const supabase = createSupabaseLogClient(request);

  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase.from("ai_generation_logs").insert({
      meal_type: mealType,
      prompt_version: AI_PROMPT_VERSION,
      request_payload_json: requestPayload ?? {},
      response_payload_json: responsePayload ?? {},
      validation_status: validationStatus,
      fallback_used: fallbackUsed
    });

    if (error) {
      console.warn("Failed to write AI generation log", error);
    }
  } catch (error) {
    console.warn("Unexpected AI generation log error", error);
  }
}

function buildAiRequestPayload(input: {
  child: ChildProfile;
  mealType: MealType;
  normalizedInputIngredients: string[];
  selectedResult: MealRecommendation;
  candidates: MealRecommendation[];
}) {
  return {
    promptVersion: AI_PROMPT_VERSION,
    child: {
      ageMonths: input.child.ageMonths,
      allergies: uniqueIngredients(input.child.allergies)
    },
    mealType: input.mealType,
    normalizedInputIngredients: input.normalizedInputIngredients,
    selectedMenu: input.selectedResult.name,
    expectedMissingIngredients: input.selectedResult.missingIngredients,
    expectedSubstitutes: mapSubstitutesToItems(input.selectedResult.substitutes),
    candidates: input.candidates.slice(0, MAX_CANDIDATES).map((candidate) => ({
      name: candidate.name,
      cookingStyle: candidate.cookingStyle,
      mainProtein: candidate.mainProtein,
      usedIngredients: candidate.usedIngredients,
      missingIngredients: candidate.missingIngredients,
      substitutes: mapSubstitutesToItems(candidate.substitutes),
      textureNote: candidate.textureNote,
      caution: candidate.caution
    }))
  };
}

function buildSystemPrompt() {
  return [
    "당신은 12개월 전후 아이 식단 앱의 서버사이드 요약 생성기입니다.",
    "규칙 기반 추천 엔진이 이미 selectedMenu를 결정했으므로 다른 메뉴를 선택하면 안 됩니다.",
    "반드시 JSON만 반환하세요.",
    "selectedMenu는 입력으로 받은 selectedMenu와 정확히 동일해야 합니다.",
    "missingIngredients는 입력의 expectedMissingIngredients와 동일하게 유지하세요.",
    "substitutes는 ingredient와 substitutes 배열을 가진 객체 목록이어야 합니다.",
    "substitutes의 ingredient와 substitutes 값은 expectedSubstitutes 범위 안에서만 작성하세요.",
    "추천 문구와 조리법, 주의사항은 12개월 아이에게 안전하고 부드러운 식감 기준으로 작성하세요.",
    "알레르기 재료나 위험한 표현은 절대 포함하지 마세요.",
    "recipe는 보호자가 바로 따라 할 수 있는 짧은 3단계 배열이어야 합니다."
  ].join(" ");
}

async function requestOpenAiMealCopy(
  config: OpenAiConfig,
  payload: ReturnType<typeof buildAiRequestPayload>
) {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meal_plan_ai_response",
          strict: true,
          schema: AI_RESPONSE_SCHEMA
        }
      },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ]
    })
  });

  const responsePayload = await response.json();

  if (!response.ok) {
    throw new Error(
      `OpenAI request failed with status ${response.status}: ${JSON.stringify(responsePayload)}`
    );
  }

  const content = Array.isArray(responsePayload.choices)
    ? responsePayload.choices[0]?.message?.content
    : null;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned an empty message content");
  }

  const parsed = JSON.parse(stripMarkdownFence(content));

  if (!isAiMealResponse(parsed)) {
    throw new Error("OpenAI returned an invalid meal response shape");
  }

  return {
    parsed: normalizeAiMealResponse(parsed),
    responsePayload
  };
}

async function enhanceMealResultWithAi(input: {
  request: Request;
  child: ChildProfile;
  mealType: MealType;
  normalizedInputIngredients: string[];
  selectedResult: MealRecommendation;
  candidates: MealRecommendation[];
  openAiConfig: OpenAiConfig | null;
}): Promise<AiGenerationOutcome> {
  const requestPayload = buildAiRequestPayload({
    child: input.child,
    mealType: input.mealType,
    normalizedInputIngredients: input.normalizedInputIngredients,
    selectedResult: input.selectedResult,
    candidates: input.candidates
  });

  if (!input.openAiConfig) {
    return {
      result: input.selectedResult,
      validationStatus: "skipped-no-openai-config",
      fallbackUsed: true,
      requestPayload,
      responsePayload: {
        reason: "OPENAI_API_KEY is not configured"
      }
    };
  }

  if (input.candidates.length === 0 || input.selectedResult.id.startsWith("fallback-")) {
    return {
      result: input.selectedResult,
      validationStatus: "skipped-no-ranked-candidates",
      fallbackUsed: true,
      requestPayload,
      responsePayload: {
        reason: "No ranked candidates available for AI enrichment"
      }
    };
  }

  try {
    const { parsed, responsePayload } = await requestOpenAiMealCopy(input.openAiConfig, requestPayload);

    if (!validateAiStructuredFields(parsed, input.selectedResult, input.candidates)) {
      return {
        result: input.selectedResult,
        validationStatus: "fallback-invalid-structured-fields",
        fallbackUsed: true,
        requestPayload,
        responsePayload
      };
    }

    const guardedNarrative = guardGeneratedMealContent({
      generated: {
        recommendationText: parsed.recommendation,
        recipeSummary: parsed.recipe,
        missingIngredientExplanation: parsed.missingIngredientExplanation,
        caution: parsed.caution,
        promptVersion: AI_PROMPT_VERSION,
        isFallback: false
      },
      mealType: input.mealType,
      menuName: input.selectedResult.name,
      cookingStyle: input.selectedResult.cookingStyle,
      usedIngredients: input.selectedResult.usedIngredients,
      missingIngredients: input.selectedResult.missingIngredients,
      recipeSummary: input.selectedResult.recipeSummary,
      caution: input.selectedResult.caution,
      allergies: input.child.allergies
    });

    if (guardedNarrative.isFallback) {
      return {
        result: input.selectedResult,
        validationStatus: "fallback-guard-rejected",
        fallbackUsed: true,
        requestPayload,
        responsePayload
      };
    }

    return {
      result: {
        ...input.selectedResult,
        recommendationText: guardedNarrative.recommendationText,
        recipeSummary: guardedNarrative.recipeSummary,
        missingIngredientExplanation: guardedNarrative.missingIngredientExplanation,
        caution: guardedNarrative.caution,
        promptVersion: AI_PROMPT_VERSION,
        isFallback: false
      },
      validationStatus: "accepted",
      fallbackUsed: false,
      requestPayload,
      responsePayload
    };
  } catch (error) {
    return {
      result: input.selectedResult,
      validationStatus: "fallback-openai-error",
      fallbackUsed: true,
      requestPayload,
      responsePayload: {
        error: error instanceof Error ? error.message : "Unknown OpenAI error"
      }
    };
  }
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const payload = parseGenerateMealPlanRequest(requestBody);
    const normalizedMealInputs = {
      breakfast: uniqueIngredients((payload.mealInputs.breakfast ?? []).map(normalizeIngredient)),
      lunch: uniqueIngredients((payload.mealInputs.lunch ?? []).map(normalizeIngredient)),
      dinner: uniqueIngredients((payload.mealInputs.dinner ?? []).map(normalizeIngredient))
    };
    const menuCatalog = await loadMenuCatalog();
    const { plan: basePlan, candidates } = buildDailyMealPlanWithCandidates({
      child: payload.child,
      mealInputs: normalizedMealInputs,
      menuCatalog
    });
    const openAiConfig = getOpenAiConfig();
    const results = { ...basePlan.results };

    for (const mealType of MEAL_TYPES) {
      const outcome = await enhanceMealResultWithAi({
        request,
        child: payload.child,
        mealType,
        normalizedInputIngredients: normalizedMealInputs[mealType],
        selectedResult: basePlan.results[mealType],
        candidates: candidates[mealType] ?? [],
        openAiConfig
      });

      results[mealType] = outcome.result;

      await writeAiGenerationLog(
        request,
        mealType,
        outcome.validationStatus,
        outcome.fallbackUsed,
        outcome.requestPayload,
        outcome.responsePayload
      );
    }

    return jsonResponse({
      ...basePlan,
      results
    });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    console.warn("generate-meal-plan failed", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Failed to generate meal plan"
      },
      500
    );
  }
});
