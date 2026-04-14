export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const GENERATION_MODES = ["ingredient_first", "auto_recommend"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const INPUT_STRENGTH_LEVELS = ["none", "low", "medium", "high"] as const;
export type InputStrength = (typeof INPUT_STRENGTH_LEVELS)[number];

export const NUTRITION_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type NutritionConfidence = (typeof NUTRITION_CONFIDENCE_LEVELS)[number];

export type NoticeTone = "warning" | "danger" | "success";

export interface PlanNotice {
  tone: NoticeTone;
  message: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  ageMonths: number;
  birthDate: string;
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MealDraft {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  updatedAt: string | null;
}

export interface NormalizedIngredientItem {
  input: string;
  standardKey: string;
  displayName: string;
  isKnown: boolean;
}

export interface MenuDefinition {
  id: string;
  name: string;
  menuFamily?: string | null;
  minAgeMonths?: number | null;
  maxAgeMonths?: number | null;
  mealTypes: MealType[];
  primaryIngredients: string[];
  optionalIngredients: string[];
  pantryIngredients: string[];
  hiddenIngredients: string[];
  defaultMissingIngredients: string[];
  substitutes: Record<string, string[]>;
  cookingStyle: string;
  mainProtein: string;
  description: string;
  textureNote: string;
  caution: string;
  recipeSummary: string[];
  recipeFull?: string[];
  calories: number;
  protein: number;
  cookTimeMinutes: number;
}

export interface NutritionEstimate {
  caloriesKcal: number;
  proteinG: number;
  estimatedCookTimeMin: number;
  confidence: NutritionConfidence;
  basisNote: string;
}

export interface ScoringMetadata {
  ingredientUtilizationScore: number;
  ingredientCoverageScore: number;
  lowMissingIngredientScore: number;
  diversityScore: number;
}

export interface GeneratedMealContent {
  recommendationText: string;
  recipeSummary: string[];
  recipeFull: string[];
  missingIngredientExplanation: string;
  caution: string;
  promptVersion: string;
  isFallback: boolean;
}

export interface MealRecommendation {
  id: string;
  name: string;
  menuFamily: string | null;
  cookingStyle: string;
  mainProtein: string;
  description: string;
  textureNote: string;
  caution: string;
  recommendationText: string;
  recipeSummary: string[];
  recipeFull: string[];
  missingIngredientExplanation: string;
  usedIngredients: string[];
  missingIngredients: string[];
  optionalAddedIngredients: string[];
  substitutes: Record<string, string[]>;
  excludedAllergyIngredients: string[];
  alternatives: string[];
  inputIngredients: string[];
  allIngredients: string[];
  nutritionEstimate: NutritionEstimate;
  scoringMetadata: ScoringMetadata;
  inputStrength: InputStrength;
  calories: number;
  protein: number;
  cookTimeMinutes: number;
  promptVersion: string;
  isFallback: boolean;
}

export interface DailyMealPlan {
  id: string;
  childId: string;
  childName: string;
  generationMode: GenerationMode;
  allowAutoSupplement: boolean;
  createdAt: string;
  mealInputs: Record<MealType, string[]>;
  notices: PlanNotice[];
  results: Record<MealType, MealRecommendation>;
}
