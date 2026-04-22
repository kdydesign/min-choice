import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  loadIngredientCatalog,
  loadMenuCatalog,
  type IngredientCatalogItem
} from "../_shared/catalog-repository.ts";
import {
  normalizeIngredient,
  uniqueIngredients
} from "../../../src/features/ingredients/lib/ingredient-utils.ts";
import { deriveAgeMonthsFromBirthDate } from "../../../src/features/children/lib/profile-date-utils.ts";
import { guardGeneratedMealContent } from "../../../src/features/meal-plans/lib/ai-response-guard.ts";
import {
  PANTRY_BASICS,
  validateAiMealSelection,
  validateMealNutrition,
  type MealHistorySnapshot,
  type ValidatedAiMealSelection
} from "../../../src/features/meal-plans/lib/ai-menu-selection.ts";
import { buildDailyMealPlanWithCandidates } from "../../../src/features/meal-plans/lib/plan-generator.ts";
import {
  MEAL_TYPES,
  type ChildProfile,
  type MealRecommendation,
  type MealType,
  type MenuDefinition
} from "../../../src/types/domain.ts";
import type {
  AiMealResponse,
  GenerateMealPlanPayload
} from "../../../src/features/meal-plans/types/generation-contract.ts";
import {
  MEAL_LABELS,
  resolveNormalizedMenuFamily
} from "../../../src/features/menus/data/menu-catalog.ts";

interface OpenAiConfig {
  apiKey: string;
  model: string;
}

interface AiAttemptRecord {
  attemptNumber: 1 | 2;
  requestPayload: unknown;
  responsePayload: unknown;
  validationStatus: string;
  failureReasons: string[];
}

interface AiGenerationOutcome {
  result: MealRecommendation;
  validationStatus: string;
  fallbackUsed: boolean;
  requestPayload: unknown;
  responsePayload: unknown;
}

interface MealPlanHistoryRow {
  created_at: string;
  meal_plan_items?: MealPlanHistoryItemRow[] | null;
}

interface MealPlanHistoryItemRow {
  meal_type: string;
  menu_name?: unknown;
  result_payload_json?: unknown;
}

class RequestValidationError extends Error {}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const AI_PROMPT_VERSION = "openai-meal-selector-v1";
const MAX_ATTEMPTS_PER_MEAL = 2;
const MAX_CANDIDATES = 5;
const AI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    selectedMenu: { type: "string" },
    cookingStyle: { type: "string" },
    mainProtein: { type: "string" },
    usedIngredients: {
      type: "array",
      items: { type: "string" }
    },
    optionalAddedIngredients: {
      type: "array",
      items: { type: "string" }
    },
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
    recommendation: { type: "string" },
    recipeSummary: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" }
    },
    recipeFull: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: { type: "string" }
    },
    textureGuide: { type: "string" },
    caution: { type: "string" },
    menuFamily: { type: ["string", "null"] },
    calories: { type: ["number", "string"] },
    protein: { type: ["number", "string"] },
    cookTimeMinutes: { type: ["number", "string"] }
  },
  required: [
    "selectedMenu",
    "cookingStyle",
    "mainProtein",
    "usedIngredients",
    "optionalAddedIngredients",
    "missingIngredients",
    "missingIngredientExplanation",
    "substitutes",
    "recommendation",
    "recipeSummary",
    "recipeFull",
    "textureGuide",
    "caution",
    "menuFamily",
    "calories",
    "protein",
    "cookTimeMinutes"
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

function parseAgeMonths(value: unknown, birthDate?: string) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (Number.isFinite(parsedValue) && parsedValue >= 0) {
    return parsedValue;
  }

  const derivedAgeMonths = birthDate ? deriveAgeMonthsFromBirthDate(birthDate) : null;

  if (derivedAgeMonths === null) {
    throw new RequestValidationError("child.ageMonths or child.birthDate must be valid");
  }

  return derivedAgeMonths;
}

function parseGenerateMealPlanRequest(value: unknown): GenerateMealPlanPayload {
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
  const birthDate = parseOptionalString(value.child.birthDate);

  return {
    child: {
      id: parseRequiredString(value.child.id, "child.id"),
      name: parseRequiredString(value.child.name, "child.name"),
      ageMonths: parseAgeMonths(value.child.ageMonths, birthDate),
      birthDate,
      allergies: parseStringArrayField(value.child.allergies ?? [], "child.allergies"),
      createdAt: parseOptionalString(value.child.createdAt, now),
      updatedAt: parseOptionalString(value.child.updatedAt, now)
    },
    mealInputs: {
      breakfast: parseStringArrayField(value.mealInputs.breakfast, "mealInputs.breakfast"),
      lunch: parseStringArrayField(value.mealInputs.lunch, "mealInputs.lunch"),
      dinner: parseStringArrayField(value.mealInputs.dinner, "mealInputs.dinner")
    },
    generationMode:
      value.generationMode === "ingredient_first" || value.generationMode === "auto_recommend"
        ? value.generationMode
        : undefined,
    allowAutoSupplement:
      typeof value.allowAutoSupplement === "boolean" ? value.allowAutoSupplement : undefined
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

function isAiSubstituteItems(value: unknown) {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (item) =>
      isRecord(item) &&
      typeof item.ingredient === "string" &&
      isStringArray(item.substitutes)
  );
}

function isAiMealResponse(value: unknown): value is AiMealResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.selectedMenu === "string" &&
    typeof value.cookingStyle === "string" &&
    typeof value.mainProtein === "string" &&
    isStringArray(value.usedIngredients) &&
    isStringArray(value.optionalAddedIngredients) &&
    isStringArray(value.missingIngredients) &&
    typeof value.missingIngredientExplanation === "string" &&
    isAiSubstituteItems(value.substitutes) &&
    typeof value.recommendation === "string" &&
    isStringArray(value.recipeSummary) &&
    isStringArray(value.recipeFull) &&
    typeof value.textureGuide === "string" &&
    typeof value.caution === "string" &&
    (value.menuFamily === null || typeof value.menuFamily === "string") &&
    (typeof value.calories === "number" || typeof value.calories === "string") &&
    (typeof value.protein === "number" || typeof value.protein === "string") &&
    (typeof value.cookTimeMinutes === "number" || typeof value.cookTimeMinutes === "string")
  );
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

function createGeneratedMenuId(mealType: MealType, selectedMenu: string) {
  const slug =
    selectedMenu
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || mealType;

  return `ai-${mealType}-${slug}-${crypto.randomUUID().slice(0, 8)}`;
}

function roundScore(value: number) {
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

function buildScoringMetadata(
  inputIngredients: string[],
  usedIngredients: string[],
  missingIngredients: string[],
  normalizedMenuFamily: string,
  priorMeals: MealHistorySnapshot[]
) {
  const usedInputCount = usedIngredients.filter((ingredient) => inputIngredients.includes(ingredient)).length;
  const priorFamilySet = new Set(
    priorMeals
      .map((item) => item.menuFamily?.trim())
      .filter((item): item is string => Boolean(item))
  );

  return {
    ingredientUtilizationScore:
      inputIngredients.length > 0 ? roundScore(usedInputCount / inputIngredients.length) : 0,
    ingredientCoverageScore:
      usedIngredients.length > 0 ? roundScore(usedInputCount / usedIngredients.length) : 0,
    lowMissingIngredientScore: roundScore(1 / (1 + missingIngredients.length)),
    diversityScore: priorFamilySet.has(normalizedMenuFamily) ? 0.45 : 0.85
  };
}

function resolveDescription(
  mealType: MealType,
  selectedMenu: string,
  cookingStyle: string,
  resolvedMenu: MenuDefinition | null
) {
  if (resolvedMenu?.description) {
    return resolvedMenu.description;
  }

  return `${MEAL_LABELS[mealType]}에 맞춘 ${selectedMenu} ${cookingStyle} 메뉴`;
}

function buildMealSnapshot(mealType: MealType, result: MealRecommendation): MealHistorySnapshot {
  return {
    mealType,
    menu: result.name,
    menuFamily: resolveNormalizedMenuFamily({
      selectedMenu: result.name,
      cookingStyle: result.cookingStyle,
      menuFamily: result.menuFamily
    }),
    mainProtein: result.mainProtein
  };
}

function buildCandidateMenus(
  candidates: MealRecommendation[],
  menuCatalog: MenuDefinition[],
  mealType: MealType
) {
  return candidates.slice(0, MAX_CANDIDATES).map((candidate) => {
    const resolvedMenu =
      menuCatalog.find((menu) => menu.id === candidate.id || menu.name === candidate.name) ?? null;

    return {
      name: candidate.name,
      menuFamily: resolveNormalizedMenuFamily({
        selectedMenu: candidate.name,
        cookingStyle: candidate.cookingStyle,
        menuFamily: candidate.menuFamily
      }),
      mealType,
      cookingStyle: candidate.cookingStyle,
      mainProtein: candidate.mainProtein,
      usedIngredients: candidate.usedIngredients,
      missingIngredients: candidate.missingIngredients,
      optionalAddedIngredients: candidate.optionalAddedIngredients,
      textureGuide: candidate.textureNote,
      caution: candidate.caution,
      ageSuitability: {
        minAgeMonths: resolvedMenu?.minAgeMonths ?? null,
        maxAgeMonths: resolvedMenu?.maxAgeMonths ?? null
      }
    };
  });
}

function buildAiRequestPayload(input: {
  child: ChildProfile;
  mealType: MealType;
  generationMode: "ingredient_first" | "auto_recommend";
  normalizedInputIngredients: string[];
  allowedSupplements: string[];
  recentHistory: MealHistorySnapshot[];
  currentRequestSelections: MealHistorySnapshot[];
  candidates: MealRecommendation[];
  rulesFallback: MealRecommendation;
  menuCatalog: MenuDefinition[];
  ingredientCatalog: IngredientCatalogItem[];
  attemptNumber: 1 | 2;
  retryReasons: string[];
}) {
  const knownIngredients =
    input.generationMode === "auto_recommend"
      ? uniqueIngredients(input.ingredientCatalog.map((item) => item.standardKey))
      : uniqueIngredients([
          ...input.normalizedInputIngredients,
          ...input.allowedSupplements,
          ...PANTRY_BASICS
        ]);

  return {
    promptVersion: AI_PROMPT_VERSION,
    attemptNumber: input.attemptNumber,
    retryReasons: [...input.retryReasons],
    child: {
      ageMonths: input.child.ageMonths,
      birthDate: input.child.birthDate,
      allergies: uniqueIngredients(input.child.allergies)
    },
    mealType: input.mealType,
    generationMode: input.generationMode,
    normalizedInputIngredients: [...input.normalizedInputIngredients],
    allowedSupplements: [...input.allowedSupplements],
    pantryBasics: [...PANTRY_BASICS],
    knownIngredients,
    recentHistory: input.recentHistory.map((item) => ({ ...item })),
    currentRequestSelections: input.currentRequestSelections.map((item) => ({ ...item })),
    rulesFallback: {
      selectedMenu: input.rulesFallback.name,
      cookingStyle: input.rulesFallback.cookingStyle,
      mainProtein: input.rulesFallback.mainProtein,
      usedIngredients: input.rulesFallback.usedIngredients,
      optionalAddedIngredients: input.rulesFallback.optionalAddedIngredients,
      missingIngredients: input.rulesFallback.missingIngredients,
      substitutes: input.rulesFallback.substitutes,
      menuFamily: resolveNormalizedMenuFamily({
        selectedMenu: input.rulesFallback.name,
        cookingStyle: input.rulesFallback.cookingStyle,
        menuFamily: input.rulesFallback.menuFamily
      })
    },
    candidateMenus: buildCandidateMenus(input.candidates, input.menuCatalog, input.mealType)
  };
}

function buildSystemPrompt() {
  return [
    "당신은 아이 맞춤 식단 앱의 서버사이드 메뉴 선택기입니다.",
    "반드시 JSON만 반환하세요.",
    "한 번의 응답에서 메뉴 선택, 재료 구성, 자연어 설명, 영양/조리시간 추정까지 모두 반환하세요.",
    "child.ageMonths에 맞는 안전한 식감과 조리 난이도를 우선하세요.",
    "recentHistory와 currentRequestSelections에 있는 메뉴명과 menuFamily는 가능한 한 피하세요.",
    "attemptNumber가 2이거나 retryReasons가 있으면 해당 실패 이유를 반드시 피해서 다시 선택하세요.",
    "ingredient_first에서는 normalizedInputIngredients를 우선 사용하고, 핵심 재료 추가는 allowedSupplements 안에서만 허용하세요.",
    "ingredient_first에서 allowedSupplements 밖 재료를 usedIngredients나 missingIngredients에 넣으면 안 됩니다.",
    "auto_recommend에서는 knownIngredients와 pantryBasics 범위 안의 재료만 사용하세요.",
    "usedIngredients는 실제로 이번 메뉴에 사용하는 재료만 적고, optionalAddedIngredients는 입력 재료가 아닌데 실제로 추가해 사용한 재료만 적으세요.",
    "missingIngredients는 있으면 더 좋지만 현재 없는 재료만 적고, usedIngredients와 겹치면 안 됩니다.",
    "substitutes의 ingredient는 missingIngredients 안에 있어야 하며 substitutes 값도 허용 가능한 재료명만 써야 합니다.",
    "menuFamily는 참고용 힌트로만 쓰고, cookingStyle과 selectedMenu에 맞는 값을 적으세요.",
    "recipeSummary는 정확히 3줄, recipeFull은 5단계 이상 8단계 이하로 작성하세요.",
    "recommendation, missingIngredientExplanation, textureGuide, caution, recipeSummary, recipeFull에는 알레르기 재료나 위험한 표현을 포함하지 마세요.",
    "calories, protein, cookTimeMinutes는 현실적인 이유식/유아식 범위로 추정하세요."
  ].join(" ");
}

async function requestOpenAiMealSelection(
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
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meal_plan_ai_selection_response",
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
    parsed,
    responsePayload
  };
}

function extractHistorySnapshot(item: MealPlanHistoryItemRow): MealHistorySnapshot | null {
  if (!MEAL_TYPES.includes(item.meal_type as MealType)) {
    return null;
  }

  const mealType = item.meal_type as MealType;
  const raw = isRecord(item.result_payload_json) ? item.result_payload_json : {};
  const menuName =
    typeof item.menu_name === "string" && item.menu_name.trim()
      ? item.menu_name.trim()
      : typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : null;

  if (!menuName) {
    return null;
  }

  return {
    mealType,
    menu: menuName,
    menuFamily: resolveNormalizedMenuFamily({
      selectedMenu: menuName,
      cookingStyle: typeof raw.cookingStyle === "string" ? raw.cookingStyle : null,
      menuFamily: typeof raw.menuFamily === "string" ? raw.menuFamily : null
    }),
    mainProtein:
      typeof raw.mainProtein === "string" && raw.mainProtein.trim() ? raw.mainProtein.trim() : "채소"
  };
}

async function loadRecentMealHistory(request: Request, childId: string) {
  const supabase = createSupabaseLogClient(request);

  if (!supabase) {
    return [] as MealHistorySnapshot[];
  }

  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("created_at, meal_plan_items(meal_type, menu_name, result_payload_json)")
      .eq("child_id", childId)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).flatMap((row) => {
      const typedRow = row as MealPlanHistoryRow;
      return (typedRow.meal_plan_items ?? [])
        .map((item) => extractHistorySnapshot(item))
        .filter((item): item is MealHistorySnapshot => Boolean(item));
    });
  } catch (error) {
    console.warn("Failed to load recent meal history", error);
    return [];
  }
}

function buildAiResult(input: {
  mealType: MealType;
  child: ChildProfile;
  normalizedInputIngredients: string[];
  validatedSelection: ValidatedAiMealSelection;
  guardedNarrative: ReturnType<typeof guardGeneratedMealContent>;
  nutrition: ReturnType<typeof validateMealNutrition>;
  rulesFallback: MealRecommendation;
  candidates: MealRecommendation[];
  menuCatalog: MenuDefinition[];
  priorMeals: MealHistorySnapshot[];
}) {
  const resolvedMenu =
    input.menuCatalog.find((menu) => menu.name === input.validatedSelection.selectedMenu) ?? null;

  return {
    id: resolvedMenu?.id ?? createGeneratedMenuId(input.mealType, input.validatedSelection.selectedMenu),
    name: input.validatedSelection.selectedMenu,
    menuFamily: input.validatedSelection.normalizedMenuFamily,
    cookingStyle: input.validatedSelection.cookingStyle,
    mainProtein: input.validatedSelection.mainProtein,
    description: resolveDescription(
      input.mealType,
      input.validatedSelection.selectedMenu,
      input.validatedSelection.cookingStyle,
      resolvedMenu
    ),
    textureNote:
      input.validatedSelection.textureGuide ||
      resolvedMenu?.textureNote ||
      "아이가 먹기 좋은 부드러운 질감으로 마무리해 주세요.",
    caution: input.guardedNarrative.caution,
    recommendationText: input.guardedNarrative.recommendationText,
    recipeSummary: input.guardedNarrative.recipeSummary,
    recipeFull: input.guardedNarrative.recipeFull,
    missingIngredientExplanation: input.guardedNarrative.missingIngredientExplanation,
    usedIngredients: input.validatedSelection.usedIngredients,
    missingIngredients: input.validatedSelection.missingIngredients,
    optionalAddedIngredients: input.validatedSelection.optionalAddedIngredients,
    substitutes: input.validatedSelection.substitutes,
    excludedAllergyIngredients: input.rulesFallback.excludedAllergyIngredients,
    alternatives: input.candidates
      .map((candidate) => candidate.name)
      .filter((name) => name !== input.validatedSelection.selectedMenu)
      .slice(0, 2),
    inputIngredients: input.normalizedInputIngredients,
    allIngredients: uniqueIngredients([
      ...input.validatedSelection.usedIngredients,
      ...input.validatedSelection.missingIngredients,
      ...input.validatedSelection.optionalAddedIngredients
    ]),
    nutritionEstimate: input.nutrition.nutritionEstimate,
    scoringMetadata: buildScoringMetadata(
      input.normalizedInputIngredients,
      input.validatedSelection.usedIngredients,
      input.validatedSelection.missingIngredients,
      input.validatedSelection.normalizedMenuFamily,
      input.priorMeals
    ),
    inputStrength: input.rulesFallback.inputStrength,
    calories: input.nutrition.calories,
    protein: input.nutrition.protein,
    cookTimeMinutes: input.nutrition.cookTimeMinutes,
    promptVersion: AI_PROMPT_VERSION,
    isFallback: false,
    selectionSource: "ai",
    nutritionSource: input.nutrition.nutritionSource
  } satisfies MealRecommendation;
}

function getFallbackNoticeMessage(mealType: MealType) {
  return `${MEAL_LABELS[mealType]}은 정확히 맞는 메뉴가 적어 기본 대체 메뉴를 추천했어요.`;
}

function filterNotices(
  notices: Array<{ tone: "warning" | "danger" | "success"; message: string }>,
  aiSelectedMeals: Set<MealType>
) {
  return notices.filter((notice) => {
    return ![...aiSelectedMeals].some((mealType) => notice.message === getFallbackNoticeMessage(mealType));
  });
}

async function generateMealWithAi(input: {
  request: Request;
  child: ChildProfile;
  mealType: MealType;
  generationMode: "ingredient_first" | "auto_recommend";
  normalizedInputIngredients: string[];
  allowedSupplements: string[];
  recentHistory: MealHistorySnapshot[];
  currentRequestSelections: MealHistorySnapshot[];
  candidates: MealRecommendation[];
  rulesFallback: MealRecommendation;
  menuCatalog: MenuDefinition[];
  ingredientCatalog: IngredientCatalogItem[];
  openAiConfig: OpenAiConfig | null;
}): Promise<AiGenerationOutcome> {
  const aggregatedRequestPayload = {
    promptVersion: AI_PROMPT_VERSION,
    mealType: input.mealType,
    generationMode: input.generationMode,
    normalizedInputIngredients: [...input.normalizedInputIngredients],
    allowedSupplements: [...input.allowedSupplements],
    recentHistory: input.recentHistory.map((item) => ({ ...item })),
    currentRequestSelections: input.currentRequestSelections.map((item) => ({ ...item }))
  };

  if (!input.openAiConfig) {
    return {
      result: input.rulesFallback,
      validationStatus: "skipped-no-openai-config",
      fallbackUsed: true,
      requestPayload: aggregatedRequestPayload,
      responsePayload: {
        reason: "OPENAI_API_KEY is not configured",
        attempts: []
      }
    };
  }

  const attempts: AiAttemptRecord[] = [];
  let retryReasons: string[] = [];

  for (let index = 0; index < MAX_ATTEMPTS_PER_MEAL; index += 1) {
    const attemptNumber = (index + 1) as 1 | 2;
    const requestPayload = buildAiRequestPayload({
      child: input.child,
      mealType: input.mealType,
      generationMode: input.generationMode,
      normalizedInputIngredients: input.normalizedInputIngredients,
      allowedSupplements: input.allowedSupplements,
      recentHistory: input.recentHistory,
      currentRequestSelections: input.currentRequestSelections,
      candidates: input.candidates,
      rulesFallback: input.rulesFallback,
      menuCatalog: input.menuCatalog,
      ingredientCatalog: input.ingredientCatalog,
      attemptNumber,
      retryReasons
    });

    try {
      const { parsed, responsePayload } = await requestOpenAiMealSelection(input.openAiConfig, requestPayload);
      const validation = validateAiMealSelection({
        response: parsed,
        mealType: input.mealType,
        generationMode: input.generationMode,
        ageMonths: input.child.ageMonths,
        allergies: input.child.allergies,
        inputIngredients: input.normalizedInputIngredients,
        allowedSupplements: input.allowedSupplements,
        priorMeals: [...input.recentHistory, ...input.currentRequestSelections],
        ingredientCatalog: input.ingredientCatalog,
        attemptNumber
      });

      if (!validation.ok) {
        attempts.push({
          attemptNumber,
          requestPayload,
          responsePayload,
          validationStatus: "rejected-validation",
          failureReasons: validation.reasons
        });
        retryReasons = validation.reasons;
        continue;
      }

      const guardedNarrative = guardGeneratedMealContent({
        generated: {
          recommendationText: validation.normalized.recommendation,
          recipeSummary: validation.normalized.recipeSummary,
          recipeFull: validation.normalized.recipeFull,
          missingIngredientExplanation: validation.normalized.missingIngredientExplanation,
          caution: validation.normalized.caution,
          promptVersion: AI_PROMPT_VERSION,
          isFallback: false
        },
        mealType: input.mealType,
        ageMonths: input.child.ageMonths,
        menuName: validation.normalized.selectedMenu,
        cookingStyle: validation.normalized.cookingStyle,
        usedIngredients: validation.normalized.usedIngredients,
        missingIngredients: validation.normalized.missingIngredients,
        recipeSummary: validation.normalized.recipeSummary,
        caution: validation.normalized.caution,
        allergies: input.child.allergies
      });

      if (guardedNarrative.isFallback) {
        const failureReasons = ["narrative safety guard rejected the AI response"];
        attempts.push({
          attemptNumber,
          requestPayload,
          responsePayload,
          validationStatus: "rejected-guard",
          failureReasons
        });
        retryReasons = failureReasons;
        continue;
      }

      const nutrition = validateMealNutrition({
        mealType: input.mealType,
        ageMonths: input.child.ageMonths,
        menuFamily: validation.normalized.normalizedMenuFamily,
        usedIngredients: validation.normalized.usedIngredients,
        missingIngredients: validation.normalized.missingIngredients,
        optionalAddedIngredients: validation.normalized.optionalAddedIngredients,
        calories: validation.normalized.calories,
        protein: validation.normalized.protein,
        cookTimeMinutes: validation.normalized.cookTimeMinutes
      });

      const result = buildAiResult({
        mealType: input.mealType,
        child: input.child,
        normalizedInputIngredients: input.normalizedInputIngredients,
        validatedSelection: validation.normalized,
        guardedNarrative,
        nutrition,
        rulesFallback: input.rulesFallback,
        candidates: input.candidates,
        menuCatalog: input.menuCatalog,
        priorMeals: [...input.recentHistory, ...input.currentRequestSelections]
      });

      attempts.push({
        attemptNumber,
        requestPayload,
        responsePayload,
        validationStatus: "accepted",
        failureReasons: []
      });

      return {
        result,
        validationStatus: `accepted-attempt-${attemptNumber}`,
        fallbackUsed: false,
        requestPayload: {
          ...aggregatedRequestPayload,
          attempts: attempts.map((attempt) => ({
            attemptNumber: attempt.attemptNumber,
            requestPayload: attempt.requestPayload
          }))
        },
        responsePayload: {
          attempts: attempts.map((attempt) => ({
            attemptNumber: attempt.attemptNumber,
            validationStatus: attempt.validationStatus,
            failureReasons: attempt.failureReasons,
            responsePayload: attempt.responsePayload
          })),
          finalSelectionSource: "ai",
          finalNutritionSource: result.nutritionSource
        }
      };
    } catch (error) {
      attempts.push({
        attemptNumber,
        requestPayload,
        responsePayload: {
          error: error instanceof Error ? error.message : "Unknown OpenAI error"
        },
        validationStatus: "openai-error",
        failureReasons: [error instanceof Error ? error.message : "Unknown OpenAI error"]
      });
      break;
    }
  }

  return {
    result: input.rulesFallback,
    validationStatus:
      attempts.length > 0 ? attempts[attempts.length - 1].validationStatus : "fallback-no-attempt",
    fallbackUsed: true,
    requestPayload: {
      ...aggregatedRequestPayload,
      attempts: attempts.map((attempt) => ({
        attemptNumber: attempt.attemptNumber,
        requestPayload: attempt.requestPayload
      }))
    },
    responsePayload: {
      attempts: attempts.map((attempt) => ({
        attemptNumber: attempt.attemptNumber,
        validationStatus: attempt.validationStatus,
        failureReasons: attempt.failureReasons,
        responsePayload: attempt.responsePayload
      })),
      finalSelectionSource: "rules_fallback",
      finalNutritionSource: input.rulesFallback.nutritionSource ?? "system_fallback"
    }
  };
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
    const [menuCatalog, ingredientCatalog] = await Promise.all([
      loadMenuCatalog(),
      loadIngredientCatalog()
    ]);
    const { plan: basePlan, candidates } = buildDailyMealPlanWithCandidates({
      child: payload.child,
      mealInputs: normalizedMealInputs,
      generationMode: payload.generationMode,
      allowAutoSupplement: payload.allowAutoSupplement,
      menuCatalog
    });
    const openAiConfig = getOpenAiConfig();
    const recentHistory = await loadRecentMealHistory(request, payload.child.id);
    const results = { ...basePlan.results };
    const currentRequestSelections: MealHistorySnapshot[] = [];
    const aiSelectedMeals = new Set<MealType>();

    for (const mealType of MEAL_TYPES) {
      const rulesFallback = basePlan.results[mealType];
      const generationMode =
        normalizedMealInputs[mealType].length > 0 ? "ingredient_first" : "auto_recommend";
      const outcome = await generateMealWithAi({
        request,
        child: payload.child,
        mealType,
        generationMode,
        normalizedInputIngredients: normalizedMealInputs[mealType],
        allowedSupplements: rulesFallback.optionalAddedIngredients,
        recentHistory,
        currentRequestSelections,
        candidates: candidates[mealType] ?? [],
        rulesFallback,
        menuCatalog,
        ingredientCatalog,
        openAiConfig
      });

      results[mealType] = outcome.result;
      currentRequestSelections.push(buildMealSnapshot(mealType, outcome.result));

      if (outcome.result.selectionSource === "ai") {
        aiSelectedMeals.add(mealType);
      }

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
      notices: filterNotices(basePlan.notices, aiSelectedMeals),
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
