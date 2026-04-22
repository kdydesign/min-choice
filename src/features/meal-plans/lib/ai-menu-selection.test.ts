import { describe, expect, it } from "vitest";
import type { AiMealResponse } from "../types/generation-contract";
import {
  validateAiMealSelection,
  validateMealNutrition,
  type IngredientCatalogEntry,
  type MealHistorySnapshot
} from "./ai-menu-selection";

const INGREDIENT_CATALOG: IngredientCatalogEntry[] = [
  { standardKey: "애호박", displayName: "애호박", aliases: ["호박"], isAllergen: false },
  { standardKey: "쌀", displayName: "쌀", aliases: ["흰쌀"], isAllergen: false },
  { standardKey: "밥", displayName: "밥", aliases: ["죽밥"], isAllergen: false },
  { standardKey: "당근", displayName: "당근", aliases: [], isAllergen: false },
  { standardKey: "두부", displayName: "두부", aliases: [], isAllergen: true },
  { standardKey: "브로콜리", displayName: "브로콜리", aliases: [], isAllergen: false }
] satisfies IngredientCatalogEntry[];

function createResponse(overrides: Partial<AiMealResponse> = {}): AiMealResponse {
  return {
    selectedMenu: "애호박 두부 무른밥",
    cookingStyle: "무른밥",
    mainProtein: "두부",
    usedIngredients: ["애호박", "두부", "밥"],
    optionalAddedIngredients: ["두부", "밥"],
    missingIngredients: [],
    missingIngredientExplanation: "추가 재료 없이도 비교적 안정적으로 만들 수 있어요.",
    substitutes: [],
    recommendation: "애호박과 두부를 넣어 부드럽게 만들기 좋은 메뉴예요.",
    recipeSummary: [
      "애호박과 두부를 잘게 준비합니다.",
      "밥과 함께 촉촉하게 익혀 부드러운 질감을 맞춥니다.",
      "한 번 더 섞어 아이가 먹기 좋은 크기로 마무리합니다."
    ],
    recipeFull: [
      "애호박을 잘게 다집니다.",
      "두부의 수분을 가볍게 정리합니다.",
      "냄비에 애호박과 두부를 넣고 약불에서 익힙니다.",
      "밥을 넣고 물이나 육수를 소량 더해 부드럽게 섞습니다.",
      "아이가 먹기 좋은 질감이 되면 식혀 제공합니다."
    ],
    textureGuide: "부드럽게 익히되 아주 작은 덩어리만 남겨 주세요.",
    caution: "처음 먹는 재료라면 소량부터 시작해 반응을 확인해 주세요.",
    menuFamily: "soft_stir",
    calories: 215,
    protein: 8.5,
    cookTimeMinutes: 18,
    ...overrides
  };
}

function createHistory(overrides: Partial<MealHistorySnapshot> = {}): MealHistorySnapshot {
  return {
    mealType: "breakfast",
    menu: "소고기 무른밥",
    menuFamily: "soft_stir",
    mainProtein: "소고기",
    ...overrides
  };
}

describe("validateAiMealSelection", () => {
  it("rejects ingredient_first responses that use extra core ingredients outside the allowed set", () => {
    const result = validateAiMealSelection({
      response: createResponse({
        usedIngredients: ["애호박", "쌀", "당근", "브로콜리"],
        optionalAddedIngredients: [],
        mainProtein: "채소"
      }),
      mealType: "breakfast",
      generationMode: "ingredient_first",
      ageMonths: 13,
      allergies: [],
      inputIngredients: ["애호박", "쌀", "당근"],
      allowedSupplements: ["두부"],
      priorMeals: [],
      ingredientCatalog: INGREDIENT_CATALOG,
      attemptNumber: 1
    });

    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("usedIngredients exceeded input plus allowed supplements");
  });

  it("accepts ingredient_first responses when added ingredients stay inside allowedSupplements", () => {
    const result = validateAiMealSelection({
      response: createResponse({
        selectedMenu: "애호박 두부 무른밥",
        usedIngredients: ["애호박", "두부", "밥"],
        optionalAddedIngredients: ["두부", "밥"],
        mainProtein: "두부"
      }),
      mealType: "breakfast",
      generationMode: "ingredient_first",
      ageMonths: 13,
      allergies: [],
      inputIngredients: ["애호박"],
      allowedSupplements: ["두부", "밥"],
      priorMeals: [],
      ingredientCatalog: INGREDIENT_CATALOG,
      attemptNumber: 1
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalized.usedIngredients).toEqual(["애호박", "두부", "밥"]);
      expect(result.normalized.mainProtein).toBe("두부");
    }
  });

  it("accepts unknown user-input ingredients during ingredient_first validation", () => {
    const result = validateAiMealSelection({
      response: createResponse({
        selectedMenu: "가지 콩나물 쌀죽",
        cookingStyle: "죽",
        mainProtein: "채소",
        usedIngredients: ["가지", "콩나물", "쌀"],
        optionalAddedIngredients: [],
        recommendation: "가지와 콩나물을 쌀과 함께 부드럽게 끓여 아침으로 만들기 좋은 메뉴예요.",
        recipeSummary: [
          "가지와 콩나물을 잘게 준비합니다.",
          "쌀과 함께 충분히 끓여 부드러운 죽 질감을 맞춥니다.",
          "아이가 먹기 좋게 식혀서 제공합니다."
        ],
        recipeFull: [
          "쌀을 깨끗이 씻어 잠시 불립니다.",
          "가지는 껍질을 정리하고 아주 잘게 썹니다.",
          "콩나물은 질긴 부분을 정리한 뒤 잘게 다집니다.",
          "냄비에 쌀, 가지, 콩나물, 물을 넣고 약불에서 천천히 끓입니다.",
          "재료가 충분히 익으면 농도를 맞추고 식혀 제공합니다."
        ],
        textureGuide: "푹 익혀 곱게 퍼지는 죽 질감으로 맞춰 주세요.",
        menuFamily: "porridge",
        calories: 180,
        protein: 5,
        cookTimeMinutes: 20
      }),
      mealType: "breakfast",
      generationMode: "ingredient_first",
      ageMonths: 13,
      allergies: [],
      inputIngredients: ["가지", "콩나물", "쌀"],
      allowedSupplements: [],
      priorMeals: [],
      ingredientCatalog: INGREDIENT_CATALOG,
      attemptNumber: 1
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalized.usedIngredients).toEqual(["가지", "콩나물", "쌀"]);
    }
  });

  it("rejects exact menu duplicates from recent history", () => {
    const result = validateAiMealSelection({
      response: createResponse(),
      mealType: "breakfast",
      generationMode: "ingredient_first",
      ageMonths: 13,
      allergies: [],
      inputIngredients: ["애호박"],
      allowedSupplements: ["두부", "밥"],
      priorMeals: [createHistory({ menu: "애호박 두부 무른밥", menuFamily: "soft_stir" })],
      ingredientCatalog: INGREDIENT_CATALOG,
      attemptNumber: 1
    });

    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("selectedMenu duplicates recent history");
  });

  it("rejects family duplicates on the first attempt but allows them on the second attempt when the menu name changes", () => {
    const firstAttempt = validateAiMealSelection({
      response: createResponse({ selectedMenu: "브로콜리 두부 무른밥", usedIngredients: ["브로콜리", "두부", "밥"] }),
      mealType: "lunch",
      generationMode: "auto_recommend",
      ageMonths: 13,
      allergies: [],
      inputIngredients: [],
      allowedSupplements: [],
      priorMeals: [createHistory({ menu: "소고기 무른밥", menuFamily: "soft_stir" })],
      ingredientCatalog: INGREDIENT_CATALOG,
      attemptNumber: 1
    });
    const secondAttempt = validateAiMealSelection({
      response: createResponse({ selectedMenu: "브로콜리 두부 무른밥", usedIngredients: ["브로콜리", "두부", "밥"] }),
      mealType: "lunch",
      generationMode: "auto_recommend",
      ageMonths: 13,
      allergies: [],
      inputIngredients: [],
      allowedSupplements: [],
      priorMeals: [createHistory({ menu: "소고기 무른밥", menuFamily: "soft_stir" })],
      ingredientCatalog: INGREDIENT_CATALOG,
      attemptNumber: 2
    });

    expect(firstAttempt.ok).toBe(false);
    expect(firstAttempt.reasons).toContain("menuFamily duplicates recent history");
    expect(secondAttempt.ok).toBe(true);
  });

  it("rejects unknown ingredients for auto_recommend responses", () => {
    const result = validateAiMealSelection({
      response: createResponse({
        selectedMenu: "용과 두부 무른밥",
        usedIngredients: ["용과", "두부", "밥"]
      }),
      mealType: "dinner",
      generationMode: "auto_recommend",
      ageMonths: 13,
      allergies: [],
      inputIngredients: [],
      allowedSupplements: [],
      priorMeals: [],
      ingredientCatalog: INGREDIENT_CATALOG,
      attemptNumber: 1
    });

    expect(result.ok).toBe(false);
    expect(result.reasons.some((reason) => reason.includes("unknown ingredients"))).toBe(true);
  });
});

describe("validateMealNutrition", () => {
  it("falls back to the system estimate when AI nutrition is outside tolerance", () => {
    const result = validateMealNutrition({
      mealType: "lunch",
      ageMonths: 13,
      menuFamily: "soft_stir",
      usedIngredients: ["두부", "밥", "당근"],
      missingIngredients: [],
      optionalAddedIngredients: ["밥"],
      calories: 520,
      protein: 1,
      cookTimeMinutes: 60
    });

    expect(result.nutritionSource).toBe("system_fallback");
    expect(result.calories).toBeLessThan(300);
  });
});
