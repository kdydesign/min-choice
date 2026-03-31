import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { normalizeIngredient, uniqueIngredients } from "../../../src/features/ingredients/lib/ingredient-utils.ts";
import { loadIngredientCatalog } from "../_shared/catalog-repository.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const payload = (await request.json()) as { ingredients?: string[] };
  const ingredientCatalog = await loadIngredientCatalog();
  const aliasMap = new Map<string, { standardKey: string; displayName: string }>();

  ingredientCatalog.forEach((item) => {
    aliasMap.set(normalizeIngredient(item.standardKey), {
      standardKey: item.standardKey,
      displayName: item.displayName
    });
    aliasMap.set(normalizeIngredient(item.displayName), {
      standardKey: item.standardKey,
      displayName: item.displayName
    });

    item.aliases.forEach((alias) => {
      aliasMap.set(normalizeIngredient(alias), {
        standardKey: item.standardKey,
        displayName: item.displayName
      });
    });
  });

  const items = uniqueIngredients(payload.ingredients ?? []).map((ingredient) => {
    const normalizedInput = normalizeIngredient(ingredient);
    const matchedIngredient = aliasMap.get(normalizedInput);

    return {
      input: ingredient,
      standardKey: matchedIngredient?.standardKey ?? normalizedInput,
      displayName: matchedIngredient?.displayName ?? normalizedInput,
      isKnown: Boolean(matchedIngredient)
    };
  });

  return jsonResponse({ items });
});
