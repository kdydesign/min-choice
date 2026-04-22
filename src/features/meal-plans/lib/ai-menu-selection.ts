import type { MealType, NutritionEstimate, NutritionSource } from "../../../types/domain.ts";
import { normalizeIngredient, uniqueIngredients } from "../../ingredients/lib/ingredient-utils.ts";
import type { AiMealResponse } from "../types/generation-contract.ts";
import { applyNutritionEstimateToRecommendation } from "./nutrition-estimate.ts";
import {
  getDefaultAgeRange,
  resolveNormalizedMenuFamily
} from "../../menus/data/menu-catalog.ts";

export interface IngredientCatalogEntry {
  standardKey: string;
  displayName: string;
  aliases: string[];
  isAllergen: boolean;
}

export interface MealHistorySnapshot {
  mealType: MealType;
  menu: string;
  menuFamily: string | null;
  mainProtein: string;
}

export interface NormalizedAiMealSelection {
  selectedMenu: string;
  cookingStyle: string;
  mainProtein: string;
  usedIngredients: string[];
  optionalAddedIngredients: string[];
  missingIngredients: string[];
  substitutes: Record<string, string[]>;
  recommendation: string;
  missingIngredientExplanation: string;
  recipeSummary: string[];
  recipeFull: string[];
  textureGuide: string;
  caution: string;
  menuFamilyHint: string | null;
  normalizedMenuFamily: string;
  calories: number;
  protein: number;
  cookTimeMinutes: number;
  unknownIngredients: string[];
}

export interface ValidatedAiMealSelection extends Omit<NormalizedAiMealSelection, "mainProtein"> {
  mainProtein: string;
}

interface ValidateAiMealSelectionInput {
  response: AiMealResponse;
  mealType: MealType;
  generationMode: "ingredient_first" | "auto_recommend";
  ageMonths: number;
  allergies: string[];
  inputIngredients: string[];
  allowedSupplements: string[];
  priorMeals: MealHistorySnapshot[];
  ingredientCatalog: IngredientCatalogEntry[];
  attemptNumber: 1 | 2;
}

interface NutritionValidationInput {
  mealType: MealType;
  ageMonths: number;
  menuFamily: string | null;
  usedIngredients: string[];
  missingIngredients: string[];
  optionalAddedIngredients: string[];
  calories: number;
  protein: number;
  cookTimeMinutes: number;
}

export const PANTRY_BASICS = ["물", "육수", "올리브유", "참기름", "들기름", "식용유"] as const;

const PROTEIN_PRIORITY = ["소고기", "닭고기", "두부", "흰살생선", "달걀"] as const;
const DANGEROUS_PHRASES = [
  "통째로",
  "크게 썰",
  "큰 덩어리",
  "질식",
  "삼키기 쉬운 크기",
  "매운",
  "매콤",
  "고추",
  "후추",
  "짠맛",
  "간을 세게",
  "자극적인",
  "꿀",
  "술",
  "약처럼",
  "치료",
  "완치",
  "병을 낫게"
] as const;

function parseNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function normalizeMenuName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function containsDangerousText(text: string) {
  return DANGEROUS_PHRASES.some((phrase) => text.includes(phrase));
}

function containsAllergyText(text: string, allergies: string[]) {
  return uniqueIngredients(allergies).some((allergy) => text.includes(allergy));
}

function buildIngredientIndex(
  ingredientCatalog: IngredientCatalogEntry[],
  passthroughIngredients: string[] = []
) {
  const index = new Map<string, string>();

  ingredientCatalog.forEach((item) => {
    const variants = uniqueIngredients([item.standardKey, item.displayName, ...item.aliases]);
    variants.forEach((variant) => {
      index.set(normalizeIngredient(variant), item.standardKey);
    });
  });

  PANTRY_BASICS.forEach((item) => {
    index.set(normalizeIngredient(item), item);
  });

  passthroughIngredients.forEach((item) => {
    const normalized = normalizeIngredient(item);

    if (!normalized) {
      return;
    }

    index.set(normalized, normalized);
  });

  return index;
}

function normalizeKnownIngredient(value: string, ingredientIndex: Map<string, string>) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalized = normalizeIngredient(trimmedValue);
  return ingredientIndex.get(normalized) ?? null;
}

function normalizeIngredientList(values: string[], ingredientIndex: Map<string, string>) {
  const normalizedValues: string[] = [];
  const unknownValues: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeKnownIngredient(value, ingredientIndex);

    if (!normalized) {
      unknownValues.push(normalizeIngredient(value));
      return;
    }

    if (!normalizedValues.includes(normalized)) {
      normalizedValues.push(normalized);
    }
  });

  return {
    values: normalizedValues,
    unknownValues: uniqueIngredients(unknownValues)
  };
}

function normalizeSubstitutes(
  items: AiMealResponse["substitutes"],
  ingredientIndex: Map<string, string>
) {
  const substitutes: Record<string, string[]> = {};
  const unknownValues: string[] = [];

  items.forEach((item) => {
    const ingredient = normalizeKnownIngredient(item.ingredient, ingredientIndex);

    if (!ingredient) {
      unknownValues.push(normalizeIngredient(item.ingredient));
      return;
    }

    const normalizedItems = normalizeIngredientList(item.substitutes, ingredientIndex);
    unknownValues.push(...normalizedItems.unknownValues);
    substitutes[ingredient] = normalizedItems.values;
  });

  return {
    substitutes,
    unknownValues: uniqueIngredients(unknownValues)
  };
}

function deriveMainProtein(usedIngredients: string[], requestedMainProtein: string) {
  const trimmed = requestedMainProtein.trim();

  if (trimmed === "채소" || trimmed === "맞춤형") {
    return trimmed;
  }

  const normalizedRequested = normalizeIngredient(trimmed);

  if (usedIngredients.includes(normalizedRequested)) {
    return normalizedRequested;
  }

  return PROTEIN_PRIORITY.find((protein) => usedIngredients.includes(protein)) ?? "채소";
}

function hasOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right.map((item) => normalizeIngredient(item)));
  return left.some((item) => rightSet.has(normalizeIngredient(item)));
}

function formatMealHistoryKey(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSelection(
  response: AiMealResponse,
  ingredientCatalog: IngredientCatalogEntry[],
  passthroughIngredients: string[] = []
) {
  const ingredientIndex = buildIngredientIndex(ingredientCatalog, passthroughIngredients);
  const usedIngredients = normalizeIngredientList(response.usedIngredients, ingredientIndex);
  const optionalAddedIngredients = normalizeIngredientList(
    response.optionalAddedIngredients,
    ingredientIndex
  );
  const missingIngredients = normalizeIngredientList(response.missingIngredients, ingredientIndex);
  const substitutes = normalizeSubstitutes(response.substitutes, ingredientIndex);

  return {
    selectedMenu: normalizeMenuName(response.selectedMenu),
    cookingStyle: response.cookingStyle.trim(),
    mainProtein: response.mainProtein.trim(),
    usedIngredients: usedIngredients.values,
    optionalAddedIngredients: optionalAddedIngredients.values,
    missingIngredients: missingIngredients.values,
    substitutes: substitutes.substitutes,
    recommendation: response.recommendation.trim(),
    missingIngredientExplanation: response.missingIngredientExplanation.trim(),
    recipeSummary: response.recipeSummary.map((item) => item.trim()).filter(Boolean).slice(0, 3),
    recipeFull: response.recipeFull.map((item) => item.trim()).filter(Boolean).slice(0, 8),
    textureGuide: response.textureGuide.trim(),
    caution: response.caution.trim(),
    menuFamilyHint:
      typeof response.menuFamily === "string" && response.menuFamily.trim()
        ? response.menuFamily.trim()
        : null,
    normalizedMenuFamily: resolveNormalizedMenuFamily({
      selectedMenu: response.selectedMenu,
      cookingStyle: response.cookingStyle,
      menuFamily: response.menuFamily
    }),
    calories: parseNumber(response.calories),
    protein: parseNumber(response.protein),
    cookTimeMinutes: parseNumber(response.cookTimeMinutes),
    unknownIngredients: uniqueIngredients([
      ...usedIngredients.unknownValues,
      ...optionalAddedIngredients.unknownValues,
      ...missingIngredients.unknownValues,
      ...substitutes.unknownValues
    ])
  } satisfies NormalizedAiMealSelection;
}

export function validateAiMealSelection(
  input: ValidateAiMealSelectionInput
):
  | { ok: true; reasons: []; normalized: ValidatedAiMealSelection }
  | { ok: false; reasons: string[]; normalized: NormalizedAiMealSelection } {
  const inputIngredients = uniqueIngredients(input.inputIngredients);
  const normalized = normalizeSelection(
    input.response,
    input.ingredientCatalog,
    input.generationMode === "ingredient_first" ? inputIngredients : []
  );
  const reasons: string[] = [];
  const normalizedAllergies = uniqueIngredients(input.allergies);
  const allowedSupplements = uniqueIngredients(input.allowedSupplements);
  const allowedIngredientSet = new Set(
    uniqueIngredients([...inputIngredients, ...allowedSupplements, ...PANTRY_BASICS])
  );
  const allowedSupplementSet = new Set(allowedSupplements);
  const textFields = [
    normalized.selectedMenu,
    normalized.cookingStyle,
    normalized.recommendation,
    normalized.missingIngredientExplanation,
    normalized.textureGuide,
    normalized.caution,
    ...normalized.recipeSummary,
    ...normalized.recipeFull
  ];
  const ingredientFields = uniqueIngredients([
    ...normalized.usedIngredients,
    ...normalized.optionalAddedIngredients,
    ...normalized.missingIngredients,
    ...Object.keys(normalized.substitutes),
    ...Object.values(normalized.substitutes).flat()
  ]);

  if (!normalized.selectedMenu) {
    reasons.push("selectedMenu is empty");
  }

  if (!normalized.cookingStyle) {
    reasons.push("cookingStyle is empty");
  }

  if (normalized.recipeSummary.length !== 3) {
    reasons.push("recipeSummary must contain exactly 3 steps");
  }

  if (normalized.recipeFull.length < 5 || normalized.recipeFull.length > 8) {
    reasons.push("recipeFull must contain 5 to 8 steps");
  }

  if (normalized.usedIngredients.length === 0) {
    reasons.push("usedIngredients must not be empty");
  }

  if (normalized.unknownIngredients.length > 0) {
    reasons.push(`unknown ingredients: ${normalized.unknownIngredients.join(", ")}`);
  }

  if (hasOverlap(normalized.usedIngredients, normalized.missingIngredients)) {
    reasons.push("usedIngredients and missingIngredients overlap");
  }

  if (hasOverlap(normalized.optionalAddedIngredients, normalized.missingIngredients)) {
    reasons.push("optionalAddedIngredients and missingIngredients overlap");
  }

  if (normalized.optionalAddedIngredients.some((item) => !normalized.usedIngredients.includes(item))) {
    reasons.push("optionalAddedIngredients must also appear in usedIngredients");
  }

  if (Object.keys(normalized.substitutes).some((ingredient) => !normalized.missingIngredients.includes(ingredient))) {
    reasons.push("substitutes may only be provided for missingIngredients");
  }

  if (
    textFields.some((field) => containsAllergyText(field, normalizedAllergies)) ||
    ingredientFields.some((field) => normalizedAllergies.includes(field))
  ) {
    reasons.push("allergy content detected");
  }

  if (textFields.some((field) => containsDangerousText(field))) {
    reasons.push("dangerous text detected");
  }

  const ageRange = getDefaultAgeRange(normalized.normalizedMenuFamily);

  if (input.ageMonths < ageRange.minAgeMonths || input.ageMonths > ageRange.maxAgeMonths) {
    reasons.push("menu family is outside the child's age range");
  }

  const priorMenuSet = new Set(input.priorMeals.map((meal) => formatMealHistoryKey(meal.menu)));
  const priorFamilySet = new Set(
    input.priorMeals
      .map((meal) => meal.menuFamily?.trim())
      .filter((item): item is string => Boolean(item))
  );

  if (priorMenuSet.has(formatMealHistoryKey(normalized.selectedMenu))) {
    reasons.push("selectedMenu duplicates recent history");
  }

  if (input.attemptNumber === 1 && priorFamilySet.has(normalized.normalizedMenuFamily)) {
    reasons.push("menuFamily duplicates recent history");
  }

  if (input.generationMode === "ingredient_first") {
    if (normalized.usedIngredients.some((ingredient) => !allowedIngredientSet.has(ingredient))) {
      reasons.push("usedIngredients exceeded input plus allowed supplements");
    }

    if (normalized.missingIngredients.some((ingredient) => !allowedIngredientSet.has(ingredient))) {
      reasons.push("missingIngredients exceeded input plus allowed supplements");
    }

    if (normalized.optionalAddedIngredients.some((ingredient) => !allowedSupplementSet.has(ingredient))) {
      reasons.push("optionalAddedIngredients exceeded allowed supplements");
    }

    const usedSupplements = normalized.usedIngredients.filter(
      (ingredient) => !inputIngredients.includes(ingredient) && allowedSupplementSet.has(ingredient)
    );

    if (usedSupplements.some((ingredient) => !normalized.optionalAddedIngredients.includes(ingredient))) {
      reasons.push("used supplement ingredients must be listed in optionalAddedIngredients");
    }
  }

  if (input.generationMode === "auto_recommend") {
    const nonPantryIngredients = normalized.usedIngredients.filter(
      (ingredient) => !PANTRY_BASICS.includes(ingredient as (typeof PANTRY_BASICS)[number])
    );

    if (nonPantryIngredients.length === 0) {
      reasons.push("auto_recommend requires at least one known core ingredient");
    }
  }

  if (reasons.length > 0) {
    return {
      ok: false,
      reasons: uniqueIngredients(reasons),
      normalized
    };
  }

  return {
    ok: true,
    reasons: [],
    normalized: {
      ...normalized,
      mainProtein: deriveMainProtein(normalized.usedIngredients, normalized.mainProtein)
    }
  };
}

function isWithinTolerance(actual: number, expected: number, toleranceRatio: number, absoluteSlack = 0) {
  if (!Number.isFinite(actual) || actual < 0) {
    return false;
  }

  const allowedDelta = Math.max(expected * toleranceRatio, absoluteSlack);
  return Math.abs(actual - expected) <= allowedDelta;
}

export function validateMealNutrition(input: NutritionValidationInput): {
  nutritionSource: NutritionSource;
  calories: number;
  protein: number;
  cookTimeMinutes: number;
  nutritionEstimate: NutritionEstimate;
} {
  const systemNutrition = applyNutritionEstimateToRecommendation({
    mealType: input.mealType,
    ageMonths: input.ageMonths,
    menuFamily: input.menuFamily,
    usedIngredients: input.usedIngredients,
    missingIngredients: input.missingIngredients,
    optionalAddedIngredients: input.optionalAddedIngredients
  });
  const isAcceptable =
    isWithinTolerance(input.calories, systemNutrition.calories, 0.3, 20) &&
    isWithinTolerance(input.protein, systemNutrition.protein, 0.4, 2) &&
    isWithinTolerance(input.cookTimeMinutes, systemNutrition.cookTimeMinutes, 0, 10);

  if (!isAcceptable) {
    return {
      nutritionSource: "system_fallback",
      calories: systemNutrition.calories,
      protein: systemNutrition.protein,
      cookTimeMinutes: systemNutrition.cookTimeMinutes,
      nutritionEstimate: systemNutrition.nutritionEstimate
    };
  }

  return {
    nutritionSource: "ai_validated",
    calories: Math.round(input.calories),
    protein: Number(input.protein.toFixed(1)),
    cookTimeMinutes: Math.round(input.cookTimeMinutes),
    nutritionEstimate: {
      caloriesKcal: Math.round(input.calories),
      proteinG: Number(input.protein.toFixed(1)),
      estimatedCookTimeMin: Math.round(input.cookTimeMinutes),
      confidence: systemNutrition.nutritionEstimate.confidence,
      basisNote: "AI 제안값을 시스템 추정 범위 안에서 검증했어요."
    }
  };
}
