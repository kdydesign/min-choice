import { MEAL_TYPES, type DailyMealPlan, type MealType } from "../../../types/domain";

interface BuildMealPlanItemRowsInput {
  mealPlanId: string;
  plan: DailyMealPlan;
}

interface BuildMealInputRowsInput {
  mealPlanId: string;
  childId: string;
  createdAt: string;
  plan: DailyMealPlan;
  sourceMealInputs: Record<MealType, string[]>;
}

function getDateOnly(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function buildMealPlanItemRows({ mealPlanId, plan }: BuildMealPlanItemRowsInput) {
  return MEAL_TYPES.map((mealType) => ({
    meal_plan_id: mealPlanId,
    meal_type: mealType,
    menu_id: null,
    menu_name: plan.results[mealType].name,
    used_ingredient_keys_json: plan.results[mealType].usedIngredients,
    missing_ingredient_keys_json: plan.results[mealType].missingIngredients,
    substitutes_json: plan.results[mealType].substitutes,
    ai_recommendation: plan.results[mealType].recommendationText,
    recipe_summary_json: plan.results[mealType].recipeSummary,
    recipe_full_json: plan.results[mealType].recipeFull,
    caution: plan.results[mealType].caution,
    excluded_allergy_ingredients_json: plan.results[mealType].excludedAllergyIngredients,
    prompt_version: plan.results[mealType].promptVersion,
    is_fallback: plan.results[mealType].isFallback,
    // Keep result_payload_json as the backward-compatible source of truth until
    // generation metadata columns are fully migrated and deployed.
    result_payload_json: plan.results[mealType],
    created_at: plan.createdAt
    // TODO: after applying generation metadata migration, persist:
    // menu_family, optional_added_ingredients_json, nutrition_estimate_json,
    // scoring_metadata_json, input_strength
  }));
}

export function buildMealInputRows({
  mealPlanId,
  childId,
  createdAt,
  plan,
  sourceMealInputs
}: BuildMealInputRowsInput) {
  return MEAL_TYPES.map((mealType) => ({
    meal_plan_id: mealPlanId,
    child_id: childId,
    input_date: getDateOnly(createdAt),
    meal_type: mealType,
    original_ingredients_json: sourceMealInputs[mealType],
    normalized_ingredients_json: plan.mealInputs[mealType],
    excluded_allergy_ingredients_json: plan.results[mealType].excludedAllergyIngredients,
    created_at: createdAt
  }));
}

export function getMealPlanDateOnly(value: string) {
  return getDateOnly(value);
}
