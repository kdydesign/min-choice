import { getSupabaseClient } from "../../../lib/supabase";
import { isUuid } from "../../../lib/is-uuid";
import { readJson, writeJson } from "../../../services/storage/browser-storage";
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

const STORAGE_KEY = "min-baby-meals.meal-plans";

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

function parseMealRecommendation(
  value: unknown,
  mealType: MealType,
  mealInputs: string[]
): MealRecommendation {
  const raw = typeof value === "object" && value !== null ? (value as Partial<MealRecommendation>) : {};
  const usedIngredients = parseStringArray(raw.usedIngredients);
  const missingIngredients = parseStringArray(raw.missingIngredients);
  const inputIngredients = parseStringArray(raw.inputIngredients);
  const allIngredients = parseStringArray(raw.allIngredients);

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
      mealInputs[mealType]
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

async function listMealPlansLocally(childId: string) {
  return sortPlans(
    readJson<DailyMealPlan[]>(STORAGE_KEY, []).filter((item) => item.childId === childId)
  );
}

async function saveMealPlanLocally(input: SaveMealPlanInput) {
  const plans = readJson<DailyMealPlan[]>(STORAGE_KEY, []);
  writeJson(STORAGE_KEY, [input.plan, ...plans]);
  return input.plan;
}

async function deleteMealPlansByChildLocally(childId: string) {
  const plans = readJson<DailyMealPlan[]>(STORAGE_KEY, []).filter((item) => item.childId !== childId);
  writeJson(STORAGE_KEY, plans);
}

export async function listMealPlansByChild(childId: string) {
  const supabase = getSupabaseClient();

  if (!supabase || !isUuid(childId)) {
    return listMealPlansLocally(childId);
  }

  try {
    await ensureSupabasePersistenceReady();
    const userId = await getSupabaseCurrentUserId();

    if (!userId) {
      return listMealPlansLocally(childId);
    }

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

    return (data ?? []).map((row) => mapMealPlanRow(row as MealPlanRow, childRecord.name));
  } catch (error) {
    console.warn("Falling back to local meal plan storage", error);
    return listMealPlansLocally(childId);
  }
}

export async function saveMealPlan(input: SaveMealPlanInput) {
  const supabase = getSupabaseClient();

  if (!supabase || !isUuid(input.plan.childId)) {
    return saveMealPlanLocally(input);
  }

  try {
    await ensureSupabasePersistenceReady();
    const userId = await getSupabaseCurrentUserId();

    if (!userId) {
      return saveMealPlanLocally(input);
    }

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
  } catch (error) {
    console.warn("Falling back to local meal plan save", error);
    return saveMealPlanLocally(input);
  }
}

export async function deleteMealPlansByChild(childId: string) {
  const supabase = getSupabaseClient();

  if (!supabase || !isUuid(childId)) {
    return deleteMealPlansByChildLocally(childId);
  }

  try {
    await ensureSupabasePersistenceReady();
    const userId = await getSupabaseCurrentUserId();

    if (!userId) {
      return deleteMealPlansByChildLocally(childId);
    }

    const { error: deleteInputsError } = await supabase.from("meal_inputs").delete().eq("child_id", childId);

    if (deleteInputsError) {
      throw deleteInputsError;
    }

    const { error: deletePlansError } = await supabase.from("meal_plans").delete().eq("child_id", childId);

    if (deletePlansError) {
      throw deletePlansError;
    }
  } catch (error) {
    console.warn("Falling back to local meal plan delete", error);
    return deleteMealPlansByChildLocally(childId);
  }
}
