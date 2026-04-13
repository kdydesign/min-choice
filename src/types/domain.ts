export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

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
  calories: number;
  protein: number;
  cookTimeMinutes: number;
}

export interface GeneratedMealContent {
  recommendationText: string;
  recipeSummary: string[];
  missingIngredientExplanation: string;
  caution: string;
  promptVersion: string;
  isFallback: boolean;
}

export interface MealRecommendation {
  id: string;
  name: string;
  cookingStyle: string;
  mainProtein: string;
  description: string;
  textureNote: string;
  caution: string;
  recommendationText: string;
  recipeSummary: string[];
  missingIngredientExplanation: string;
  usedIngredients: string[];
  missingIngredients: string[];
  substitutes: Record<string, string[]>;
  excludedAllergyIngredients: string[];
  alternatives: string[];
  inputIngredients: string[];
  allIngredients: string[];
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
  createdAt: string;
  mealInputs: Record<MealType, string[]>;
  notices: PlanNotice[];
  results: Record<MealType, MealRecommendation>;
}
