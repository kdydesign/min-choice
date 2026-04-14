import { normalizeIngredient } from "../lib/ingredient-utils";

export type IngredientNutritionCategory =
  | "grain"
  | "protein"
  | "vegetable"
  | "fat"
  | "dairy"
  | "liquid";

export interface IngredientNutritionReference {
  category: IngredientNutritionCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
}

const RAW_INGREDIENT_NUTRITION_REFERENCE: Record<string, IngredientNutritionReference> = {
  쌀: { category: "grain", caloriesPer100g: 365, proteinPer100g: 6.7 },
  밥: { category: "grain", caloriesPer100g: 130, proteinPer100g: 2.7 },
  죽밥: { category: "grain", caloriesPer100g: 75, proteinPer100g: 1.6 },
  오트밀: { category: "grain", caloriesPer100g: 389, proteinPer100g: 16.9 },
  감자: { category: "vegetable", caloriesPer100g: 77, proteinPer100g: 2.0 },
  고구마: { category: "vegetable", caloriesPer100g: 86, proteinPer100g: 1.6 },
  단호박: { category: "vegetable", caloriesPer100g: 49, proteinPer100g: 1.8 },
  두부: { category: "protein", caloriesPer100g: 76, proteinPer100g: 8.0 },
  소고기: { category: "protein", caloriesPer100g: 250, proteinPer100g: 26.0 },
  닭고기: { category: "protein", caloriesPer100g: 165, proteinPer100g: 31.0 },
  흰살생선: { category: "protein", caloriesPer100g: 96, proteinPer100g: 20.0 },
  달걀: { category: "protein", caloriesPer100g: 143, proteinPer100g: 12.6 },
  브로콜리: { category: "vegetable", caloriesPer100g: 34, proteinPer100g: 2.8 },
  애호박: { category: "vegetable", caloriesPer100g: 17, proteinPer100g: 1.2 },
  양배추: { category: "vegetable", caloriesPer100g: 25, proteinPer100g: 1.3 },
  시금치: { category: "vegetable", caloriesPer100g: 23, proteinPer100g: 2.9 },
  당근: { category: "vegetable", caloriesPer100g: 41, proteinPer100g: 0.9 },
  양파: { category: "vegetable", caloriesPer100g: 40, proteinPer100g: 1.1 },
  올리브유: { category: "fat", caloriesPer100g: 884, proteinPer100g: 0 },
  참기름: { category: "fat", caloriesPer100g: 884, proteinPer100g: 0 },
  우유: { category: "dairy", caloriesPer100g: 61, proteinPer100g: 3.2 },
  물: { category: "liquid", caloriesPer100g: 0, proteinPer100g: 0 },
  육수: { category: "liquid", caloriesPer100g: 8, proteinPer100g: 0.5 }
};

export const INGREDIENT_NUTRITION_REFERENCE = Object.fromEntries(
  Object.entries(RAW_INGREDIENT_NUTRITION_REFERENCE).map(([key, value]) => [
    normalizeIngredient(key),
    value
  ])
) as Record<string, IngredientNutritionReference>;

export function getIngredientNutritionReference(ingredient: string) {
  return INGREDIENT_NUTRITION_REFERENCE[normalizeIngredient(ingredient)] ?? null;
}
