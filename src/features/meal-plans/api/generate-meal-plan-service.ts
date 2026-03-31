import type { ChildProfile, DailyMealPlan, MealType } from "../../../types/domain";
import { getSupabaseClient } from "../../../lib/supabase";
import { normalizeIngredients } from "../../ingredients/api/normalize-ingredients-service";
import { buildDailyMealPlan } from "../lib/plan-generator";

interface GenerateMealPlanPayload {
  child: ChildProfile;
  mealInputs: Record<MealType, string[]>;
}

async function generateMealPlanLocally(payload: GenerateMealPlanPayload): Promise<DailyMealPlan> {
  const normalizedMealInputs = {
    breakfast: (await normalizeIngredients(payload.mealInputs.breakfast)).map((item) => item.standardKey),
    lunch: (await normalizeIngredients(payload.mealInputs.lunch)).map((item) => item.standardKey),
    dinner: (await normalizeIngredients(payload.mealInputs.dinner)).map((item) => item.standardKey)
  };

  return buildDailyMealPlan({
    child: payload.child,
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
      body: payload
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("generate-meal-plan returned an invalid payload");
    }

    return data;
  } catch (error) {
    console.warn("Falling back to local meal plan generation", error);
    return generateMealPlanLocally(payload);
  }
}
