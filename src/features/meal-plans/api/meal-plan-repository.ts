import { getSupabaseClient } from "../../../lib/supabase";
import { isUuid } from "../../../lib/is-uuid";
import {
  MEAL_TYPES,
  type DailyMealPlan,
  type InputStrength,
  type MenuDefinition,
  type MealRecommendation,
  type MealType,
  type PlanNotice
} from "../../../types/domain";
import {
  ensureSupabasePersistenceReady,
  getSupabaseCurrentUserId
} from "../../auth/api/supabase-bootstrap-service";
import {
  getMenuDefinitionByKey
} from "../../menus/data/menu-catalog";
import {
  buildMealInputRows,
  buildMealPlanItemRows,
  getMealPlanDateOnly
} from "../lib/meal-plan-persistence";
import { applyNutritionEstimateToRecommendation } from "../lib/nutrition-estimate";

interface MealPlanRow {
  id: string;
  child_id: string;
  created_at: string;
  notices_json: unknown;
  generation_mode?: unknown;
  allow_auto_supplement?: unknown;
  meal_plan_items?: MealPlanItemRow[] | null;
  meal_inputs?: MealInputRow[] | null;
}

interface MealPlanItemRow {
  meal_type: string;
  result_payload_json: unknown;
  menu_name?: unknown;
  used_ingredient_keys_json?: unknown;
  missing_ingredient_keys_json?: unknown;
  substitutes_json?: unknown;
  ai_recommendation?: unknown;
  recipe_summary_json?: unknown;
  recipe_full_json?: unknown;
  caution?: unknown;
  excluded_allergy_ingredients_json?: unknown;
  prompt_version?: unknown;
  is_fallback?: unknown;
  menu_family?: unknown;
  optional_added_ingredients_json?: unknown;
  nutrition_estimate_json?: unknown;
  scoring_metadata_json?: unknown;
  input_strength?: unknown;
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

function parseInputStrength(value: unknown): InputStrength {
  return typeof value === "string" && ["none", "low", "medium", "high"].includes(value)
    ? (value as InputStrength)
    : "none";
}

function getNutritionFallbackAgeMonths(menuDefinition: MenuDefinition | null): number {
  if (!menuDefinition) {
    return 18;
  }

  const minAgeMonths =
    typeof menuDefinition.minAgeMonths === "number" ? menuDefinition.minAgeMonths : null;
  const maxAgeMonths =
    typeof menuDefinition.maxAgeMonths === "number" ? menuDefinition.maxAgeMonths : null;

  if (minAgeMonths !== null && maxAgeMonths !== null) {
    return Math.round((minAgeMonths + maxAgeMonths) / 2);
  }

  if (maxAgeMonths !== null) {
    return maxAgeMonths;
  }

  if (minAgeMonths !== null) {
    return minAgeMonths;
  }

  return 18;
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
  const allIngredients = parseStringArray(raw.allIngredients);
  const menuDefinition = getMenuDefinitionByKey({
    id: typeof raw.id === "string" ? raw.id : null,
    name: typeof raw.name === "string" ? raw.name : null
  });
  const recipeSummary = parseStringArray(raw.recipeSummary);
  const recipeSummaryFromRow = parseStringArray(storedItem?.recipe_summary_json);
  const recipeFull = parseStringArray(raw.recipeFull);
  const recipeFullFromRow = parseStringArray(storedItem?.recipe_full_json);
  const inputIngredients = parseStringArray(raw.inputIngredients);
  const usedIngredientsFromRow = parseStringArray(storedItem?.used_ingredient_keys_json);
  const missingIngredientsFromRow = parseStringArray(storedItem?.missing_ingredient_keys_json);
  const optionalAddedIngredients = parseStringArray(
    raw.optionalAddedIngredients ?? storedItem?.optional_added_ingredients_json
  );
  const scoringMetadataRaw =
    typeof raw.scoringMetadata === "object" && raw.scoringMetadata !== null
      ? raw.scoringMetadata
      : typeof storedItem?.scoring_metadata_json === "object" &&
          storedItem.scoring_metadata_json !== null
        ? storedItem.scoring_metadata_json
        : null;
  const nutritionEstimateRaw =
    typeof raw.nutritionEstimate === "object" && raw.nutritionEstimate !== null
      ? raw.nutritionEstimate
      : typeof storedItem?.nutrition_estimate_json === "object" &&
          storedItem.nutrition_estimate_json !== null
        ? storedItem.nutrition_estimate_json
        : null;
  const hydratedUsedIngredients = usedIngredients.length > 0 ? usedIngredients : usedIngredientsFromRow;
  const hydratedMissingIngredients =
    missingIngredients.length > 0 ? missingIngredients : missingIngredientsFromRow;
  const hydratedSubstitutes =
    Object.keys(parseSubstituteMap(raw.substitutes)).length > 0
      ? parseSubstituteMap(raw.substitutes)
      : parseSubstituteMap(storedItem?.substitutes_json);
  const systemNutrition = applyNutritionEstimateToRecommendation({
    mealType,
    ageMonths: getNutritionFallbackAgeMonths(menuDefinition),
    menuFamily:
      typeof raw.menuFamily === "string" && raw.menuFamily.trim()
        ? raw.menuFamily.trim()
        : typeof storedItem?.menu_family === "string" && storedItem.menu_family.trim()
          ? storedItem.menu_family.trim()
          : menuDefinition?.menuFamily ?? null,
    menu: menuDefinition,
    usedIngredients: hydratedUsedIngredients,
    missingIngredients: hydratedMissingIngredients,
    optionalAddedIngredients
  });
  const calories = parseNumericValue(raw.calories, systemNutrition.calories);
  const protein = parseNumericValue(raw.protein, systemNutrition.protein);
  const cookTimeMinutes = parseNumericValue(raw.cookTimeMinutes, systemNutrition.cookTimeMinutes);

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `saved-${mealType}`,
    name:
      typeof raw.name === "string" && raw.name
        ? raw.name
        : typeof storedItem?.menu_name === "string" && storedItem.menu_name
          ? storedItem.menu_name
          : `${mealType} 추천`,
    menuFamily:
      typeof raw.menuFamily === "string" && raw.menuFamily.trim()
        ? raw.menuFamily.trim()
        : typeof storedItem?.menu_family === "string" && storedItem.menu_family.trim()
          ? storedItem.menu_family.trim()
          : menuDefinition?.menuFamily ?? null,
    cookingStyle: typeof raw.cookingStyle === "string" ? raw.cookingStyle : "추천",
    mainProtein: typeof raw.mainProtein === "string" ? raw.mainProtein : "맞춤형",
    description: typeof raw.description === "string" ? raw.description : "저장된 식단 추천",
    textureNote:
      typeof raw.textureNote === "string"
        ? raw.textureNote
        : "아이가 먹기 좋은 질감을 확인해 주세요.",
    caution:
      typeof raw.caution === "string"
        ? raw.caution
        : typeof storedItem?.caution === "string"
          ? storedItem.caution
          : "",
    recommendationText:
      typeof raw.recommendationText === "string"
        ? raw.recommendationText
        : typeof storedItem?.ai_recommendation === "string"
          ? storedItem.ai_recommendation
          : "저장된 식단 기록입니다.",
    recipeSummary: recipeSummary.length > 0 ? recipeSummary : recipeSummaryFromRow,
    recipeFull:
      recipeFull.length > 0
        ? recipeFull
        : recipeFullFromRow.length > 0
          ? recipeFullFromRow
          : recipeSummary.length > 0
            ? recipeSummary
            : recipeSummaryFromRow,
    missingIngredientExplanation:
      typeof raw.missingIngredientExplanation === "string"
        ? raw.missingIngredientExplanation
        : "",
    usedIngredients: hydratedUsedIngredients,
    missingIngredients: hydratedMissingIngredients,
    optionalAddedIngredients,
    substitutes: hydratedSubstitutes,
    excludedAllergyIngredients:
      parseStringArray(raw.excludedAllergyIngredients).length > 0
        ? parseStringArray(raw.excludedAllergyIngredients)
        : parseStringArray(storedItem?.excluded_allergy_ingredients_json),
    alternatives: parseStringArray(raw.alternatives),
    inputIngredients: inputIngredients.length > 0 ? inputIngredients : mealInputs,
    allIngredients:
      allIngredients.length > 0
        ? allIngredients
        : [...new Set([...hydratedUsedIngredients, ...hydratedMissingIngredients, ...optionalAddedIngredients])],
    nutritionEstimate: {
      caloriesKcal: parseNumericValue(
        nutritionEstimateRaw && "caloriesKcal" in nutritionEstimateRaw
          ? nutritionEstimateRaw.caloriesKcal
          : undefined,
        systemNutrition.nutritionEstimate.caloriesKcal
      ),
      proteinG: parseNumericValue(
        nutritionEstimateRaw && "proteinG" in nutritionEstimateRaw
          ? nutritionEstimateRaw.proteinG
          : undefined,
        systemNutrition.nutritionEstimate.proteinG
      ),
      estimatedCookTimeMin: parseNumericValue(
        nutritionEstimateRaw && "estimatedCookTimeMin" in nutritionEstimateRaw
          ? nutritionEstimateRaw.estimatedCookTimeMin
          : undefined,
        systemNutrition.nutritionEstimate.estimatedCookTimeMin
      ),
      confidence:
        nutritionEstimateRaw &&
        "confidence" in nutritionEstimateRaw &&
        typeof nutritionEstimateRaw.confidence === "string" &&
        ["low", "medium", "high"].includes(nutritionEstimateRaw.confidence)
          ? (nutritionEstimateRaw.confidence as "low" | "medium" | "high")
          : systemNutrition.nutritionEstimate.confidence,
      basisNote:
        nutritionEstimateRaw &&
        "basisNote" in nutritionEstimateRaw &&
        typeof nutritionEstimateRaw.basisNote === "string"
          ? nutritionEstimateRaw.basisNote
          : systemNutrition.nutritionEstimate.basisNote
    },
    scoringMetadata: {
      ingredientUtilizationScore: parseNumericValue(
        scoringMetadataRaw && "ingredientUtilizationScore" in scoringMetadataRaw
          ? scoringMetadataRaw.ingredientUtilizationScore
          : undefined,
        0
      ),
      ingredientCoverageScore: parseNumericValue(
        scoringMetadataRaw && "ingredientCoverageScore" in scoringMetadataRaw
          ? scoringMetadataRaw.ingredientCoverageScore
          : undefined,
        0
      ),
      lowMissingIngredientScore: parseNumericValue(
        scoringMetadataRaw && "lowMissingIngredientScore" in scoringMetadataRaw
          ? scoringMetadataRaw.lowMissingIngredientScore
          : undefined,
        0
      ),
      diversityScore: parseNumericValue(
        scoringMetadataRaw && "diversityScore" in scoringMetadataRaw
          ? scoringMetadataRaw.diversityScore
          : undefined,
        0.7
      )
    },
    inputStrength:
      raw.inputStrength !== undefined ? parseInputStrength(raw.inputStrength) : parseInputStrength(storedItem?.input_strength),
    calories,
    protein,
    cookTimeMinutes,
    promptVersion:
      typeof raw.promptVersion === "string"
        ? raw.promptVersion
        : typeof storedItem?.prompt_version === "string"
          ? storedItem.prompt_version
          : "saved-plan-v1",
    isFallback:
      typeof raw.isFallback === "boolean"
        ? raw.isFallback
        : typeof storedItem?.is_fallback === "boolean"
          ? storedItem.is_fallback
          : false
  };
}

function sortPlans(plans: DailyMealPlan[]) {
  return [...plans].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
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

function inferStoredGenerationMode(results: Record<MealType, MealRecommendation>) {
  return MEAL_TYPES.every((mealType) => results[mealType].inputIngredients.length === 0)
    ? "auto_recommend"
    : "ingredient_first";
}

function inferStoredAllowAutoSupplement(results: Record<MealType, MealRecommendation>) {
  return MEAL_TYPES.some((mealType) => results[mealType].optionalAddedIngredients.length > 0);
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
    generationMode:
      row.generation_mode === "ingredient_first" || row.generation_mode === "auto_recommend"
        ? row.generation_mode
        : inferStoredGenerationMode(results),
    allowAutoSupplement:
      typeof row.allow_auto_supplement === "boolean"
        ? row.allow_auto_supplement
        : inferStoredAllowAutoSupplement(results),
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
      "*, meal_plan_items(*), meal_inputs(meal_type, original_ingredients_json, normalized_ingredients_json)"
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
      "*, meal_plan_items(*), meal_inputs(meal_type, original_ingredients_json, normalized_ingredients_json)"
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
      plan_date: getMealPlanDateOnly(plan.createdAt),
      created_by_user_id: userId,
      created_at: plan.createdAt,
      updated_at: plan.createdAt,
      notices_json: plan.notices
      // TODO: persist generation_mode / allow_auto_supplement after migration apply
    })
    .select("id, child_id, created_at, notices_json")
    .single<Pick<MealPlanRow, "id" | "child_id" | "created_at" | "notices_json">>();

  if (insertPlanError) {
    throw insertPlanError;
  }

  const itemRows = buildMealPlanItemRows({
    mealPlanId: insertedPlan.id,
    plan
  });

  const { error: insertItemsError } = await supabase.from("meal_plan_items").insert(itemRows);

  if (insertItemsError) {
    await supabase.from("meal_plans").delete().eq("id", insertedPlan.id);
    throw insertItemsError;
  }

  const inputRows = buildMealInputRows({
    mealPlanId: insertedPlan.id,
    childId: plan.childId,
    createdAt: plan.createdAt,
    plan,
    sourceMealInputs
  });

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
