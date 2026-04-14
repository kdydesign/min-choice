import { describe, expect, it } from "vitest";
import { estimateMealNutrition } from "./nutrition-estimate";

describe("estimateMealNutrition", () => {
  it("returns rounded nutrition values and a confidence label for known ingredients", () => {
    const estimate = estimateMealNutrition({
      mealType: "breakfast",
      ageMonths: 19,
      menuFamily: "rice_bowl",
      usedIngredients: ["밥", "소고기", "애호박"],
      missingIngredients: [],
      optionalAddedIngredients: []
    });

    expect(Number.isInteger(estimate.caloriesKcal)).toBe(true);
    expect(estimate.proteinG).toBe(Number(estimate.proteinG.toFixed(1)));
    expect(estimate.estimatedCookTimeMin % 5).toBe(0);
    expect(["medium", "high"]).toContain(estimate.confidence);
  });

  it("increases estimated portion-driven nutrition for older children", () => {
    const younger = estimateMealNutrition({
      mealType: "lunch",
      ageMonths: 11,
      menuFamily: "soft_stir",
      usedIngredients: ["밥", "소고기", "브로콜리"],
      missingIngredients: [],
      optionalAddedIngredients: []
    });
    const older = estimateMealNutrition({
      mealType: "lunch",
      ageMonths: 32,
      menuFamily: "soft_stir",
      usedIngredients: ["밥", "소고기", "브로콜리"],
      missingIngredients: [],
      optionalAddedIngredients: []
    });

    expect(older.caloriesKcal).toBeGreaterThan(younger.caloriesKcal);
    expect(older.proteinG).toBeGreaterThan(younger.proteinG);
  });

  it("adjusts cook time by menu family complexity", () => {
    const omelet = estimateMealNutrition({
      mealType: "dinner",
      ageMonths: 24,
      menuFamily: "omelet",
      usedIngredients: ["달걀", "브로콜리"],
      missingIngredients: [],
      optionalAddedIngredients: []
    });
    const stew = estimateMealNutrition({
      mealType: "dinner",
      ageMonths: 24,
      menuFamily: "stew",
      usedIngredients: ["소고기", "감자", "당근"],
      missingIngredients: [],
      optionalAddedIngredients: []
    });

    expect(stew.estimatedCookTimeMin).toBeGreaterThan(omelet.estimatedCookTimeMin);
  });
});
