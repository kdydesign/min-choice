import {
  type ChildProfile,
  type DailyMealPlan,
  type MealRecommendation,
  type MealType,
  type MenuDefinition,
  MEAL_TYPES
} from "../../../types/domain";
import {
  formatIngredientList,
  getIngredientConflicts,
  normalizeIngredient,
  uniqueIngredients
} from "../../ingredients/lib/ingredient-utils";
import {
  DEFAULT_SUBSTITUTES,
  getMealMetricsByType,
  MEAL_LABELS,
  MENU_CATALOG
} from "../../menus/data/menu-catalog";
import { deriveAgeMonthsFromBirthDate } from "../../children/lib/profile-date-utils";
import { guardGeneratedMealContent } from "./ai-response-guard";
import { generateMealNarrative } from "./meal-narrative";

export interface DailyMealPlanWithCandidates {
  plan: DailyMealPlan;
  candidates: Record<MealType, MealRecommendation[]>;
}

interface BuildDailyMealPlanInput {
  child: ChildProfile;
  mealInputs: Record<MealType, string[]>;
  menuCatalog?: MenuDefinition[];
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getAgeMonths(profile: ChildProfile) {
  if (Number.isFinite(profile.ageMonths) && profile.ageMonths >= 0) {
    return profile.ageMonths;
  }

  const derivedAgeMonths = profile.birthDate
    ? deriveAgeMonthsFromBirthDate(profile.birthDate)
    : null;

  if (derivedAgeMonths !== null) {
    return derivedAgeMonths;
  }

  return 12;
}

export function isTooSoftCookingStyleForAge(cookingStyle: string, ageMonths: number) {
  return ageMonths >= 24 && ["죽", "매시"].includes(cookingStyle);
}

function getAgeStyleAdjustment(menu: MenuDefinition, ageMonths: number) {
  if (ageMonths <= 10) {
    if (["죽", "매시", "리조또"].includes(menu.cookingStyle)) {
      return 0.8;
    }

    if (["볶음밥", "덮밥", "스크램블"].includes(menu.cookingStyle)) {
      return -0.8;
    }
  }

  if (ageMonths >= 24) {
    if (["무른밥", "덮밥", "볶음밥", "스크램블"].includes(menu.cookingStyle)) {
      return 1.6;
    }

    if (["리조또", "스튜"].includes(menu.cookingStyle)) {
      return 0.8;
    }

    if (menu.cookingStyle === "죽") {
      return -2.6;
    }

    if (menu.cookingStyle === "매시") {
      return -3;
    }
  }

  if (ageMonths >= 16) {
    if (["무른밥", "덮밥", "볶음밥", "리조또", "스크램블"].includes(menu.cookingStyle)) {
      return 0.9;
    }

    if (menu.cookingStyle === "스튜") {
      return 0.6;
    }

    if (menu.cookingStyle === "죽") {
      return -1.2;
    }

    if (menu.cookingStyle === "매시") {
      return -1.6;
    }
  }

  return 0;
}

function getFallbackCookingStyle(mealType: MealType, ageMonths: number) {
  if (ageMonths >= 24) {
    return mealType === "breakfast" ? "무른밥" : "덮밥";
  }

  if (ageMonths >= 16) {
    return mealType === "breakfast" ? "리조또" : mealType === "lunch" ? "무른밥" : "덮밥";
  }

  return mealType === "breakfast" ? "죽" : mealType === "lunch" ? "무른밥" : "리조또";
}

function getFallbackMissingIngredients(cookingStyle: string) {
  if (cookingStyle === "죽") {
    return ["쌀"];
  }

  if (["무른밥", "덮밥", "볶음밥", "리조또"].includes(cookingStyle)) {
    return ["밥"];
  }

  return [];
}

function getAllMenuIngredients(menu: MenuDefinition) {
  return uniqueIngredients([
    ...menu.primaryIngredients,
    ...menu.optionalIngredients,
    ...menu.pantryIngredients,
    ...menu.hiddenIngredients
  ]);
}

function hasAllergyConflict(menu: MenuDefinition, allergySet: Set<string>) {
  const ingredientConflict = getAllMenuIngredients(menu).some((item) => allergySet.has(item));
  const substituteConflict = Object.values(menu.substitutes)
    .flat()
    .some((item) => allergySet.has(item));

  return ingredientConflict || substituteConflict;
}

function scoreMenu(
  menu: MenuDefinition,
  mealType: MealType,
  safeIngredients: string[],
  ageMonths: number,
  seenStyles: Set<string>,
  seenProteins: Set<string>
) {
  const primaryMatches = menu.primaryIngredients.filter((item) => safeIngredients.includes(item));
  const optionalMatches = menu.optionalIngredients.filter((item) => safeIngredients.includes(item));
  const pantryMatches = menu.pantryIngredients.filter((item) => safeIngredients.includes(item));
  const stylePenalty = seenStyles.has(menu.cookingStyle) ? 1.4 : 0;
  const proteinPenalty =
    menu.mainProtein !== "채소" && seenProteins.has(menu.mainProtein) ? 1.1 : 0;
  const exactMealBonus = menu.mealTypes.includes(mealType) ? 0.5 : 0;
  const ageAdjustment = getAgeStyleAdjustment(menu, ageMonths);

  return (
    primaryMatches.length * 3 +
    optionalMatches.length * 1.4 +
    pantryMatches.length +
    exactMealBonus -
    stylePenalty -
    proteinPenalty +
    ageAdjustment
  );
}

function buildFallbackRecommendation(
  mealType: MealType,
  ageMonths: number,
  safeIngredients: string[],
  excludedAllergyIngredients: string[]
) {
  const primary = safeIngredients[0] ?? "채소";
  const secondary = safeIngredients[1] ?? (mealType === "breakfast" ? "쌀" : "감자");
  const cookingStyle = getFallbackCookingStyle(mealType, ageMonths);
  const missingIngredients = getFallbackMissingIngredients(cookingStyle);
  const narrative = generateMealNarrative({
    mealType,
    ageMonths,
    menuName: `${primary} ${secondary} ${cookingStyle}`,
    cookingStyle,
    usedIngredients: safeIngredients,
    missingIngredients,
    recipeSummary: [
      `${formatIngredientList(safeIngredients) || "준비한 재료"}를 아이가 먹기 좋게 잘게 다집니다.`,
      "주재료를 충분히 익힌 뒤 필요한 곡물 또는 대체 재료를 넣고 질감을 맞춥니다.",
      "마지막에 한 번 더 으깨거나 잘게 섞어 부드럽게 마무리합니다."
    ],
    caution: "처음 먹이는 재료가 있다면 소량부터 시작해 아이 반응을 확인해 주세요."
  });
  const metrics = getMealMetricsByType(mealType);

  return {
    id: `fallback-${mealType}`,
    name: `${primary} ${secondary} ${cookingStyle}`,
    cookingStyle,
    mainProtein: "맞춤형",
    description: `${MEAL_LABELS[mealType]} 입력 재료를 바탕으로 구성한 기본 대체 메뉴`,
    textureNote: "덩어리가 남지 않도록 질감을 꼭 확인해 주세요.",
    caution: narrative.caution,
    recommendationText: narrative.recommendationText,
    recipeSummary: narrative.recipeSummary,
    missingIngredientExplanation: narrative.missingIngredientExplanation,
    usedIngredients: safeIngredients,
    missingIngredients,
    substitutes: Object.fromEntries(
      missingIngredients.map((ingredient) => [ingredient, DEFAULT_SUBSTITUTES[ingredient] ?? []])
    ),
    excludedAllergyIngredients,
    alternatives: [] as string[],
    inputIngredients: safeIngredients,
    allIngredients: safeIngredients,
    calories: metrics.calories,
    protein: metrics.protein,
    cookTimeMinutes: metrics.cookTimeMinutes,
    promptVersion: narrative.promptVersion,
    isFallback: true
  } satisfies MealRecommendation;
}

function buildRecommendation(
  menu: MenuDefinition,
  mealType: MealType,
  ageMonths: number,
  safeIngredients: string[],
  allergySet: Set<string>,
  excludedAllergyIngredients: string[]
) {
  const allIngredients = getAllMenuIngredients(menu);
  const usedIngredients = uniqueIngredients(
    allIngredients.filter((ingredient) => safeIngredients.includes(ingredient))
  );
  const missingIngredients = uniqueIngredients(
    [
      ...menu.defaultMissingIngredients.filter((item) => !safeIngredients.includes(item)),
      ...menu.primaryIngredients.filter((item) => !safeIngredients.includes(item))
    ].filter((item) => !allergySet.has(item))
  );
  const substitutes = Object.fromEntries(
    missingIngredients.map((ingredient) => [
      ingredient,
      uniqueIngredients(menu.substitutes[ingredient] ?? DEFAULT_SUBSTITUTES[ingredient] ?? []).filter(
        (item) => !allergySet.has(item)
      )
    ])
  );
  const narrative = generateMealNarrative({
    mealType,
    ageMonths,
    menuName: menu.name,
    cookingStyle: menu.cookingStyle,
    usedIngredients,
    missingIngredients,
    recipeSummary: menu.recipeSummary,
    caution: menu.caution
  });
  const guardedNarrative = guardGeneratedMealContent({
    generated: narrative,
    mealType,
    ageMonths,
    menuName: menu.name,
    cookingStyle: menu.cookingStyle,
    usedIngredients,
    missingIngredients,
    recipeSummary: menu.recipeSummary,
    caution: menu.caution,
    allergies: [...allergySet]
  });

  return {
    id: menu.id,
    name: menu.name,
    cookingStyle: menu.cookingStyle,
    mainProtein: menu.mainProtein,
    description: menu.description,
    textureNote: menu.textureNote,
    caution: guardedNarrative.caution,
    recommendationText: guardedNarrative.recommendationText,
    recipeSummary: guardedNarrative.recipeSummary,
    missingIngredientExplanation: guardedNarrative.missingIngredientExplanation,
    usedIngredients,
    missingIngredients,
    substitutes,
    excludedAllergyIngredients,
    alternatives: [] as string[],
    inputIngredients: safeIngredients,
    allIngredients,
    calories: menu.calories,
    protein: menu.protein,
    cookTimeMinutes: menu.cookTimeMinutes,
    promptVersion: guardedNarrative.promptVersion,
    isFallback: guardedNarrative.isFallback
  } satisfies MealRecommendation;
}

function getMealCandidates(
  mealType: MealType,
  ageMonths: number,
  safeIngredients: string[],
  allergySet: Set<string>,
  excludedAllergyIngredients: string[],
  menuCatalog: MenuDefinition[],
  seenStyles: Set<string>,
  seenProteins: Set<string>
) {
  return menuCatalog
    .filter((menu) => menu.mealTypes.includes(mealType))
    .filter((menu) => !hasAllergyConflict(menu, allergySet))
    .map((menu) => ({
      recommendation: buildRecommendation(
        menu,
        mealType,
        ageMonths,
        safeIngredients,
        allergySet,
        excludedAllergyIngredients
      ),
      score: scoreMenu(menu, mealType, safeIngredients, ageMonths, seenStyles, seenProteins)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.recommendation);
}

export function buildDailyMealPlanWithCandidates(
  input: BuildDailyMealPlanInput
): DailyMealPlanWithCandidates {
  const seenStyles = new Set<string>();
  const seenProteins = new Set<string>();
  const ageMonths = getAgeMonths(input.child);
  const allergies = uniqueIngredients(input.child.allergies);
  const allergySet = new Set(allergies);
  const notices: DailyMealPlan["notices"] = [];
  const results = {} as Record<MealType, MealRecommendation>;
  const candidatesByMealType = {} as Record<MealType, MealRecommendation[]>;
  const menuCatalog = input.menuCatalog ?? MENU_CATALOG;

  if (ageMonths < 10 || ageMonths > 18) {
    notices.push({
        tone: "warning",
        message: `${input.child.name} 프로필은 ${ageMonths}개월로 입력되어 있어요. 추천 식감과 조리 난이도는 실제 개월수를 기준으로 조정했어요.`
      });
    }

  MEAL_TYPES.forEach((mealType) => {
    const normalizedInputs = uniqueIngredients(input.mealInputs[mealType].map(normalizeIngredient));
    const excludedAllergyIngredients = getIngredientConflicts(normalizedInputs, allergies);
    const safeIngredients = normalizedInputs.filter(
      (ingredient) => !excludedAllergyIngredients.includes(ingredient)
    );

    if (excludedAllergyIngredients.length > 0) {
      notices.push({
        tone: "danger",
        message: `${MEAL_LABELS[mealType]} 입력에서 알레르기 재료 ${formatIngredientList(excludedAllergyIngredients)}를 제외했어요.`
      });
    }

    const candidates = getMealCandidates(
      mealType,
      ageMonths,
      safeIngredients,
      allergySet,
      excludedAllergyIngredients,
      menuCatalog,
      seenStyles,
      seenProteins
    );
    candidatesByMealType[mealType] = candidates;

    const selectedCandidate =
      candidates.find(
        (candidate) =>
          !seenStyles.has(candidate.cookingStyle) &&
          (candidate.mainProtein === "채소" || !seenProteins.has(candidate.mainProtein))
      ) ??
      candidates.find(
        (candidate) => candidate.mainProtein === "채소" || !seenProteins.has(candidate.mainProtein)
      ) ??
      buildFallbackRecommendation(mealType, ageMonths, safeIngredients, excludedAllergyIngredients);

    selectedCandidate.alternatives = candidates
      .filter((candidate) => candidate.name !== selectedCandidate.name)
      .slice(0, 2)
      .map((candidate) => candidate.name);

    results[mealType] = selectedCandidate;
    seenStyles.add(selectedCandidate.cookingStyle);

    if (selectedCandidate.mainProtein !== "채소" && selectedCandidate.mainProtein !== "맞춤형") {
      seenProteins.add(selectedCandidate.mainProtein);
    }

    if (candidates.length === 0) {
      notices.push({
        tone: "warning",
        message: `${MEAL_LABELS[mealType]}은 정확히 맞는 메뉴가 적어 기본 대체 메뉴를 추천했어요.`
      });
    }
  });

  return {
    plan: {
      id: createId("meal_plan"),
      childId: input.child.id,
      childName: input.child.name,
      createdAt: new Date().toISOString(),
      mealInputs: input.mealInputs,
      notices,
      results
    },
    candidates: candidatesByMealType
  };
}

export function buildDailyMealPlan(input: {
  child: ChildProfile;
  mealInputs: Record<MealType, string[]>;
  menuCatalog?: MenuDefinition[];
}): DailyMealPlan {
  return buildDailyMealPlanWithCandidates(input).plan;
}
