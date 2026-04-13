import type { GeneratedMealContent } from "../../../types/domain";
import { formatIngredientList } from "../../ingredients/lib/ingredient-utils";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

interface MealNarrativeInput {
  mealType: "breakfast" | "lunch" | "dinner";
  ageMonths: number;
  menuName: string;
  cookingStyle: string;
  usedIngredients: string[];
  missingIngredients: string[];
  recipeSummary: string[];
  caution: string;
}

function getAgeTextureGuide(ageMonths: number) {
  if (ageMonths <= 10) {
    return "푹 익혀 곱게 으깨 주세요.";
  }

  if (ageMonths <= 14) {
    return "부드럽게 익히되 아주 작은 덩어리만 남겨 주세요.";
  }

  return "너무 크지 않은 부드러운 한입 크기로 마무리해 주세요.";
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
    recommendationText: `${lead} ${input.ageMonths}개월 아이가 먹기 좋게 ${input.cookingStyle} 스타일로 만들기 좋아 ${MEAL_LABELS[input.mealType]}에 잘 어울려요.`,
    recipeSummary: input.recipeSummary.slice(0, 3),
    missingIngredientExplanation: missingText,
    caution: input.caution || getAgeTextureGuide(input.ageMonths),
    promptVersion: "fallback-v1",
    isFallback: true
  };
}
