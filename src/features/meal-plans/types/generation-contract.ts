import type {
  ChildProfile,
  DailyMealPlan,
  GenerationMode,
  MealType,
  NutritionEstimate
} from "../../../types/domain";

export interface GenerateMealPlanPayload {
  child: ChildProfile;
  mealInputs: Record<MealType, string[]>;
  generationMode?: GenerationMode;
  allowAutoSupplement?: boolean;
}

export interface AiSubstituteItem {
  ingredient: string;
  substitutes: string[];
}

export interface AiMealResponse {
  selectedMenu: string;
  recommendation: string;
  missingIngredients: string[];
  missingIngredientExplanation: string;
  substitutes: AiSubstituteItem[];
  recipeSummary: string[];
  recipeFull: string[];
  textureGuide: string;
  caution: string;
  menuFamily: string | null;
  optionalAddedIngredients: string[];
}

export interface MealPlanPersistenceDraft {
  generationMode?: GenerationMode | null;
  allowAutoSupplement?: boolean | null;
  menuFamily?: string | null;
  optionalAddedIngredients?: string[];
  nutritionEstimate?: NutritionEstimate | null;
  scoringMetadata?: {
    ingredientUtilizationScore?: number | null;
    diversityScore?: number | null;
  } | null;
  inputStrength?: "none" | "low" | "medium" | "high" | null;
  recipeFull?: string[];
}

export type GenerateMealPlanResult = DailyMealPlan;
