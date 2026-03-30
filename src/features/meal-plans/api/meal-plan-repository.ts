import type { DailyMealPlan } from "../../../types/domain";
import { readJson, writeJson } from "../../../services/storage/browser-storage";

const STORAGE_KEY = "min-baby-meals.meal-plans";

export async function listMealPlansByChild(childId: string) {
  return readJson<DailyMealPlan[]>(STORAGE_KEY, [])
    .filter((item) => item.childId === childId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function saveMealPlan(plan: DailyMealPlan) {
  const plans = readJson<DailyMealPlan[]>(STORAGE_KEY, []);
  writeJson(STORAGE_KEY, [plan, ...plans]);
  return plan;
}

export async function deleteMealPlansByChild(childId: string) {
  const plans = readJson<DailyMealPlan[]>(STORAGE_KEY, []).filter((item) => item.childId !== childId);
  writeJson(STORAGE_KEY, plans);
}
