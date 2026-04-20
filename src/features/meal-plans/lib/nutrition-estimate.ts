import type {
  MealRecommendation,
  MealType,
  MenuDefinition,
  NutritionConfidence,
  NutritionEstimate
} from "../../../types/domain.ts";
import {
  getIngredientNutritionReference,
  type IngredientNutritionCategory
} from "../../ingredients/data/ingredient-nutrition-reference.ts";
import { inferMenuFamily } from "../../menus/data/menu-catalog.ts";
import { uniqueIngredients } from "../../ingredients/lib/ingredient-utils.ts";

interface EstimateMealNutritionInput {
  mealType: MealType;
  ageMonths: number;
  menuFamily?: string | null;
  menu?: MenuDefinition | null;
  usedIngredients: string[];
  missingIngredients: string[];
  optionalAddedIngredients: string[];
}

interface CategoryDistribution {
  grain: number;
  protein: number;
  vegetable: number;
  fat: number;
  dairy: number;
  liquid: number;
}

interface PortionTemplate {
  breakfast: number;
  lunch: number;
  dinner: number;
}

const AGE_PORTION_TEMPLATES: Array<{ maxAgeMonths: number; portion: PortionTemplate }> = [
  { maxAgeMonths: 11, portion: { breakfast: 150, lunch: 180, dinner: 190 } },
  { maxAgeMonths: 17, portion: { breakfast: 170, lunch: 210, dinner: 220 } },
  { maxAgeMonths: 23, portion: { breakfast: 190, lunch: 230, dinner: 240 } },
  { maxAgeMonths: 35, portion: { breakfast: 220, lunch: 260, dinner: 270 } },
  { maxAgeMonths: Number.POSITIVE_INFINITY, portion: { breakfast: 240, lunch: 290, dinner: 300 } }
];

const MENU_FAMILY_DISTRIBUTION: Record<string, CategoryDistribution> = {
  porridge: { grain: 0.4, protein: 0.2, vegetable: 0.22, fat: 0.03, dairy: 0.03, liquid: 0.12 },
  risotto: { grain: 0.34, protein: 0.22, vegetable: 0.23, fat: 0.05, dairy: 0.04, liquid: 0.12 },
  rice_bowl: { grain: 0.38, protein: 0.28, vegetable: 0.24, fat: 0.05, dairy: 0, liquid: 0.05 },
  patty: { grain: 0.16, protein: 0.42, vegetable: 0.2, fat: 0.1, dairy: 0.04, liquid: 0.08 },
  steamed: { grain: 0.18, protein: 0.34, vegetable: 0.29, fat: 0.05, dairy: 0.02, liquid: 0.12 },
  omelet: { grain: 0.14, protein: 0.44, vegetable: 0.2, fat: 0.1, dairy: 0.07, liquid: 0.05 },
  soft_stir: { grain: 0.34, protein: 0.26, vegetable: 0.24, fat: 0.06, dairy: 0.02, liquid: 0.08 },
  finger_food: { grain: 0.2, protein: 0.36, vegetable: 0.24, fat: 0.1, dairy: 0.03, liquid: 0.07 },
  mash: { grain: 0.1, protein: 0.18, vegetable: 0.54, fat: 0.05, dairy: 0.08, liquid: 0.05 },
  stew: { grain: 0.18, protein: 0.24, vegetable: 0.28, fat: 0.04, dairy: 0.02, liquid: 0.24 }
};

const MENU_FAMILY_COOK_TIME: Record<string, number> = {
  porridge: 20,
  risotto: 20,
  rice_bowl: 15,
  patty: 20,
  steamed: 18,
  omelet: 12,
  soft_stir: 15,
  finger_food: 18,
  mash: 14,
  stew: 22
};

const ROLE_WEIGHT = {
  primary: 1.35,
  optional: 0.9,
  pantry: 1.05,
  hidden: 0.45,
  derived: 1
} as const;

function roundCalories(value: number) {
  return Math.max(0, Math.round(value));
}

function roundProtein(value: number) {
  return Math.max(0, Number(value.toFixed(1)));
}

function roundCookTime(value: number) {
  return Math.max(10, Math.round(value / 5) * 5);
}

function getPortionTemplate(ageMonths: number) {
  return AGE_PORTION_TEMPLATES.find((item) => ageMonths <= item.maxAgeMonths)?.portion ?? AGE_PORTION_TEMPLATES[1].portion;
}

function getCategoryDistribution(menuFamily: string | null | undefined) {
  const resolvedFamily = menuFamily ?? "soft_stir";
  return MENU_FAMILY_DISTRIBUTION[resolvedFamily] ?? MENU_FAMILY_DISTRIBUTION.soft_stir;
}

function getIngredientRole(menu: MenuDefinition | null | undefined, ingredient: string) {
  if (!menu) {
    return "derived" as const;
  }

  if (menu.primaryIngredients.includes(ingredient)) {
    return "primary" as const;
  }

  if (menu.optionalIngredients.includes(ingredient)) {
    return "optional" as const;
  }

  if (menu.pantryIngredients.includes(ingredient)) {
    return "pantry" as const;
  }

  if (menu.hiddenIngredients.includes(ingredient)) {
    return "hidden" as const;
  }

  return "derived" as const;
}

function getEffectiveIngredients(input: EstimateMealNutritionInput) {
  const baseIngredients = uniqueIngredients([
    ...input.usedIngredients,
    ...input.optionalAddedIngredients,
    ...input.missingIngredients,
    ...(input.menu?.pantryIngredients ?? []),
    ...(input.menu?.hiddenIngredients ?? [])
  ]);

  return baseIngredients
    .map((ingredient) => {
      const reference = getIngredientNutritionReference(ingredient);

      if (!reference) {
        return null;
      }

      return {
        ingredient,
        reference,
        category: reference.category,
        roleWeight: ROLE_WEIGHT[getIngredientRole(input.menu, ingredient)]
      };
    })
    .filter(Boolean) as Array<{
    ingredient: string;
    reference: ReturnType<typeof getIngredientNutritionReference> extends infer T
      ? Exclude<T, null>
      : never;
    category: IngredientNutritionCategory;
    roleWeight: number;
  }>;
}

function sumRoleWeightByCategory(
  ingredients: Array<{ category: IngredientNutritionCategory; roleWeight: number }>
) {
  const totals: Record<IngredientNutritionCategory, number> = {
    grain: 0,
    protein: 0,
    vegetable: 0,
    fat: 0,
    dairy: 0,
    liquid: 0
  };

  ingredients.forEach((item) => {
    totals[item.category] += item.roleWeight;
  });

  return totals;
}

function getConfidence(knownCount: number, unknownCount: number): NutritionConfidence {
  const totalCount = knownCount + unknownCount;

  if (totalCount === 0) {
    return "low";
  }

  const knownRatio = knownCount / totalCount;

  if (knownRatio >= 0.8) {
    return "high";
  }

  if (knownRatio >= 0.5) {
    return "medium";
  }

  return "low";
}

export function estimateMealNutrition(input: EstimateMealNutritionInput): NutritionEstimate {
  const effectiveIngredients = getEffectiveIngredients(input);
  const unknownCount = uniqueIngredients([
    ...input.usedIngredients,
    ...input.optionalAddedIngredients,
    ...input.missingIngredients
  ]).length - effectiveIngredients.length;
  const knownCount = effectiveIngredients.length;
  const resolvedMenuFamily =
    input.menuFamily ?? input.menu?.menuFamily ?? inferMenuFamily(input.menu?.cookingStyle ?? "무른밥");
  const portionTemplate = getPortionTemplate(input.ageMonths);
  const totalPortionG = portionTemplate[input.mealType];
  const categoryDistribution = getCategoryDistribution(resolvedMenuFamily);
  const categoryRoleWeights = sumRoleWeightByCategory(effectiveIngredients);

  let calories = 0;
  let protein = 0;

  effectiveIngredients.forEach((item) => {
    const categoryShare = categoryDistribution[item.category];
    const categoryWeight = totalPortionG * categoryShare;
    const categoryRoleWeight = categoryRoleWeights[item.category] || item.roleWeight;
    const estimatedWeightG = categoryWeight * (item.roleWeight / categoryRoleWeight);

    calories += (estimatedWeightG * item.reference.caloriesPer100g) / 100;
    protein += (estimatedWeightG * item.reference.proteinPer100g) / 100;
  });

  const proteinIngredientCount = effectiveIngredients.filter((item) => item.category === "protein").length;
  const prepComplexity =
    effectiveIngredients.filter((item) => item.category !== "liquid").length * 1.2 +
    input.optionalAddedIngredients.length * 1.5 +
    proteinIngredientCount * 1.8;
  const ageAdjustment = input.ageMonths <= 11 ? 5 : input.ageMonths <= 23 ? 2 : 0;
  const baseCookTime =
    MENU_FAMILY_COOK_TIME[resolvedMenuFamily] ?? MENU_FAMILY_COOK_TIME.soft_stir;
  const estimatedCookTimeMin = roundCookTime(baseCookTime + prepComplexity + ageAdjustment);
  const confidence = getConfidence(knownCount, Math.max(0, unknownCount));

  if (knownCount === 0) {
    return {
      caloriesKcal: 0,
      proteinG: 0,
      estimatedCookTimeMin,
      confidence: "low",
      basisNote: `${resolvedMenuFamily} 기본 시간과 표준 분량 기준 예상치`
    };
  }

  return {
    caloriesKcal: roundCalories(calories),
    proteinG: roundProtein(protein),
    estimatedCookTimeMin,
    confidence,
    basisNote: `${input.ageMonths}개월 표준 분량과 ${resolvedMenuFamily} 조리 기준 예상치`
  };
}

export function applyNutritionEstimateToRecommendation(
  input: EstimateMealNutritionInput
): Pick<MealRecommendation, "nutritionEstimate" | "calories" | "protein" | "cookTimeMinutes"> {
  const nutritionEstimate = estimateMealNutrition(input);

  return {
    nutritionEstimate,
    calories: nutritionEstimate.caloriesKcal,
    protein: nutritionEstimate.proteinG,
    cookTimeMinutes: nutritionEstimate.estimatedCookTimeMin
  };
}
