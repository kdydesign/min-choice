import type { MealDraft } from "../../types/domain";
import { emptyMealDraft } from "../../features/ingredients/lib/ingredient-utils";
import { readJson, writeJson } from "./browser-storage";

const DRAFT_STORAGE_KEY = "min-baby-meals.drafts";

export function getMealDraft(childId: string) {
  const drafts = readJson<Record<string, MealDraft>>(DRAFT_STORAGE_KEY, {});
  return drafts[childId] ?? emptyMealDraft();
}

export function saveMealDraft(childId: string, draft: MealDraft) {
  const drafts = readJson<Record<string, MealDraft>>(DRAFT_STORAGE_KEY, {});
  drafts[childId] = {
    ...draft,
    updatedAt: new Date().toISOString()
  };
  writeJson(DRAFT_STORAGE_KEY, drafts);
}

export function clearMealDraft(childId: string) {
  const drafts = readJson<Record<string, MealDraft>>(DRAFT_STORAGE_KEY, {});
  delete drafts[childId];
  writeJson(DRAFT_STORAGE_KEY, drafts);
}
