import { describe, expect, it } from "vitest";
import {
  emptyMealDraft,
  getIngredientConflicts,
  normalizeIngredient,
  parseDelimitedIngredients,
  uniqueIngredients
} from "./ingredient-utils";

describe("ingredient-utils", () => {
  it("normalizes aliases and trims whitespace", () => {
    expect(normalizeIngredient("  쇠고기  ")).toBe("소고기");
    expect(normalizeIngredient("쥬키니")).toBe("애호박");
  });

  it("deduplicates normalized ingredients while preserving order", () => {
    expect(uniqueIngredients([" 쇠고기 ", "소고기", "쥬키니", "애호박", ""])).toEqual([
      "소고기",
      "애호박"
    ]);
  });

  it("parses mixed delimiters and finds normalized allergy conflicts", () => {
    const parsed = parseDelimitedIngredients("쇠고기, 감자/\n계란");

    expect(parsed).toEqual(["소고기", "감자", "달걀"]);
    expect(getIngredientConflicts(parsed, ["계란", "우유"])).toEqual(["달걀"]);
  });

  it("creates an empty meal draft", () => {
    expect(emptyMealDraft()).toEqual({
      breakfast: [],
      lunch: [],
      dinner: [],
      updatedAt: null
    });
  });
});
