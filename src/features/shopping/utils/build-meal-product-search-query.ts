import type { MealRecommendation, MealType } from "../../../types/domain";
import type { MealProductSearchContext, ProductSearchCategory } from "../types";

interface MealProductSearchInput {
  mealType: MealType;
  meal: MealRecommendation;
  mealPlanId?: string | null;
  mealPlanItemId?: string | null;
}

export interface MealProductSearchLink {
  ctaLabel: string;
  query: string;
  category: ProductSearchCategory;
  source: "meal_result";
  mealContext: MealProductSearchContext;
}

const SIDE_DISH_KEYWORDS = ["반찬", "볶음", "구이", "조림", "무침"];
const SNACK_KEYWORDS = ["퓨레", "간식", "과일", "바나나", "사과"];
const BABY_FOOD_KEYWORDS = ["죽", "무른밥", "덮밥", "진밥", "밥"];

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getCoreIngredients(meal: MealRecommendation) {
  const candidates = uniqueNonEmpty([
    ...meal.usedIngredients,
    ...meal.inputIngredients,
    meal.mainProtein
  ]);

  return candidates.slice(0, 2);
}

function inferCategory(meal: MealRecommendation): ProductSearchCategory {
  const haystack = [meal.name, meal.menuFamily ?? "", meal.cookingStyle].join(" ");

  if (SNACK_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "snack";
  }

  if (SIDE_DISH_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "baby_side_dish";
  }

  if (BABY_FOOD_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "baby_food";
  }

  return "baby_food";
}

function getCategoryKeyword(category: ProductSearchCategory, mealName: string) {
  if (category === "baby_side_dish") {
    return "아기반찬";
  }

  if (category === "snack") {
    return mealName.includes("퓨레") ? "퓨레" : "아기 간식";
  }

  if (category === "toddler_food") {
    return "유아식";
  }

  return "이유식";
}

function getCtaLabel(category: ProductSearchCategory) {
  if (category === "baby_side_dish") {
    return "비슷한 아기반찬 최저가 보기";
  }

  if (category === "snack") {
    return "비슷한 아기 간식 최저가 보기";
  }

  if (category === "baby_food" || category === "toddler_food") {
    return "비슷한 기성 이유식 최저가 보기";
  }

  return "비슷한 기성제품 찾기";
}

export function buildMealProductSearchQuery({
  mealType,
  meal,
  mealPlanId = null,
  mealPlanItemId = null
}: MealProductSearchInput): MealProductSearchLink {
  const category = inferCategory(meal);
  const ingredients = getCoreIngredients(meal);
  const keyword = getCategoryKeyword(category, meal.name);
  const query = [...ingredients, keyword].join(" ").replace(/\s+/g, " ").trim();

  return {
    ctaLabel: getCtaLabel(category),
    query,
    category,
    source: "meal_result",
    mealContext: {
      mealPlanId,
      mealPlanItemId,
      mealType,
      originMenuName: meal.name
    }
  };
}
