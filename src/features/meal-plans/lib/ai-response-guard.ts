import type { GeneratedMealContent } from "../../../types/domain";
import { uniqueIngredients } from "../../ingredients/lib/ingredient-utils";
import { generateMealNarrative } from "./meal-narrative";

interface GuardInput {
  generated: Partial<GeneratedMealContent> | null | undefined;
  mealType: "breakfast" | "lunch" | "dinner";
  ageMonths: number;
  menuName: string;
  cookingStyle: string;
  usedIngredients: string[];
  missingIngredients: string[];
  recipeSummary: string[];
  caution: string;
  allergies: string[];
}

function containsAllergyText(text: string, allergies: string[]) {
  return uniqueIngredients(allergies).some((allergy) => text.includes(allergy));
}

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
];

function containsDangerousText(text: string) {
  return DANGEROUS_PHRASES.some((phrase) => text.includes(phrase));
}

function containsAgeMismatch(text: string, ageMonths: number) {
  const matches = [...text.matchAll(/(\d+)\s*개월/g)].map((match) => Number(match[1]));

  if (matches.length === 0) {
    return false;
  }

  return matches.some((matchedMonths) => matchedMonths !== ageMonths);
}

export function guardGeneratedMealContent(input: GuardInput): GeneratedMealContent {
  const fallback = generateMealNarrative({
    mealType: input.mealType,
    ageMonths: input.ageMonths,
    menuName: input.menuName,
    cookingStyle: input.cookingStyle,
    usedIngredients: input.usedIngredients,
    missingIngredients: input.missingIngredients,
    recipeSummary: input.recipeSummary,
    caution: input.caution
  });

  if (!input.generated) {
    return fallback;
  }

  const recommendationText = input.generated.recommendationText?.trim() ?? "";
  const guardedRecipeSummary =
    input.generated.recipeSummary?.map((step) => step.trim()).filter(Boolean) ?? [];
  const guardedRecipeFull =
    input.generated.recipeFull?.map((step) => step.trim()).filter(Boolean) ?? guardedRecipeSummary;
  const missingIngredientExplanation = input.generated.missingIngredientExplanation?.trim() ?? "";
  const caution = input.generated.caution?.trim() ?? "";

  const invalidText =
    !recommendationText ||
    !missingIngredientExplanation ||
    guardedRecipeSummary.length === 0 ||
    guardedRecipeFull.length < 5 ||
    containsAllergyText(recommendationText, input.allergies) ||
    containsAllergyText(missingIngredientExplanation, input.allergies) ||
    containsAllergyText(caution, input.allergies) ||
    guardedRecipeSummary.some((step) => containsAllergyText(step, input.allergies)) ||
    guardedRecipeFull.some((step) => containsAllergyText(step, input.allergies)) ||
    containsAgeMismatch(recommendationText, input.ageMonths) ||
    containsAgeMismatch(missingIngredientExplanation, input.ageMonths) ||
    containsAgeMismatch(caution, input.ageMonths) ||
    guardedRecipeSummary.some((step) => containsAgeMismatch(step, input.ageMonths)) ||
    guardedRecipeFull.some((step) => containsAgeMismatch(step, input.ageMonths)) ||
    containsDangerousText(recommendationText) ||
    containsDangerousText(missingIngredientExplanation) ||
    containsDangerousText(caution) ||
    guardedRecipeSummary.some((step) => containsDangerousText(step)) ||
    guardedRecipeFull.some((step) => containsDangerousText(step));

  if (invalidText) {
    return fallback;
  }

  return {
    recommendationText,
    recipeSummary: guardedRecipeSummary.slice(0, 3),
    recipeFull: guardedRecipeFull.slice(0, 8),
    missingIngredientExplanation,
    caution: caution || fallback.caution,
    promptVersion: input.generated.promptVersion?.trim() || "guarded-v1",
    isFallback: input.generated.isFallback ?? false
  };
}
