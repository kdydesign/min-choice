import type { NormalizedIngredientItem } from "../../../types/domain";
import { getSupabaseClient } from "../../../lib/supabase";
import { MENU_CATALOG } from "../../menus/data/menu-catalog";
import { normalizeIngredient, uniqueIngredients } from "../lib/ingredient-utils";

function buildKnownIngredientSet() {
  return new Set(
    MENU_CATALOG.flatMap((menu) => [
      ...menu.primaryIngredients,
      ...menu.optionalIngredients,
      ...menu.pantryIngredients,
      ...menu.hiddenIngredients,
      ...Object.values(menu.substitutes).flat()
    ])
  );
}

const knownIngredientSet = buildKnownIngredientSet();

function normalizeIngredientsLocally(ingredients: string[]): NormalizedIngredientItem[] {
  return uniqueIngredients(ingredients).map((ingredient) => {
    const standardKey = normalizeIngredient(ingredient);

    return {
      input: ingredient,
      standardKey,
      displayName: standardKey,
      isKnown: knownIngredientSet.has(standardKey)
    };
  });
}

export async function normalizeIngredients(ingredients: string[]) {
  const uniqueInput = uniqueIngredients(ingredients);
  const supabase = getSupabaseClient();

  if (!supabase) {
    return normalizeIngredientsLocally(uniqueInput);
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      items: NormalizedIngredientItem[];
    }>("normalize-ingredients", {
      body: {
        ingredients: uniqueInput
      }
    });

    if (error) {
      throw error;
    }

    if (!data?.items) {
      throw new Error("normalize-ingredients returned an invalid payload");
    }

    return data.items;
  } catch (error) {
    console.warn("Falling back to local ingredient normalization", error);
    return normalizeIngredientsLocally(uniqueInput);
  }
}
