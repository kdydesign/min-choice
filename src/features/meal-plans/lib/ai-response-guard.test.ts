import { describe, expect, it } from "vitest";
import { guardGeneratedMealContent } from "./ai-response-guard";

const baseInput = {
  mealType: "breakfast" as const,
  ageMonths: 12,
  menuName: "소고기 애호박 죽",
  cookingStyle: "죽",
  usedIngredients: ["소고기", "애호박"],
  missingIngredients: ["쌀"],
  recipeSummary: ["재료를 잘게 다집니다.", "충분히 끓입니다.", "질감을 맞춥니다."],
  caution: "처음 먹는 재료는 소량부터 확인해 주세요.",
  allergies: ["달걀"]
};

describe("guardGeneratedMealContent", () => {
  it("returns the fallback narrative when generated content is missing", () => {
    const result = guardGeneratedMealContent({
      ...baseInput,
      generated: null
    });

    expect(result.isFallback).toBe(true);
    expect(result.promptVersion).toBe("fallback-v1");
    expect(result.recipeSummary).toEqual(baseInput.recipeSummary);
    expect(result.recipeFull).toHaveLength(5);
  });

  it("returns the fallback narrative when allergy text is present", () => {
    const result = guardGeneratedMealContent({
      ...baseInput,
      generated: {
        recommendationText: "달걀을 조금 더하면 고소하게 만들 수 있어요.",
        recipeSummary: ["재료를 잘게 다집니다.", "충분히 끓입니다.", "질감을 맞춥니다."],
        recipeFull: [
          "재료를 씻어 준비합니다.",
          "재료를 잘게 다집니다.",
          "충분히 끓입니다.",
          "질감을 맞춥니다.",
          "한 번 더 식감을 확인합니다."
        ],
        missingIngredientExplanation: "쌀이 있으면 더 안정적으로 만들 수 있어요.",
        caution: "알레르기 반응을 살펴봐 주세요.",
        promptVersion: "openai-v1",
        isFallback: false
      }
    });

    expect(result.isFallback).toBe(true);
    expect(result.promptVersion).toBe("fallback-v1");
  });

  it("accepts valid generated content and trims it", () => {
    const result = guardGeneratedMealContent({
      ...baseInput,
      generated: {
        recommendationText: "  지금 재료로 부드럽게 만들기 좋아요.  ",
        recipeSummary: [" 첫째 줄 ", " 둘째 줄 ", " 셋째 줄 ", " 넷째 줄 "],
        recipeFull: [" 첫째 단계 ", " 둘째 단계 ", " 셋째 단계 ", " 넷째 단계 ", " 다섯째 단계 "],
        missingIngredientExplanation: "  쌀이 있으면 더 안정적으로 만들 수 있어요.  ",
        caution: "  ",
        promptVersion: " openai-v2 ",
        isFallback: false
      }
    });

    expect(result).toEqual({
      recommendationText: "지금 재료로 부드럽게 만들기 좋아요.",
      recipeSummary: ["첫째 줄", "둘째 줄", "셋째 줄"],
      recipeFull: ["첫째 단계", "둘째 단계", "셋째 단계", "넷째 단계", "다섯째 단계"],
      missingIngredientExplanation: "쌀이 있으면 더 안정적으로 만들 수 있어요.",
      caution: baseInput.caution,
      promptVersion: "openai-v2",
      isFallback: false
    });
  });

  it("returns the fallback narrative when dangerous text is present", () => {
    const result = guardGeneratedMealContent({
      ...baseInput,
      generated: {
        recommendationText: "지금 재료로 매콤하게 만들면 잘 먹어요.",
        recipeSummary: ["재료를 크게 썹니다.", "충분히 끓입니다.", "질감을 맞춥니다."],
        recipeFull: [
          "재료를 크게 썹니다.",
          "충분히 끓입니다.",
          "질감을 맞춥니다.",
          "간을 더합니다.",
          "완성합니다."
        ],
        missingIngredientExplanation: "쌀이 있으면 더 안정적으로 만들 수 있어요.",
        caution: "없음",
        promptVersion: "openai-v1",
        isFallback: false
      }
    });

    expect(result.isFallback).toBe(true);
  });
});
