import type { GeneratedMealContent } from "../../../types/domain";
import { uniqueIngredients } from "../../ingredients/lib/ingredient-utils";
import { generateMealNarrative } from "./meal-narrative";

interface GuardInput {
  generated: Partial<GeneratedMealContent> | null | undefined;
  mealType: "breakfast" | "lunch" | "dinner";
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

export function guardGeneratedMealContent(input: GuardInput): GeneratedMealContent {
  const fallback = generateMealNarrative({
    mealType: input.mealType,
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
  const missingIngredientExplanation = input.generated.missingIngredientExplanation?.trim() ?? "";
  const caution = input.generated.caution?.trim() ?? "";

  const invalidText =
    !recommendationText ||
    !missingIngredientExplanation ||
    guardedRecipeSummary.length === 0 ||
    containsAllergyText(recommendationText, input.allergies) ||
    containsAllergyText(missingIngredientExplanation, input.allergies) ||
    containsAllergyText(caution, input.allergies) ||
    guardedRecipeSummary.some((step) => containsAllergyText(step, input.allergies));

  if (invalidText) {
    return fallback;
  }

  return {
    recommendationText,
    recipeSummary: guardedRecipeSummary.slice(0, 3),
    missingIngredientExplanation,
    caution: caution || fallback.caution,
    promptVersion: input.generated.promptVersion?.trim() || "guarded-v1",
    isFallback: input.generated.isFallback ?? false
  };
}
