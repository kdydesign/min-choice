import type { MealDraft } from "../../../types/domain.ts";

const INGREDIENT_ALIASES: Record<string, string> = {
  쇠고기: "소고기",
  닭가슴살: "닭고기",
  닭: "닭고기",
  계란: "달걀",
  호박: "애호박",
  쥬키니: "애호박",
  브로콜리꽃: "브로콜리",
  흰쌀: "쌀",
  이유식용쌀: "쌀",
  죽: "죽밥"
};

export function normalizeIngredient(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return INGREDIENT_ALIASES[normalized] ?? normalized;
}

export function uniqueIngredients(items: string[]) {
  return [...new Set(items.map(normalizeIngredient).filter(Boolean))];
}

export function parseDelimitedIngredients(value: string) {
  return uniqueIngredients(value.split(/[,\n/]/));
}

export function formatIngredientList(items: string[]) {
  return items.join(", ");
}

export function getIngredientConflicts(ingredients: string[], allergies: string[]) {
  const allergySet = new Set(uniqueIngredients(allergies));
  return uniqueIngredients(ingredients).filter((ingredient) => allergySet.has(ingredient));
}

export function emptyMealDraft(): MealDraft {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
    updatedAt: null
  };
}
