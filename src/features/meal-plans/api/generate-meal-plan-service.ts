import type { ChildProfile, DailyMealPlan, MealType } from "../../../types/domain";
import { getSupabaseClient } from "../../../lib/supabase";
import { deriveAgeMonthsFromBirthDate } from "../../children/lib/profile-date-utils";
import { normalizeIngredients } from "../../ingredients/api/normalize-ingredients-service";
import { guardGeneratedMealContent } from "../lib/ai-response-guard";
import { buildDailyMealPlan, isTooSoftCookingStyleForAge } from "../lib/plan-generator";
import { getMealMetricsByType, getMenuDefinitionByKey } from "../../menus/data/menu-catalog";

interface GenerateMealPlanPayload {
  child: ChildProfile;
  mealInputs: Record<MealType, string[]>;
}

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
  const metrics = menuDefinition ?? getMealMetricsByType(mealType);
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

  return {
    ...meal,
    recommendationText: guardedNarrative.recommendationText,
    recipeSummary: guardedNarrative.recipeSummary,
    missingIngredientExplanation: guardedNarrative.missingIngredientExplanation,
    caution: guardedNarrative.caution,
    promptVersion: guardedNarrative.promptVersion,
    isFallback: meal.isFallback || guardedNarrative.isFallback,
    calories:
      Number.isFinite(meal.calories) && meal.calories > 0 ? meal.calories : metrics.calories,
    protein: Number.isFinite(meal.protein) && meal.protein > 0 ? meal.protein : metrics.protein,
    cookTimeMinutes:
      Number.isFinite(meal.cookTimeMinutes) && meal.cookTimeMinutes > 0
        ? meal.cookTimeMinutes
        : metrics.cookTimeMinutes
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
    mealInputs: normalizedMealInputs
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
