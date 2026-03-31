import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeIngredient, uniqueIngredients } from "../../../src/features/ingredients/lib/ingredient-utils.ts";
import {
  DEFAULT_SUBSTITUTES,
  MENU_CATALOG
} from "../../../src/features/menus/data/menu-catalog.ts";
import type { MealType, MenuDefinition } from "../../../src/types/domain.ts";

interface MenuRow {
  source_key: string | null;
  name: string | null;
  meal_types_json: unknown;
  required_ingredient_keys_json: unknown;
  optional_ingredient_keys_json: unknown;
  pantry_ingredient_keys_json: unknown;
  hidden_ingredient_keys_json: unknown;
  default_missing_ingredient_keys_json: unknown;
  substitute_map_json: unknown;
  cooking_style: string | null;
  main_protein_key: string | null;
  description: string | null;
  texture_note: string | null;
  caution_template: string | null;
  recipe_template_json: unknown;
}

interface IngredientRow {
  standard_key: string | null;
  display_name: string | null;
  aliases_json: unknown;
  is_allergen: boolean | null;
}

export interface IngredientCatalogItem {
  standardKey: string;
  displayName: string;
  aliases: string[];
  isAllergen: boolean;
}

const STATIC_INGREDIENT_ALIASES: Record<string, string> = {
  쇠고기: "소고기",
  닭가슴살: "닭고기",
  닭: "닭고기",
  계란: "달걀",
  호박: "애호박",
  쥬키니: "애호박",
  브로콜리꽃: "브로콜리",
  흰쌀: "쌀",
  이유식용쌀: "쌀",
  죽: "죽밥"
};

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parseMealTypes(value: unknown) {
  return parseStringArray(value).filter((item): item is MealType =>
    ["breakfast", "lunch", "dinner"].includes(item)
  );
}

function parseSubstituteMap(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {} as Record<string, string[]>;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, items]) => [normalizeIngredient(key), uniqueIngredients(parseStringArray(items))])
  );
}

function createServiceRoleClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function createFallbackIngredientCatalog() {
  const standardKeys = uniqueIngredients([
    ...MENU_CATALOG.flatMap((menu) => [
      ...menu.primaryIngredients,
      ...menu.optionalIngredients,
      ...menu.pantryIngredients,
      ...menu.hiddenIngredients,
      ...menu.defaultMissingIngredients,
      ...Object.keys(menu.substitutes),
      ...Object.values(menu.substitutes).flat()
    ]),
    ...Object.keys(DEFAULT_SUBSTITUTES),
    ...Object.values(DEFAULT_SUBSTITUTES).flat(),
    ...Object.keys(STATIC_INGREDIENT_ALIASES),
    ...Object.values(STATIC_INGREDIENT_ALIASES)
  ]);
  const aliasEntries = Object.entries(STATIC_INGREDIENT_ALIASES);

  return standardKeys.map((standardKey) => ({
    standardKey,
    displayName: standardKey,
    aliases: aliasEntries
      .filter(([, mappedKey]) => mappedKey === standardKey)
      .map(([alias]) => alias),
    isAllergen: ["두부", "달걀", "우유", "흰살생선"].includes(standardKey)
  }));
}

function mapMenuRow(row: MenuRow): MenuDefinition | null {
  const sourceKey = row.source_key?.trim();
  const name = row.name?.trim();

  if (!sourceKey || !name) {
    return null;
  }

  return {
    id: sourceKey,
    name,
    mealTypes: parseMealTypes(row.meal_types_json),
    primaryIngredients: uniqueIngredients(parseStringArray(row.required_ingredient_keys_json)),
    optionalIngredients: uniqueIngredients(parseStringArray(row.optional_ingredient_keys_json)),
    pantryIngredients: uniqueIngredients(parseStringArray(row.pantry_ingredient_keys_json)),
    hiddenIngredients: uniqueIngredients(parseStringArray(row.hidden_ingredient_keys_json)),
    defaultMissingIngredients: uniqueIngredients(
      parseStringArray(row.default_missing_ingredient_keys_json)
    ),
    substitutes: parseSubstituteMap(row.substitute_map_json),
    cookingStyle: row.cooking_style?.trim() || "추천",
    mainProtein: row.main_protein_key?.trim() || "맞춤형",
    description: row.description?.trim() || `${name} 추천 메뉴`,
    textureNote: row.texture_note?.trim() || "아이가 먹기 좋은 질감으로 조절해 주세요.",
    caution: row.caution_template?.trim() || "",
    recipeSummary: parseStringArray(row.recipe_template_json).slice(0, 3)
  };
}

export async function loadMenuCatalog() {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return MENU_CATALOG;
  }

  try {
    const { data, error } = await supabase
      .from("menus")
      .select(
        [
          "source_key",
          "name",
          "meal_types_json",
          "required_ingredient_keys_json",
          "optional_ingredient_keys_json",
          "pantry_ingredient_keys_json",
          "hidden_ingredient_keys_json",
          "default_missing_ingredient_keys_json",
          "substitute_map_json",
          "cooking_style",
          "main_protein_key",
          "description",
          "texture_note",
          "caution_template",
          "recipe_template_json"
        ].join(", ")
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    const mappedMenus = (data ?? [])
      .map((row) => mapMenuRow(row as MenuRow))
      .filter((menu): menu is MenuDefinition => Boolean(menu));

    return mappedMenus.length > 0 ? mappedMenus : MENU_CATALOG;
  } catch (error) {
    console.warn("Falling back to static menu catalog", error);
    return MENU_CATALOG;
  }
}

export async function loadIngredientCatalog() {
  const supabase = createServiceRoleClient();
  const fallbackCatalog = createFallbackIngredientCatalog();

  if (!supabase) {
    return fallbackCatalog;
  }

  try {
    const { data, error } = await supabase
      .from("ingredients")
      .select("standard_key, display_name, aliases_json, is_allergen")
      .order("display_name", { ascending: true });

    if (error) {
      throw error;
    }

    const items = (data ?? [])
      .map((row) => {
        const typedRow = row as IngredientRow;
        const standardKey = typedRow.standard_key?.trim();

        if (!standardKey) {
          return null;
        }

        return {
          standardKey,
          displayName: typedRow.display_name?.trim() || standardKey,
          aliases: uniqueIngredients(parseStringArray(typedRow.aliases_json)),
          isAllergen: Boolean(typedRow.is_allergen)
        } satisfies IngredientCatalogItem;
      })
      .filter((item): item is IngredientCatalogItem => Boolean(item));

    return items.length > 0 ? items : fallbackCatalog;
  } catch (error) {
    console.warn("Falling back to static ingredient catalog", error);
    return fallbackCatalog;
  }
}
