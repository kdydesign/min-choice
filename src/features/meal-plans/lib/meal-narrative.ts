import type { GeneratedMealContent } from "../../../types/domain";
import { formatIngredientList } from "../../ingredients/lib/ingredient-utils";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

interface MealNarrativeInput {
  mealType: "breakfast" | "lunch" | "dinner";
  menuName: string;
  cookingStyle: string;
  usedIngredients: string[];
  missingIngredients: string[];
  recipeSummary: string[];
  caution: string;
}

export function generateMealNarrative(input: MealNarrativeInput): GeneratedMealContent {
  const lead =
    input.usedIngredients.length > 0
      ? `${formatIngredientList(input.usedIngredients.slice(0, 2))}로`
      : "지금 있는 재료로";
  const missingText =
    input.missingIngredients.length > 0
      ? `${formatIngredientList(input.missingIngredients)}가 있으면 ${input.menuName}을 더 안정적으로 만들 수 있어요.`
      : `${input.menuName}은 추가 재료 없이도 비교적 쉽게 만들 수 있어요.`;

  return {
    recommendationText: `${lead} ${input.cookingStyle} 스타일로 만들기 좋아 ${MEAL_LABELS[input.mealType]}에 잘 어울려요.`,
    recipeSummary: input.recipeSummary.slice(0, 3),
    missingIngredientExplanation: missingText,
    caution: input.caution,
    promptVersion: "fallback-v1",
    isFallback: true
  };
}
