import { getSupabaseClient } from "../../../lib/supabase";
import { isUuid } from "../../../lib/is-uuid";
import {
  MEAL_TYPES,
  type DailyMealPlan,
  type MealRecommendation,
  type MealType,
  type PlanNotice
} from "../../../types/domain";
import {
  ensureSupabasePersistenceReady,
  getSupabaseCurrentUserId
} from "../../auth/api/supabase-bootstrap-service";
import {
  getMealMetricsByType,
  getMenuDefinitionByKey
} from "../../menus/data/menu-catalog";

interface MealPlanRow {
  id: string;
  child_id: string;
  created_at: string;
  notices_json: unknown;
  meal_plan_items?: MealPlanItemRow[] | null;
  meal_inputs?: MealInputRow[] | null;
}

interface MealPlanItemRow {
  meal_type: string;
  result_payload_json: unknown;
}

interface MealInputRow {
  meal_type: string;
  original_ingredients_json: unknown;
  normalized_ingredients_json: unknown;
}

export interface SaveMealPlanInput {
  plan: DailyMealPlan;
  sourceMealInputs?: Record<MealType, string[]>;
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parsePlanNotices(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as PlanNotice[];
  }

  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("tone" in item) ||
      !("message" in item) ||
      typeof item.tone !== "string" ||
      typeof item.message !== "string"
    ) {
      return [];
    }

    if (!["warning", "danger", "success"].includes(item.tone)) {
      return [];
    }

    return [{ tone: item.tone as PlanNotice["tone"], message: item.message }];
  });
}

function parseSubstituteMap(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {} as Record<string, string[]>;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, parseStringArray(item)])
  );
}

function parseNumericValue(value: unknown, fallback: number) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

function parseMealRecommendation(
  value: unknown,
  mealType: MealType,
  mealInputs: string[],
  storedItem?: MealPlanItemRow | null
): MealRecommendation {
  const raw = typeof value === "object" && value !== null ? (value as Partial<MealRecommendation>) : {};
  const usedIngredients = parseStringArray(raw.usedIngredients);
  const missingIngredients = parseStringArray(raw.missingIngredients);
  const inputIngredients = parseStringArray(raw.inputIngredients);
  const allIngredients = parseStringArray(raw.allIngredients);
  const menuDefinition = getMenuDefinitionByKey({
    id: typeof raw.id === "string" ? raw.id : null,
    name: typeof raw.name === "string" ? raw.name : null
  });
  const metricFallback = menuDefinition ?? getMealMetricsByType(mealType);

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `saved-${mealType}`,
    name: typeof raw.name === "string" && raw.name ? raw.name : `${mealType} 추천`,
    cookingStyle: typeof raw.cookingStyle === "string" ? raw.cookingStyle : "추천",
    mainProtein: typeof raw.mainProtein === "string" ? raw.mainProtein : "맞춤형",
    description: typeof raw.description === "string" ? raw.description : "저장된 식단 추천",
    textureNote:
      typeof raw.textureNote === "string"
        ? raw.textureNote
        : "아이가 먹기 좋은 질감을 확인해 주세요.",
    caution: typeof raw.caution === "string" ? raw.caution : "",
    recommendationText:
      typeof raw.recommendationText === "string" ? raw.recommendationText : "저장된 식단 기록입니다.",
    recipeSummary: parseStringArray(raw.recipeSummary),
    missingIngredientExplanation:
      typeof raw.missingIngredientExplanation === "string"
        ? raw.missingIngredientExplanation
        : "",
    usedIngredients,
    missingIngredients,
    substitutes: parseSubstituteMap(raw.substitutes),
    excludedAllergyIngredients: parseStringArray(raw.excludedAllergyIngredients),
    alternatives: parseStringArray(raw.alternatives),
    inputIngredients: inputIngredients.length > 0 ? inputIngredients : mealInputs,
    allIngredients:
      allIngredients.length > 0 ? allIngredients : [...new Set([...usedIngredients, ...missingIngredients])],
    calories: parseNumericValue(raw.calories, metricFallback.calories),
    protein: parseNumericValue(raw.protein, metricFallback.protein),
    cookTimeMinutes: parseNumericValue(raw.cookTimeMinutes, metricFallback.cookTimeMinutes),
    promptVersion: typeof raw.promptVersion === "string" ? raw.promptVersion : "saved-plan-v1",
    isFallback: Boolean(raw.isFallback)
  };
}

function sortPlans(plans: DailyMealPlan[]) {
  return [...plans].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function getDateOnly(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildMealInputsMap(rows: MealInputRow[] | null | undefined) {
  const mealInputs = {
    breakfast: [] as string[],
    lunch: [] as string[],
    dinner: [] as string[]
  };

  rows?.forEach((row) => {
    if (!MEAL_TYPES.includes(row.meal_type as MealType)) {
      return;
    }

    const mealType = row.meal_type as MealType;
    const originalIngredients = parseStringArray(row.original_ingredients_json);
    const normalizedIngredients = parseStringArray(row.normalized_ingredients_json);
    mealInputs[mealType] = originalIngredients.length > 0 ? originalIngredients : normalizedIngredients;
  });

  return mealInputs;
}

function mapMealPlanRow(row: MealPlanRow, childName: string): DailyMealPlan {
  const mealInputs = buildMealInputsMap(row.meal_inputs);
  const results = {} as Record<MealType, MealRecommendation>;

  MEAL_TYPES.forEach((mealType) => {
    const matchedItem = row.meal_plan_items?.find((item) => item.meal_type === mealType);
    results[mealType] = parseMealRecommendation(
      matchedItem?.result_payload_json,
      mealType,
      mealInputs[mealType],
      matchedItem
    );
  });

  return {
    id: row.id,
    childId: row.child_id,
    childName,
    createdAt: row.created_at,
    mealInputs,
    notices: parsePlanNotices(row.notices_json),
    results
  };
}

async function requireMealPlanContext() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase 연결이 없어 식단 이력을 불러올 수 없어요.");
  }

  await ensureSupabasePersistenceReady();

  const userId = await getSupabaseCurrentUserId();

  if (!userId) {
    throw new Error("Supabase 세션을 준비하지 못해 식단 이력을 처리할 수 없어요.");
  }

  return { supabase, userId };
}

export async function listMealPlansByChild(childId: string) {
  if (!isUuid(childId)) {
    return [];
  }

  const { supabase, userId } = await requireMealPlanContext();
  const { data: childRecord, error: childError } = await supabase
    .from("children")
    .select("name")
    .eq("id", childId)
    .eq("owner_user_id", userId)
    .single<{ name: string }>();

  if (childError) {
    throw childError;
  }

  const { data, error } = await supabase
    .from("meal_plans")
    .select(
      "id, child_id, created_at, notices_json, meal_plan_items(meal_type, result_payload_json), meal_inputs(meal_type, original_ingredients_json, normalized_ingredients_json)"
    )
    .eq("child_id", childId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return sortPlans((data ?? []).map((row) => mapMealPlanRow(row as MealPlanRow, childRecord.name)));
}

export async function getMealPlanById(mealPlanId: string) {
  if (!isUuid(mealPlanId)) {
    return null;
  }

  const { supabase, userId } = await requireMealPlanContext();
  const { data, error } = await supabase
    .from("meal_plans")
    .select(
      "id, child_id, created_at, notices_json, meal_plan_items(meal_type, result_payload_json), meal_inputs(meal_type, original_ingredients_json, normalized_ingredients_json)"
    )
    .eq("id", mealPlanId)
    .single<MealPlanRow>();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw error;
  }

  const { data: childRecord, error: childError } = await supabase
    .from("children")
    .select("name")
    .eq("id", data.child_id)
    .eq("owner_user_id", userId)
    .single<{ name: string }>();

  if (childError) {
    if (childError.code === "PGRST116") {
      return null;
    }

    throw childError;
  }

  return mapMealPlanRow(data as MealPlanRow, childRecord.name);
}

export async function saveMealPlan(input: SaveMealPlanInput) {
  if (!isUuid(input.plan.childId)) {
    throw new Error("식단을 저장할 아이 프로필 ID가 올바르지 않아요.");
  }

  const { supabase, userId } = await requireMealPlanContext();
  const { plan, sourceMealInputs = input.plan.mealInputs } = input;
  const { data: insertedPlan, error: insertPlanError } = await supabase
    .from("meal_plans")
    .insert({
      child_id: plan.childId,
      plan_date: getDateOnly(plan.createdAt),
      created_by_user_id: userId,
      created_at: plan.createdAt,
      updated_at: plan.createdAt,
      notices_json: plan.notices
    })
    .select("id, child_id, created_at, notices_json")
    .single<Pick<MealPlanRow, "id" | "child_id" | "created_at" | "notices_json">>();

  if (insertPlanError) {
    throw insertPlanError;
  }

  const itemRows = MEAL_TYPES.map((mealType) => ({
    meal_plan_id: insertedPlan.id,
    meal_type: mealType,
    menu_id: null,
    menu_name: plan.results[mealType].name,
    used_ingredient_keys_json: plan.results[mealType].usedIngredients,
    missing_ingredient_keys_json: plan.results[mealType].missingIngredients,
    substitutes_json: plan.results[mealType].substitutes,
    ai_recommendation: plan.results[mealType].recommendationText,
    recipe_summary_json: plan.results[mealType].recipeSummary,
    recipe_full_json: plan.results[mealType].recipeSummary,
    caution: plan.results[mealType].caution,
    excluded_allergy_ingredients_json: plan.results[mealType].excludedAllergyIngredients,
    prompt_version: plan.results[mealType].promptVersion,
    is_fallback: plan.results[mealType].isFallback,
    result_payload_json: plan.results[mealType],
    created_at: plan.createdAt
  }));

  const { error: insertItemsError } = await supabase.from("meal_plan_items").insert(itemRows);

  if (insertItemsError) {
    await supabase.from("meal_plans").delete().eq("id", insertedPlan.id);
    throw insertItemsError;
  }

  const inputRows = MEAL_TYPES.map((mealType) => ({
    meal_plan_id: insertedPlan.id,
    child_id: plan.childId,
    input_date: getDateOnly(plan.createdAt),
    meal_type: mealType,
    original_ingredients_json: sourceMealInputs[mealType],
    normalized_ingredients_json: plan.mealInputs[mealType],
    excluded_allergy_ingredients_json: plan.results[mealType].excludedAllergyIngredients,
    created_at: plan.createdAt
  }));

  const { error: insertInputsError } = await supabase.from("meal_inputs").insert(inputRows);

  if (insertInputsError) {
    await supabase.from("meal_plans").delete().eq("id", insertedPlan.id);
    throw insertInputsError;
  }

  return {
    ...plan,
    id: insertedPlan.id,
    createdAt: insertedPlan.created_at,
    notices: parsePlanNotices(insertedPlan.notices_json)
  };
}

export async function deleteMealPlansByChild(childId: string) {
  if (!isUuid(childId)) {
    return;
  }

  const { supabase, userId } = await requireMealPlanContext();
  const { error: deleteInputsError } = await supabase
    .from("meal_inputs")
    .delete()
    .eq("child_id", childId);

  if (deleteInputsError) {
    throw deleteInputsError;
  }

  const { error: deletePlansError } = await supabase
    .from("meal_plans")
    .delete()
    .eq("child_id", childId)
    .eq("created_by_user_id", userId);

  if (deletePlansError) {
    throw deletePlansError;
  }
}
