import type { InputStrength, MealType } from "../../../types/domain";
import {
  getIngredientConflicts,
  normalizeIngredient,
  uniqueIngredients
} from "../../ingredients/lib/ingredient-utils";

interface PrepareMealGenerationContextInput {
  mealType: MealType;
  ageMonths: number;
  inputIngredients: string[];
  allergies: string[];
  allowAutoSupplement: boolean;
}

export interface MealGenerationContext {
  inputIngredients: string[];
  availableIngredients: string[];
  optionalAddedIngredients: string[];
  excludedAllergyIngredients: string[];
  excludedSupplementIngredients: string[];
  inputStrength: InputStrength;
}

type AgeBand = "infant" | "toddler" | "older";

const PROTEIN_INGREDIENTS = new Set(["소고기", "닭고기", "두부", "흰살생선"]);
const CARB_INGREDIENTS = new Set(["쌀", "밥", "죽밥", "오트밀", "감자", "고구마", "단호박"]);
const VEGETABLE_INGREDIENTS = new Set([
  "양파",
  "당근",
  "애호박",
  "브로콜리",
  "양배추",
  "시금치",
  "감자",
  "고구마",
  "단호박"
]);

const SUPPLEMENT_RULES: Record<MealType, Record<AgeBand, string[]>> = {
  breakfast: {
    infant: ["쌀", "오트밀", "감자", "고구마", "두부"],
    toddler: ["밥", "오트밀", "감자", "두부", "당근"],
    older: ["밥", "오트밀", "감자", "두부", "양파"]
  },
  lunch: {
    infant: ["쌀", "감자", "당근", "두부", "애호박"],
    toddler: ["밥", "당근", "감자", "두부", "양파", "애호박"],
    older: ["밥", "양파", "당근", "감자", "두부", "브로콜리"]
  },
  dinner: {
    infant: ["쌀", "감자", "두부", "당근", "애호박"],
    toddler: ["밥", "당근", "감자", "두부", "양배추", "애호박"],
    older: ["밥", "양파", "당근", "감자", "두부", "양배추"]
  }
};

function deriveInputStrength(ingredients: string[]): InputStrength {
  if (ingredients.length === 0) {
    return "none";
  }

  if (ingredients.length === 1) {
    return "low";
  }

  if (ingredients.length <= 3) {
    return "medium";
  }

  return "high";
}

function getAgeBand(ageMonths: number): AgeBand {
  if (ageMonths <= 11) {
    return "infant";
  }

  if (ageMonths <= 23) {
    return "toddler";
  }

  return "older";
}

function getSupplementLimit(inputCount: number) {
  if (inputCount === 0) {
    return 3;
  }

  if (inputCount === 1) {
    return 3;
  }

  if (inputCount === 2) {
    return 2;
  }

  return 0;
}

function getTargetedSupplements(
  mealType: MealType,
  ageMonths: number,
  inputIngredients: string[]
) {
  const hasProtein = inputIngredients.some((ingredient) => PROTEIN_INGREDIENTS.has(ingredient));
  const hasCarb = inputIngredients.some((ingredient) => CARB_INGREDIENTS.has(ingredient));
  const hasVegetable = inputIngredients.some((ingredient) => VEGETABLE_INGREDIENTS.has(ingredient));
  const suggestions: string[] = [];

  if (inputIngredients.length === 0) {
    return SUPPLEMENT_RULES[mealType][getAgeBand(ageMonths)];
  }

  if (!hasCarb) {
    suggestions.push(mealType === "breakfast" ? "오트밀" : "밥");
  }

  if (!hasProtein) {
    suggestions.push("두부");
  }

  if (!hasVegetable) {
    suggestions.push(ageMonths <= 11 ? "애호박" : "당근");
  }

  if (inputIngredients.length === 1 && hasProtein) {
    suggestions.push(mealType === "breakfast" ? "감자" : "양파");
  }

  if (inputIngredients.length === 1 && hasVegetable) {
    suggestions.push(mealType === "breakfast" ? "오트밀" : "밥");
  }

  if (inputIngredients.length === 2 && mealType !== "breakfast" && !inputIngredients.includes("양파")) {
    suggestions.push("양파");
  }

  return uniqueIngredients(suggestions);
}

export function prepareMealGenerationContext(
  input: PrepareMealGenerationContextInput
): MealGenerationContext {
  const normalizedInputIngredients = uniqueIngredients(input.inputIngredients);
  const excludedAllergyIngredients = getIngredientConflicts(normalizedInputIngredients, input.allergies);
  const safeInputIngredients = normalizedInputIngredients.filter(
    (ingredient) => !excludedAllergyIngredients.includes(ingredient)
  );
  const inputStrength = deriveInputStrength(safeInputIngredients);
  const supplementLimit = input.allowAutoSupplement ? getSupplementLimit(safeInputIngredients.length) : 0;

  if (supplementLimit === 0) {
    return {
      inputIngredients: safeInputIngredients,
      availableIngredients: safeInputIngredients,
      optionalAddedIngredients: [],
      excludedAllergyIngredients,
      excludedSupplementIngredients: [],
      inputStrength
    };
  }

  const ageBand = getAgeBand(input.ageMonths);
  const prioritizedSupplements = uniqueIngredients([
    ...SUPPLEMENT_RULES[input.mealType][ageBand],
    ...getTargetedSupplements(input.mealType, input.ageMonths, safeInputIngredients)
  ]);
  const excludedSupplementIngredients = uniqueIngredients(
    prioritizedSupplements.filter((ingredient) =>
      getIngredientConflicts([ingredient], input.allergies).includes(ingredient)
    )
  );
  const optionalAddedIngredients = prioritizedSupplements
    .map(normalizeIngredient)
    .filter(
      (ingredient) =>
        !safeInputIngredients.includes(ingredient) &&
        !excludedSupplementIngredients.includes(ingredient)
    )
    .slice(0, supplementLimit);

  return {
    inputIngredients: safeInputIngredients,
    availableIngredients: uniqueIngredients([...safeInputIngredients, ...optionalAddedIngredients]),
    optionalAddedIngredients,
    excludedAllergyIngredients,
    excludedSupplementIngredients,
    inputStrength
  };
}
