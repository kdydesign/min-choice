import { describe, expect, it } from "vitest";
import type { MealRecommendation } from "../../../types/domain";
import { buildMealProductSearchQuery } from "./build-meal-product-search-query";

function buildMeal(overrides: Partial<MealRecommendation>): MealRecommendation {
  return {
    id: "meal-1",
    name: "소고기 애호박 무른밥",
    menuFamily: null,
    cookingStyle: "무른밥",
    mainProtein: "소고기",
    description: "",
    textureNote: "",
    caution: "",
    recommendationText: "",
    recipeSummary: [],
    recipeFull: [],
    missingIngredientExplanation: "",
    usedIngredients: ["소고기", "애호박"],
    missingIngredients: [],
    optionalAddedIngredients: [],
    substitutes: {},
    excludedAllergyIngredients: [],
    alternatives: [],
    inputIngredients: [],
    allIngredients: [],
    nutritionEstimate: {
      caloriesKcal: 0,
      proteinG: 0,
      estimatedCookTimeMin: 0,
      confidence: "low",
      basisNote: ""
    },
    scoringMetadata: {
      ingredientUtilizationScore: 0,
      ingredientCoverageScore: 0,
      lowMissingIngredientScore: 0,
      diversityScore: 0
    },
    inputStrength: "medium",
    calories: 0,
    protein: 0,
    cookTimeMinutes: 0,
    promptVersion: "test",
    isFallback: false,
    ...overrides
  };
}

describe("buildMealProductSearchQuery", () => {
  it("builds baby food query from core ingredients", () => {
    const result = buildMealProductSearchQuery({
      mealType: "lunch",
      meal: buildMeal({})
    });

    expect(result.query).toBe("소고기 애호박 이유식");
    expect(result.category).toBe("baby_food");
    expect(result.ctaLabel).toBe("비슷한 기성 이유식 최저가 보기");
  });

  it("builds side dish query", () => {
    const result = buildMealProductSearchQuery({
      mealType: "dinner",
      meal: buildMeal({
        name: "브로콜리 두부 반찬",
        cookingStyle: "반찬",
        usedIngredients: ["브로콜리", "두부"]
      })
    });

    expect(result.query).toBe("브로콜리 두부 아기반찬");
    expect(result.category).toBe("baby_side_dish");
  });

  it("keeps puree keyword for puree-like meals", () => {
    const result = buildMealProductSearchQuery({
      mealType: "breakfast",
      meal: buildMeal({
        name: "고구마 바나나 퓨레",
        cookingStyle: "퓨레",
        usedIngredients: ["고구마", "바나나"]
      })
    });

    expect(result.query).toBe("고구마 바나나 퓨레");
    expect(result.category).toBe("snack");
  });
});
