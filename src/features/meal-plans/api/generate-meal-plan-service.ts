import type { ChildProfile, DailyMealPlan, MealType } from "../../../types/domain";
import { getSupabaseClient } from "../../../lib/supabase";
import { deriveAgeMonthsFromBirthDate } from "../../children/lib/profile-date-utils";
import { normalizeIngredients } from "../../ingredients/api/normalize-ingredients-service";
import { guardGeneratedMealContent } from "../lib/ai-response-guard";
import { buildDailyMealPlan, isTooSoftCookingStyleForAge } from "../lib/plan-generator";
import { getMenuDefinitionByKey } from "../../menus/data/menu-catalog";
import { applyNutritionEstimateToRecommendation } from "../lib/nutrition-estimate";
import type { GenerateMealPlanPayload } from "../types/generation-contract";

function ensureChildAgeMonths(child: ChildProfile): ChildProfile {
  if (Number.isFinite(child.ageMonths) && child.ageMonths >= 0) {
    return child;
  }

  const derivedAgeMonths = child.birthDate ? deriveAgeMonthsFromBirthDate(child.birthDate) : null;

  return {
    ...child,
    ageMonths: derivedAgeMonths ?? 12
  };
}

function normalizeGeneratedPlan(child: ChildProfile, plan: DailyMealPlan): DailyMealPlan {
  const normalizedChild = ensureChildAgeMonths(child);

  return {
    ...plan,
    childName: normalizedChild.name,
    generationMode: plan.generationMode ?? "ingredient_first",
    allowAutoSupplement: plan.allowAutoSupplement ?? true,
    results: {
      breakfast: normalizeMealRecommendation("breakfast", normalizedChild, plan.results.breakfast),
      lunch: normalizeMealRecommendation("lunch", normalizedChild, plan.results.lunch),
      dinner: normalizeMealRecommendation("dinner", normalizedChild, plan.results.dinner)
    },
    notices: plan.notices.map((notice) =>
      notice.message.includes("12개월")
        ? {
            ...notice,
            message: `${normalizedChild.name} 프로필은 ${normalizedChild.ageMonths}개월로 입력되어 있어요. 추천 식감과 조리 난이도는 실제 개월수를 기준으로 조정했어요.`
          }
        : notice
    )
  };
}

function needsAgeAwareMenuCorrection(child: ChildProfile, plan: DailyMealPlan) {
  const normalizedChild = ensureChildAgeMonths(child);

  return (["breakfast", "lunch", "dinner"] as const).some((mealType) =>
    isTooSoftCookingStyleForAge(plan.results[mealType].cookingStyle, normalizedChild.ageMonths)
  );
}

function normalizeMealRecommendation(
  mealType: MealType,
  child: ChildProfile,
  meal: DailyMealPlan["results"][MealType]
) {
  const menuDefinition = getMenuDefinitionByKey({ id: meal.id, name: meal.name });
  const guardedNarrative = guardGeneratedMealContent({
    generated: {
      recommendationText: meal.recommendationText,
      recipeSummary: meal.recipeSummary,
      missingIngredientExplanation: meal.missingIngredientExplanation,
      caution: meal.caution,
      promptVersion: meal.promptVersion,
      isFallback: meal.isFallback
    },
    mealType,
    ageMonths: child.ageMonths,
    menuName: meal.name,
    cookingStyle: meal.cookingStyle,
    usedIngredients: meal.usedIngredients,
    missingIngredients: meal.missingIngredients,
    recipeSummary: meal.recipeSummary,
    caution: meal.caution,
    allergies: child.allergies
  });
  const nutrition = applyNutritionEstimateToRecommendation({
    mealType,
    ageMonths: child.ageMonths,
    menuFamily: meal.menuFamily ?? menuDefinition?.menuFamily ?? meal.cookingStyle,
    menu: menuDefinition,
    usedIngredients: meal.usedIngredients,
    missingIngredients: meal.missingIngredients,
    optionalAddedIngredients: meal.optionalAddedIngredients ?? []
  });

  return {
    ...meal,
    menuFamily: meal.menuFamily ?? menuDefinition?.menuFamily ?? meal.cookingStyle,
    recommendationText: guardedNarrative.recommendationText,
    recipeSummary: guardedNarrative.recipeSummary,
    recipeFull:
      meal.recipeFull && meal.recipeFull.length > 0
        ? meal.recipeFull.slice(0, 8)
        : guardedNarrative.recipeFull.length > 0
          ? guardedNarrative.recipeFull
          : guardedNarrative.recipeSummary,
    missingIngredientExplanation: guardedNarrative.missingIngredientExplanation,
    caution: guardedNarrative.caution,
    optionalAddedIngredients: meal.optionalAddedIngredients ?? [],
    nutritionEstimate: meal.nutritionEstimate ?? nutrition.nutritionEstimate,
    scoringMetadata: {
      ingredientUtilizationScore: meal.scoringMetadata?.ingredientUtilizationScore ?? 0,
      ingredientCoverageScore: meal.scoringMetadata?.ingredientCoverageScore ?? 0,
      lowMissingIngredientScore: meal.scoringMetadata?.lowMissingIngredientScore ?? 0,
      diversityScore: meal.scoringMetadata?.diversityScore ?? (meal.isFallback ? 0.35 : 0.7)
    },
    inputStrength: meal.inputStrength ?? (meal.inputIngredients.length === 0 ? "none" : "medium"),
    promptVersion: guardedNarrative.promptVersion,
    isFallback: meal.isFallback || guardedNarrative.isFallback,
    calories: Number.isFinite(meal.calories) && meal.calories > 0 ? meal.calories : nutrition.calories,
    protein: Number.isFinite(meal.protein) && meal.protein > 0 ? meal.protein : nutrition.protein,
    cookTimeMinutes:
      Number.isFinite(meal.cookTimeMinutes) && meal.cookTimeMinutes > 0
        ? meal.cookTimeMinutes
        : nutrition.cookTimeMinutes
  };
}

async function generateMealPlanLocally(payload: GenerateMealPlanPayload): Promise<DailyMealPlan> {
  const normalizedMealInputs = {
    breakfast: (await normalizeIngredients(payload.mealInputs.breakfast)).map((item) => item.standardKey),
    lunch: (await normalizeIngredients(payload.mealInputs.lunch)).map((item) => item.standardKey),
    dinner: (await normalizeIngredients(payload.mealInputs.dinner)).map((item) => item.standardKey)
  };

  return buildDailyMealPlan({
    child: ensureChildAgeMonths(payload.child),
    mealInputs: normalizedMealInputs,
    generationMode: payload.generationMode,
    allowAutoSupplement: payload.allowAutoSupplement
  });
}

export async function generateMealPlan(payload: GenerateMealPlanPayload): Promise<DailyMealPlan> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return generateMealPlanLocally(payload);
  }

  try {
    const { data, error } = await supabase.functions.invoke<DailyMealPlan>("generate-meal-plan", {
      body: {
        ...payload,
        child: ensureChildAgeMonths(payload.child)
      }
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("generate-meal-plan returned an invalid payload");
    }

    const normalizedPlan = normalizeGeneratedPlan(payload.child, data);

    if (needsAgeAwareMenuCorrection(payload.child, normalizedPlan)) {
      console.warn("Applying local age-aware meal plan correction for older child profile");
      return generateMealPlanLocally(payload);
    }

    return normalizedPlan;
  } catch (error) {
    console.warn("Falling back to local meal plan generation", error);
    return generateMealPlanLocally(payload);
  }
}
