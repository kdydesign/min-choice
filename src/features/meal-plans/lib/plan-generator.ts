import {
  type ChildProfile,
  type DailyMealPlan,
  type GenerationMode,
  type InputStrength,
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
  MEAL_LABELS,
  MENU_CATALOG
} from "../../menus/data/menu-catalog";
import { deriveAgeMonthsFromBirthDate } from "../../children/lib/profile-date-utils";
import { guardGeneratedMealContent } from "./ai-response-guard";
import { prepareMealGenerationContext, type MealGenerationContext } from "./auto-supplement";
import { generateMealNarrative } from "./meal-narrative";
import { applyNutritionEstimateToRecommendation } from "./nutrition-estimate";

export interface DailyMealPlanWithCandidates {
  plan: DailyMealPlan;
  candidates: Record<MealType, MealRecommendation[]>;
}

const SUPPLEMENT_MATCH_WEIGHT = 0.45;
const SUPPLEMENT_MISSING_WEIGHT = 0.6;
const SOFT_MENU_FAMILIES = new Set(["porridge", "mash", "risotto"]);

interface BuildDailyMealPlanInput {
  child: ChildProfile;
  mealInputs: Record<MealType, string[]>;
  generationMode?: GenerationMode;
  allowAutoSupplement?: boolean;
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
  if (ageMonths >= 12 && ageMonths < 16) {
    if (["무른밥", "덮밥", "볶음밥", "찜", "스튜"].includes(menu.cookingStyle)) {
      return 0.45;
    }

    if (menu.cookingStyle === "죽") {
      return -0.45;
    }

    if (menu.cookingStyle === "매시") {
      return -0.7;
    }
  }

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

function deriveGenerationMode(
  mealInputs: Record<MealType, string[]>,
  requestedMode?: GenerationMode
): GenerationMode {
  if (requestedMode) {
    return requestedMode;
  }

  const hasAnyIngredients = MEAL_TYPES.some((mealType) => mealInputs[mealType].length > 0);
  return hasAnyIngredients ? "ingredient_first" : "auto_recommend";
}

function toRoundedScore(value: number) {
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

function buildScoringMetadata(
  usedInputIngredients: string[],
  inputIngredients: string[],
  isFallback: boolean,
  scoreBreakdown?: Partial<CandidateScoreBreakdown>
) {
  const ingredientUtilizationScore =
    inputIngredients.length > 0 ? usedInputIngredients.length / inputIngredients.length : 0;

  return {
    ingredientUtilizationScore: toRoundedScore(
      scoreBreakdown?.ingredientUtilizationScore ?? ingredientUtilizationScore
    ),
    ingredientCoverageScore: toRoundedScore(scoreBreakdown?.ingredientCoverageScore ?? 0),
    lowMissingIngredientScore: toRoundedScore(scoreBreakdown?.lowMissingIngredientScore ?? 0),
    diversityScore: toRoundedScore(scoreBreakdown?.diversityScore ?? (isFallback ? 0.35 : 0.7))
  };
}

function hasAllergyConflict(menu: MenuDefinition, allergySet: Set<string>) {
  const ingredientConflict = getAllMenuIngredients(menu).some((item) => allergySet.has(item));
  const substituteConflict = Object.values(menu.substitutes)
    .flat()
    .some((item) => allergySet.has(item));

  return ingredientConflict || substituteConflict;
}

interface CandidateScoreBreakdown {
  total: number;
  ingredientUtilizationScore: number;
  ingredientCoverageScore: number;
  lowMissingIngredientScore: number;
  diversityScore: number;
}

function getMenuAgeRange(menu: MenuDefinition) {
  return {
    minAgeMonths: menu.minAgeMonths ?? 10,
    maxAgeMonths: menu.maxAgeMonths ?? 36
  };
}

function getAgeRangeScore(menu: MenuDefinition, ageMonths: number) {
  const { minAgeMonths, maxAgeMonths } = getMenuAgeRange(menu);

  if (ageMonths < minAgeMonths) {
    return Math.max(-2.2, (ageMonths - minAgeMonths) * 0.25);
  }

  if (ageMonths > maxAgeMonths) {
    return Math.max(-2.2, (maxAgeMonths - ageMonths) * 0.18);
  }

  return 1.1;
}

function getIngredientMatchWeight(
  ingredient: string,
  inputIngredients: string[],
  optionalAddedIngredients: string[]
) {
  if (inputIngredients.includes(ingredient)) {
    return 1;
  }

  if (optionalAddedIngredients.includes(ingredient)) {
    return SUPPLEMENT_MATCH_WEIGHT;
  }

  return 0;
}

function getIngredientUtilizationScore(menu: MenuDefinition, inputIngredients: string[]) {
  if (inputIngredients.length === 0) {
    return 0;
  }

  const menuIngredients = new Set(getAllMenuIngredients(menu));
  const usedInputCount = inputIngredients.filter((item) => menuIngredients.has(item)).length;
  return toRoundedScore(usedInputCount / inputIngredients.length);
}

function getWeightedIngredientCoverageScore(menu: MenuDefinition, mealContext: MealGenerationContext) {
  const targetIngredients = uniqueIngredients([
    ...menu.primaryIngredients,
    ...menu.optionalIngredients
  ]);

  if (targetIngredients.length === 0) {
    return 0;
  }

  const weightedMatchCount = targetIngredients.reduce(
    (sum, ingredient) =>
      sum +
      getIngredientMatchWeight(
        ingredient,
        mealContext.inputIngredients,
        mealContext.optionalAddedIngredients
      ),
    0
  );

  return toRoundedScore(weightedMatchCount / targetIngredients.length);
}

function getLowMissingIngredientScore(menu: MenuDefinition, mealContext: MealGenerationContext) {
  const baseMissingIngredients = uniqueIngredients([
    ...menu.primaryIngredients,
    ...menu.defaultMissingIngredients
  ]);
  const effectiveMissingCount = baseMissingIngredients.reduce((sum, ingredient) => {
    if (mealContext.inputIngredients.includes(ingredient)) {
      return sum;
    }

    if (mealContext.optionalAddedIngredients.includes(ingredient)) {
      return sum + SUPPLEMENT_MISSING_WEIGHT;
    }

    return sum + 1;
  }, 0);

  return toRoundedScore(1 / (1 + effectiveMissingCount));
}

function getDiversityScore(
  menu: MenuDefinition,
  seenFamilies: Set<string>,
  seenProteins: Set<string>
) {
  const family = menu.menuFamily ?? menu.cookingStyle;
  let score = 1;

  if (seenFamilies.has(family)) {
    score -= 0.6;
  }

  if (menu.mainProtein !== "채소" && seenProteins.has(menu.mainProtein)) {
    score -= 0.45;
  }

  return toRoundedScore(score);
}

function getSoftStyleVarietyAdjustment(
  menu: MenuDefinition,
  mealType: MealType,
  ageMonths: number,
  seenFamilies: Set<string>
) {
  if (ageMonths < 12 || mealType === "breakfast" || seenFamilies.size === 0) {
    return 0;
  }

  const family = menu.menuFamily ?? menu.cookingStyle;
  const hasSeenSoftFamily = [...seenFamilies].some((seenFamily) => SOFT_MENU_FAMILIES.has(seenFamily));

  if (!hasSeenSoftFamily) {
    return 0;
  }

  if (SOFT_MENU_FAMILIES.has(family)) {
    return ageMonths >= 16 ? -0.45 : -0.3;
  }

  return 0.15;
}

function scoreMenu(
  menu: MenuDefinition,
  mealType: MealType,
  mealContext: MealGenerationContext,
  ageMonths: number,
  seenFamilies: Set<string>,
  seenProteins: Set<string>
): CandidateScoreBreakdown {
  const ingredientUtilizationScore = getIngredientUtilizationScore(menu, mealContext.inputIngredients);
  const ingredientCoverageScore = getWeightedIngredientCoverageScore(menu, mealContext);
  const lowMissingIngredientScore = getLowMissingIngredientScore(menu, mealContext);
  const diversityScore = getDiversityScore(menu, seenFamilies, seenProteins);
  const exactMealBonus = menu.mealTypes.includes(mealType) ? 0.5 : 0;
  const ageAdjustment = getAgeStyleAdjustment(menu, ageMonths);
  const ageRangeScore = getAgeRangeScore(menu, ageMonths);
  const softStyleVarietyAdjustment = getSoftStyleVarietyAdjustment(
    menu,
    mealType,
    ageMonths,
    seenFamilies
  );

  const total =
    ingredientUtilizationScore * 4.4 +
    ingredientCoverageScore * 3.8 +
    lowMissingIngredientScore * 2.6 +
    diversityScore * 2 +
    exactMealBonus +
    ageAdjustment +
    ageRangeScore +
    softStyleVarietyAdjustment;

  return {
    total,
    ingredientUtilizationScore,
    ingredientCoverageScore,
    lowMissingIngredientScore,
    diversityScore
  };
}

function buildFallbackRecommendation(
  mealType: MealType,
  ageMonths: number,
  mealContext: MealGenerationContext
) {
  const primary = mealContext.availableIngredients[0] ?? "채소";
  const secondary =
    mealContext.availableIngredients[1] ?? (mealType === "breakfast" ? "쌀" : "감자");
  const cookingStyle = getFallbackCookingStyle(mealType, ageMonths);
  const missingIngredients = getFallbackMissingIngredients(cookingStyle).filter(
    (ingredient) => !mealContext.availableIngredients.includes(ingredient)
  );
  const narrative = generateMealNarrative({
    mealType,
    ageMonths,
    menuName: `${primary} ${secondary} ${cookingStyle}`,
    cookingStyle,
    usedIngredients: mealContext.availableIngredients,
    missingIngredients,
    recipeSummary: [
      `${formatIngredientList(mealContext.availableIngredients) || "준비한 재료"}를 아이가 먹기 좋게 잘게 다집니다.`,
      "주재료를 충분히 익힌 뒤 필요한 곡물 또는 대체 재료를 넣고 질감을 맞춥니다.",
      "마지막에 한 번 더 으깨거나 잘게 섞어 부드럽게 마무리합니다."
    ],
    caution: "처음 먹이는 재료가 있다면 소량부터 시작해 아이 반응을 확인해 주세요."
  });
  const nutrition = applyNutritionEstimateToRecommendation({
    mealType,
    ageMonths,
    menuFamily: cookingStyle,
    usedIngredients: mealContext.availableIngredients,
    missingIngredients,
    optionalAddedIngredients: mealContext.optionalAddedIngredients
  });
  return {
    id: `fallback-${mealType}`,
    name: `${primary} ${secondary} ${cookingStyle}`,
    menuFamily: cookingStyle,
    cookingStyle,
    mainProtein: "맞춤형",
    description: `${MEAL_LABELS[mealType]} 입력 재료를 바탕으로 구성한 기본 대체 메뉴`,
    textureNote: "덩어리가 남지 않도록 질감을 꼭 확인해 주세요.",
    caution: narrative.caution,
    recommendationText: narrative.recommendationText,
    recipeSummary: narrative.recipeSummary,
    recipeFull: narrative.recipeFull,
    missingIngredientExplanation: narrative.missingIngredientExplanation,
    usedIngredients: mealContext.availableIngredients,
    missingIngredients,
    optionalAddedIngredients: mealContext.optionalAddedIngredients,
    substitutes: Object.fromEntries(
      missingIngredients.map((ingredient) => [ingredient, DEFAULT_SUBSTITUTES[ingredient] ?? []])
    ),
    excludedAllergyIngredients: mealContext.excludedAllergyIngredients,
    alternatives: [] as string[],
    inputIngredients: mealContext.inputIngredients,
    allIngredients: mealContext.availableIngredients,
    scoringMetadata: buildScoringMetadata(
      mealContext.inputIngredients,
      mealContext.inputIngredients,
      true
    ),
    inputStrength: mealContext.inputStrength,
    ...nutrition,
    promptVersion: narrative.promptVersion,
    isFallback: true
  } satisfies MealRecommendation;
}

function buildRecommendation(
  menu: MenuDefinition,
  mealType: MealType,
  ageMonths: number,
  mealContext: MealGenerationContext,
  allergySet: Set<string>,
  scoreBreakdown?: Partial<CandidateScoreBreakdown>
) {
  const allIngredients = getAllMenuIngredients(menu);
  const usedIngredients = uniqueIngredients(
    allIngredients.filter((ingredient) => mealContext.availableIngredients.includes(ingredient))
  );
  const usedInputIngredients = uniqueIngredients(
    allIngredients.filter((ingredient) => mealContext.inputIngredients.includes(ingredient))
  );
  const missingIngredients = uniqueIngredients(
    [
      ...menu.defaultMissingIngredients.filter((item) => !mealContext.availableIngredients.includes(item)),
      ...menu.primaryIngredients.filter((item) => !mealContext.availableIngredients.includes(item))
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
  const optionalAddedIngredients = mealContext.optionalAddedIngredients.filter(
    (ingredient) => usedIngredients.includes(ingredient) && !missingIngredients.includes(ingredient)
  );
  const nutrition = applyNutritionEstimateToRecommendation({
    mealType,
    ageMonths,
    menuFamily: menu.menuFamily ?? menu.cookingStyle,
    menu,
    usedIngredients,
    missingIngredients,
    optionalAddedIngredients
  });

  return {
    id: menu.id,
    name: menu.name,
    menuFamily: menu.menuFamily ?? menu.cookingStyle,
    cookingStyle: menu.cookingStyle,
    mainProtein: menu.mainProtein,
    description: menu.description,
    textureNote: menu.textureNote,
    caution: guardedNarrative.caution,
    recommendationText: guardedNarrative.recommendationText,
    recipeSummary: guardedNarrative.recipeSummary,
    recipeFull:
      guardedNarrative.recipeFull.length > 0
        ? guardedNarrative.recipeFull
        : menu.recipeFull?.slice(0, 8) ?? menu.recipeSummary,
    missingIngredientExplanation: guardedNarrative.missingIngredientExplanation,
    usedIngredients,
    missingIngredients,
    optionalAddedIngredients,
    substitutes,
    excludedAllergyIngredients: mealContext.excludedAllergyIngredients,
    alternatives: [] as string[],
    inputIngredients: mealContext.inputIngredients,
    allIngredients,
    scoringMetadata: buildScoringMetadata(
      usedInputIngredients,
      mealContext.inputIngredients,
      false,
      scoreBreakdown
    ),
    inputStrength: mealContext.inputStrength,
    ...nutrition,
    promptVersion: guardedNarrative.promptVersion,
    isFallback: guardedNarrative.isFallback
  } satisfies MealRecommendation;
}

function getMealCandidates(
  mealType: MealType,
  ageMonths: number,
  mealContext: MealGenerationContext,
  allergySet: Set<string>,
  menuCatalog: MenuDefinition[],
  seenFamilies: Set<string>,
  seenProteins: Set<string>
) {
  return menuCatalog
    .filter((menu) => menu.mealTypes.includes(mealType))
    .filter((menu) => !hasAllergyConflict(menu, allergySet))
    .map((menu) => {
      const scoreBreakdown = scoreMenu(
        menu,
        mealType,
        mealContext,
        ageMonths,
        seenFamilies,
        seenProteins
      );

      return {
        recommendation: buildRecommendation(
          menu,
          mealType,
          ageMonths,
          mealContext,
          allergySet,
          scoreBreakdown
        ),
        score: scoreBreakdown.total
      };
    })
    .filter((candidate) => candidate.score > 0.25)
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.recommendation);
}

export function buildDailyMealPlanWithCandidates(
  input: BuildDailyMealPlanInput
): DailyMealPlanWithCandidates {
  const seenFamilies = new Set<string>();
  const seenProteins = new Set<string>();
  const ageMonths = getAgeMonths(input.child);
  const allergies = uniqueIngredients(input.child.allergies);
  const allergySet = new Set(allergies);
  const notices: DailyMealPlan["notices"] = [];
  const results = {} as Record<MealType, MealRecommendation>;
  const candidatesByMealType = {} as Record<MealType, MealRecommendation[]>;
  const menuCatalog = input.menuCatalog ?? MENU_CATALOG;
  const generationMode = deriveGenerationMode(input.mealInputs, input.generationMode);
  const allowAutoSupplement = input.allowAutoSupplement ?? true;

  if (ageMonths < 10 || ageMonths > 18) {
    notices.push({
        tone: "warning",
        message: `${input.child.name} 프로필은 ${ageMonths}개월로 입력되어 있어요. 추천 식감과 조리 난이도는 실제 개월수를 기준으로 조정했어요.`
      });
    }

  MEAL_TYPES.forEach((mealType) => {
    const normalizedInputs = uniqueIngredients(input.mealInputs[mealType].map(normalizeIngredient));
    const mealContext = prepareMealGenerationContext({
      mealType,
      ageMonths,
      inputIngredients: normalizedInputs,
      allergies,
      allowAutoSupplement
    });

    if (mealContext.excludedAllergyIngredients.length > 0) {
      notices.push({
        tone: "danger",
        message: `${MEAL_LABELS[mealType]} 입력에서 알레르기 재료 ${formatIngredientList(mealContext.excludedAllergyIngredients)}를 제외했어요.`
      });
    }

    if (mealContext.excludedSupplementIngredients.length > 0) {
      notices.push({
        tone: "warning",
        message: `${MEAL_LABELS[mealType]} 자동 보완 후보에서 알레르기 재료 ${formatIngredientList(mealContext.excludedSupplementIngredients)}를 제외했어요.`
      });
    }

    if (mealContext.inputIngredients.length === 0 && mealContext.optionalAddedIngredients.length > 0) {
      notices.push({
        tone: "warning",
        message: `${MEAL_LABELS[mealType]} 입력이 없어 ${formatIngredientList(mealContext.optionalAddedIngredients)}를 바탕으로 자동 추천했어요.`
      });
    } else if (mealContext.optionalAddedIngredients.length > 0) {
      notices.push({
        tone: "warning",
        message: `${MEAL_LABELS[mealType]} 입력이 적어 ${formatIngredientList(mealContext.optionalAddedIngredients)}를 함께 고려했어요.`
      });
    }

    const candidates = getMealCandidates(
      mealType,
      ageMonths,
      mealContext,
      allergySet,
      menuCatalog,
      seenFamilies,
      seenProteins
    );
    candidatesByMealType[mealType] = candidates;

    const selectedCandidate =
      candidates[0] ??
      buildFallbackRecommendation(mealType, ageMonths, mealContext);

    selectedCandidate.alternatives = candidates
      .filter((candidate) => candidate.name !== selectedCandidate.name)
      .slice(0, 2)
      .map((candidate) => candidate.name);

    results[mealType] = selectedCandidate;
    seenFamilies.add(selectedCandidate.menuFamily ?? selectedCandidate.cookingStyle);

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
      generationMode,
      allowAutoSupplement,
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
  generationMode?: GenerationMode;
  allowAutoSupplement?: boolean;
  menuCatalog?: MenuDefinition[];
}): DailyMealPlan {
  return buildDailyMealPlanWithCandidates(input).plan;
}
