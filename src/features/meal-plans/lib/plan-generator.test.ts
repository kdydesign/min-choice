import { describe, expect, it } from "vitest";
import type { ChildProfile, MealType, MenuDefinition } from "../../../types/domain";
import { buildDailyMealPlanWithCandidates } from "./plan-generator";

function createChild(overrides: Partial<ChildProfile> = {}): ChildProfile {
  return {
    id: "child-1",
    name: "민이",
    ageMonths: 12,
    birthDate: "2025-04-01",
    allergies: [],
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...overrides
  };
}

function createMenu(overrides: Partial<MenuDefinition> & Pick<MenuDefinition, "id" | "name">) {
  return {
    id: overrides.id,
    name: overrides.name,
    mealTypes: overrides.mealTypes ?? ["breakfast"],
    primaryIngredients: overrides.primaryIngredients ?? [],
    optionalIngredients: overrides.optionalIngredients ?? [],
    pantryIngredients: overrides.pantryIngredients ?? [],
    hiddenIngredients: overrides.hiddenIngredients ?? [],
    defaultMissingIngredients: overrides.defaultMissingIngredients ?? [],
    substitutes: overrides.substitutes ?? {},
    cookingStyle: overrides.cookingStyle ?? "죽",
    mainProtein: overrides.mainProtein ?? "채소",
    description: overrides.description ?? "테스트 메뉴",
    textureNote: overrides.textureNote ?? "부드럽게 조리해 주세요.",
    caution: overrides.caution ?? "아이가 먹기 좋게 식감을 확인해 주세요.",
    calories: overrides.calories ?? 180,
    protein: overrides.protein ?? 8,
    cookTimeMinutes: overrides.cookTimeMinutes ?? 15,
    recipeSummary:
      overrides.recipeSummary ?? [
        "재료를 잘게 준비합니다.",
        "충분히 익혀 부드럽게 조리합니다.",
        "먹기 좋게 마무리합니다."
      ]
  } satisfies MenuDefinition;
}

function createMealInputs(overrides: Partial<Record<MealType, string[]>> = {}) {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
    ...overrides
  };
}

describe("buildDailyMealPlanWithCandidates", () => {
  it("prefers an unseen protein candidate for the next meal", () => {
    const menuCatalog = [
      createMenu({
        id: "beef-porridge",
        name: "소고기 죽",
        mealTypes: ["breakfast"],
        primaryIngredients: ["소고기"],
        pantryIngredients: ["쌀"],
        defaultMissingIngredients: ["쌀"],
        substitutes: { 쌀: ["밥"] },
        cookingStyle: "죽",
        mainProtein: "소고기"
      }),
      createMenu({
        id: "beef-rice",
        name: "소고기 덮밥",
        mealTypes: ["lunch"],
        primaryIngredients: ["소고기", "양배추"],
        pantryIngredients: ["밥"],
        defaultMissingIngredients: ["밥"],
        substitutes: { 밥: ["죽밥"] },
        cookingStyle: "덮밥",
        mainProtein: "소고기"
      }),
      createMenu({
        id: "tofu-rice",
        name: "두부 덮밥",
        mealTypes: ["lunch"],
        primaryIngredients: ["두부", "양배추"],
        pantryIngredients: ["밥"],
        defaultMissingIngredients: ["밥"],
        substitutes: { 밥: ["죽밥"] },
        cookingStyle: "덮밥",
        mainProtein: "두부"
      })
    ];

    const { plan } = buildDailyMealPlanWithCandidates({
      child: createChild(),
      mealInputs: createMealInputs({
        breakfast: ["쇠고기", "쌀"],
        lunch: ["소고기", "양배추", "두부", "밥"]
      }),
      menuCatalog
    });

    expect(plan.results.breakfast.name).toBe("소고기 죽");
    expect(plan.results.lunch.name).toBe("두부 덮밥");
    expect(plan.results.lunch.alternatives).toContain("소고기 덮밥");
  });

  it("excludes allergy ingredients from inputs and keeps only safe ingredients", () => {
    const { plan } = buildDailyMealPlanWithCandidates({
      child: createChild({ allergies: ["계란"] }),
      mealInputs: createMealInputs({
        breakfast: ["계란", "감자"]
      }),
      menuCatalog: []
    });

    expect(plan.results.breakfast.isFallback).toBe(true);
    expect(plan.results.breakfast.excludedAllergyIngredients).toEqual(["달걀"]);
    expect(plan.results.breakfast.inputIngredients).toEqual(["감자"]);
    expect(plan.notices).toContainEqual({
      tone: "danger",
      message: "아침 입력에서 알레르기 재료 달걀를 제외했어요."
    });
  });

  it("adds warnings for out-of-range ages and missing candidates", () => {
    const { plan } = buildDailyMealPlanWithCandidates({
      child: createChild({ ageMonths: 20 }),
      mealInputs: createMealInputs({
        breakfast: ["바나나"]
      }),
      menuCatalog: []
    });

    expect(plan.results.breakfast.isFallback).toBe(true);
    expect(plan.notices).toContainEqual({
      tone: "warning",
      message:
        "민이 프로필은 20개월로 입력되어 있어요. 추천 식감과 조리 난이도는 실제 개월수를 기준으로 조정했어요."
    });
    expect(plan.notices).toContainEqual({
      tone: "warning",
      message: "아침은 정확히 맞는 메뉴가 적어 기본 대체 메뉴를 추천했어요."
    });
  });

  it("adds nutrition metadata to every result", () => {
    const { plan } = buildDailyMealPlanWithCandidates({
      child: createChild(),
      mealInputs: createMealInputs({
        breakfast: ["소고기", "애호박", "쌀"]
      }),
      menuCatalog: [
        createMenu({
          id: "beef-porridge",
          name: "소고기 죽",
          mealTypes: ["breakfast"],
          primaryIngredients: ["소고기", "애호박"],
          pantryIngredients: ["쌀"],
          defaultMissingIngredients: ["쌀"],
          substitutes: { 쌀: ["밥"] },
          calories: 180,
          protein: 8,
          cookTimeMinutes: 15
        })
      ]
    });

    expect(plan.results.breakfast.calories).toBe(180);
    expect(plan.results.breakfast.protein).toBe(8);
    expect(plan.results.breakfast.cookTimeMinutes).toBe(15);
  });

  it("prefers a less baby-style menu for older toddlers when equivalent options exist", () => {
    const menuCatalog = [
      createMenu({
        id: "beef-zucchini-porridge",
        name: "소고기 애호박 죽",
        mealTypes: ["breakfast"],
        primaryIngredients: ["소고기", "애호박"],
        pantryIngredients: ["쌀"],
        defaultMissingIngredients: ["쌀"],
        substitutes: { 쌀: ["밥"] },
        cookingStyle: "죽",
        mainProtein: "소고기"
      }),
      createMenu({
        id: "beef-zucchini-soft-rice",
        name: "소고기 애호박 무른밥",
        mealTypes: ["breakfast"],
        primaryIngredients: ["소고기", "애호박"],
        pantryIngredients: ["밥"],
        defaultMissingIngredients: ["밥"],
        substitutes: { 밥: ["죽밥"] },
        cookingStyle: "무른밥",
        mainProtein: "소고기"
      })
    ];

    const { plan } = buildDailyMealPlanWithCandidates({
      child: createChild({ ageMonths: 32 }),
      mealInputs: createMealInputs({
        breakfast: ["소고기", "애호박", "밥"]
      }),
      menuCatalog
    });

    expect(plan.results.breakfast.name).toBe("소고기 애호박 무른밥");
    expect(plan.results.breakfast.cookingStyle).toBe("무른밥");
  });

  it("uses an older-child fallback style instead of porridge for breakfast when no candidates exist", () => {
    const { plan } = buildDailyMealPlanWithCandidates({
      child: createChild({ ageMonths: 32 }),
      mealInputs: createMealInputs({
        breakfast: ["바나나"]
      }),
      menuCatalog: []
    });

    expect(plan.results.breakfast.isFallback).toBe(true);
    expect(plan.results.breakfast.cookingStyle).toBe("무른밥");
  });
});
