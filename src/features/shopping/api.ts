import { getSupabaseClient } from "../../lib/supabase";
import {
  ensureSupabasePersistenceReady,
  getSupabaseCurrentUserId
} from "../auth/api/supabase-bootstrap-service";
import { normalizeProductSearchRequest, parseProductSearchResponse } from "./schema";
import type {
  ProductClickLogInput,
  ProductSearchRequest,
  ProductSearchResponse
} from "./types";

export async function searchProducts(input: ProductSearchRequest): Promise<ProductSearchResponse> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase 연결이 없어 상품 검색을 실행할 수 없어요.");
  }

  await ensureSupabasePersistenceReady();

  const request = normalizeProductSearchRequest(input);

  if (!request.query.trim()) {
    throw new Error("검색어를 입력해 주세요.");
  }

  const { data, error } = await supabase.functions.invoke<unknown>("search-products", {
    body: request
  });

  if (error) {
    throw new Error(error.message || "상품 검색을 완료하지 못했어요.");
  }

  if (typeof data === "object" && data !== null && "error" in data) {
    const message = typeof data.error === "string" ? data.error : "상품 검색을 완료하지 못했어요.";
    throw new Error(message);
  }

  return parseProductSearchResponse(data);
}

export async function logProductClick(input: ProductClickLogInput) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  try {
    await ensureSupabasePersistenceReady();
    const userId = await getSupabaseCurrentUserId();

    if (!userId) {
      return;
    }

    await supabase.from("product_click_logs").insert({
      user_id: userId,
      child_id: input.childId || null,
      product_result_id: input.productResultId || null,
      source: input.source,
      meal_plan_id: input.mealPlanId || null,
      meal_plan_item_id: input.mealPlanItemId || null,
      provider: input.provider,
      outbound_url: input.outboundUrl
    });
  } catch (error) {
    console.warn("Failed to log product click", error);
  }
}
