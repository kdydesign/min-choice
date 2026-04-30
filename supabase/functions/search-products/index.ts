import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { NaverShoppingProvider } from "./providers/naver-shopping.ts";
import { applyAllergyKeywordFilter } from "./utils/allergy-keyword-filter.ts";
import { buildCacheKey } from "./utils/cache-key.ts";
import { isFoodProduct } from "./utils/filter-product.ts";
import {
  formatDisplayPrice,
  normalizeNaverProduct,
  type NormalizedProduct
} from "./utils/normalize-product.ts";
import { rankProducts } from "./utils/rank-products.ts";

type ProductSearchCategory = "all" | "baby_food" | "toddler_food" | "baby_side_dish" | "snack";
type ProductSearchSource = "manual" | "child_suggestion" | "meal_result";

interface ProductSearchFilters {
  onlyNaverPay: boolean;
  excludeUsed: boolean;
  excludeRental: boolean;
  excludeOverseas: boolean;
  excludeAllergyKeywordMatches: boolean;
  minPrice: number | null;
  maxPrice: number | null;
}

interface ProductSearchRequest {
  query: string;
  category: ProductSearchCategory;
  childId: string | null;
  useChildContext: boolean;
  source: ProductSearchSource;
  mealContext: {
    mealPlanId?: string | null;
    mealPlanItemId?: string | null;
    mealType?: string | null;
    originMenuName?: string | null;
  } | null;
  filters: ProductSearchFilters;
  limit: number;
}

interface ChildContext {
  id: string;
  ageMonths: number | null;
  allergies: string[];
}

interface ProductSearchResultRow {
  id: string;
  provider: string;
  provider_product_id: string | null;
  title: string;
  image_url: string | null;
  product_url: string;
  mall_name: string | null;
  price: number;
  price_rank: number | null;
  allergy_keyword_matches_json: unknown;
  warning_badges_json: unknown;
  fetched_at: string;
  is_hidden_by_allergy_filter: boolean;
}

interface ProductSearchQueryRow {
  id: string;
  raw_query: string;
  normalized_query: string;
  provider: string;
  created_at: string;
  product_search_results?: ProductSearchResultRow[] | null;
}

class RequestValidationError extends Error {}

const CACHE_TTL_SECONDS = 1800;
const PRODUCT_SEARCH_NOTICES = [
  "가격은 검색 시점 기준이며 실제 구매 가격, 배송비, 옵션가는 쇼핑몰에서 달라질 수 있어요.",
  "제품 성분, 알레르기, 월령 적합성은 구매 전 상세 페이지에서 꼭 확인해 주세요."
];
const PRODUCT_SEARCH_CATEGORIES = ["all", "baby_food", "toddler_food", "baby_side_dish", "snack"];
const PRODUCT_SEARCH_SOURCES = ["manual", "child_suggestion", "meal_result"];
const QUERY_PRESERVE_KEYWORDS = ["이유식", "유아식", "아기", "아이반찬", "아기반찬", "퓨레"];
const CATEGORY_SUFFIX: Record<ProductSearchCategory, string> = {
  all: "이유식",
  baby_food: "이유식",
  toddler_food: "유아식",
  baby_side_dish: "아기반찬",
  snack: "아기 간식"
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function readNullableNumber(value: unknown) {
  const parsed = readNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
}

function stripAutoAgeMonth(value: string) {
  return value.replace(/(^|\s)\d{1,2}\s*개월(?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
}

function buildNormalizedQuery(query: string, category: ProductSearchCategory) {
  const rawQuery = stripAutoAgeMonth(query);

  if (!rawQuery) {
    throw new RequestValidationError("query is required");
  }

  if (QUERY_PRESERVE_KEYWORDS.some((keyword) => rawQuery.includes(keyword))) {
    return rawQuery;
  }

  return `${rawQuery} ${CATEGORY_SUFFIX[category]}`.trim();
}

function parseRequest(value: unknown): ProductSearchRequest {
  if (!isRecord(value)) {
    throw new RequestValidationError("Request body must be an object");
  }

  const category = readString(value.category);
  const source = readString(value.source);
  const filters = isRecord(value.filters) ? value.filters : {};
  const mealContext = isRecord(value.mealContext) ? value.mealContext : null;

  return {
    query: readString(value.query),
    category: PRODUCT_SEARCH_CATEGORIES.includes(category)
      ? (category as ProductSearchCategory)
      : "all",
    childId: readString(value.childId) || null,
    useChildContext: readBoolean(value.useChildContext, false),
    source: PRODUCT_SEARCH_SOURCES.includes(source) ? (source as ProductSearchSource) : "manual",
    mealContext: mealContext
      ? {
          mealPlanId: readString(mealContext.mealPlanId) || null,
          mealPlanItemId: readString(mealContext.mealPlanItemId) || null,
          mealType: readString(mealContext.mealType) || null,
          originMenuName: readString(mealContext.originMenuName) || null
        }
      : null,
    filters: {
      onlyNaverPay: readBoolean(filters.onlyNaverPay, false),
      excludeUsed: readBoolean(filters.excludeUsed, true),
      excludeRental: readBoolean(filters.excludeRental, true),
      excludeOverseas: readBoolean(filters.excludeOverseas, true),
      excludeAllergyKeywordMatches: readBoolean(filters.excludeAllergyKeywordMatches, true),
      minPrice: readNullableNumber(filters.minPrice),
      maxPrice: readNullableNumber(filters.maxPrice)
    },
    limit: Math.min(Math.max(Math.round(readNumber(value.limit, 20)), 1), 100)
  };
}

function getBearerToken(authorization: string) {
  const [scheme, token] = authorization.trim().split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

function createClientPair(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const authorization = request.headers.get("Authorization") ?? "";
  const accessToken = getBearerToken(authorization);

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !accessToken) {
    return null;
  }

  return {
    userClient: createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }),
    adminClient: createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }),
    accessToken
  };
}

async function loadChildContext(
  adminClient: ReturnType<typeof createClient>,
  childId: string | null,
  userId: string
): Promise<ChildContext | null> {
  if (!childId) {
    return null;
  }

  const { data, error } = await adminClient
    .from("children")
    .select("id, age_months, allergies_json")
    .eq("id", childId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { id: string; age_months: number | null; allergies_json: unknown };

  return {
    id: row.id,
    ageMonths: row.age_months,
    allergies: readStringArray(row.allergies_json)
  };
}

function mapResultRow(row: ProductSearchResultRow) {
  return {
    id: row.id,
    provider: "naver",
    providerProductId: row.provider_product_id ?? "",
    title: row.title,
    imageUrl: row.image_url ?? "",
    productUrl: row.product_url,
    mallName: row.mall_name ?? "판매처 확인",
    price: row.price,
    displayPrice: formatDisplayPrice(row.price),
    priceRank: row.price_rank ?? 1,
    allergyKeywordMatches: readStringArray(row.allergy_keyword_matches_json),
    warningBadges: readStringArray(row.warning_badges_json),
    fetchedAt: row.fetched_at
  };
}

async function loadCachedResponse(
  adminClient: ReturnType<typeof createClient>,
  cacheKey: string,
  excludeAllergyMatches: boolean
) {
  const cutoff = new Date(Date.now() - CACHE_TTL_SECONDS * 1000).toISOString();
  const { data, error } = await adminClient
    .from("product_search_queries")
    .select(
      "id, raw_query, normalized_query, provider, created_at, product_search_results(id, provider, provider_product_id, title, image_url, product_url, mall_name, price, price_rank, allergy_keyword_matches_json, warning_badges_json, fetched_at, is_hidden_by_allergy_filter)"
    )
    .eq("cache_key", cacheKey)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as ProductSearchQueryRow;
  const resultRows = row.product_search_results ?? [];
  const items = resultRows
    .filter((item) => !excludeAllergyMatches || !item.is_hidden_by_allergy_filter)
    .sort((left, right) => (left.price_rank ?? 9999) - (right.price_rank ?? 9999))
    .map((item) => mapResultRow(item));

  return {
    query: row.raw_query,
    normalizedQuery: row.normalized_query,
    provider: "naver",
    fetchedAt: row.created_at,
    cacheTtlSeconds: CACHE_TTL_SECONDS,
    notices: PRODUCT_SEARCH_NOTICES,
    items
  };
}

function applyPriceFilter(product: NormalizedProduct, filters: ProductSearchFilters) {
  if (filters.minPrice !== null && product.price < filters.minPrice) {
    return false;
  }

  if (filters.maxPrice !== null && product.price > filters.maxPrice) {
    return false;
  }

  return true;
}

async function saveSearchResult(input: {
  adminClient: ReturnType<typeof createClient>;
  request: ProductSearchRequest;
  normalizedQuery: string;
  cacheKey: string;
  userId: string;
  isAnonymousUser: boolean;
  childContext: ChildContext | null;
  products: NormalizedProduct[];
}) {
  const { data: queryRow, error: queryError } = await input.adminClient
    .from("product_search_queries")
    .insert({
      user_id: input.userId,
      anonymous_user_id: input.isAnonymousUser ? input.userId : null,
      child_id: input.childContext?.id ?? input.request.childId,
      source: input.request.source,
      meal_plan_id: input.request.mealContext?.mealPlanId ?? null,
      meal_plan_item_id: input.request.mealContext?.mealPlanItemId ?? null,
      meal_type: input.request.mealContext?.mealType ?? null,
      origin_menu_name: input.request.mealContext?.originMenuName ?? null,
      raw_query: input.request.query,
      normalized_query: input.normalizedQuery,
      category: input.request.category,
      use_child_context: input.request.useChildContext,
      child_age_months: input.childContext?.ageMonths ?? null,
      child_allergies_snapshot_json: input.childContext?.allergies ?? [],
      provider: "naver",
      cache_key: input.cacheKey
    })
    .select("id, created_at")
    .single();

  if (queryError || !queryRow) {
    console.warn("Failed to save product search query", queryError);
    return null;
  }

  const query = queryRow as { id: string; created_at: string };
  const resultPayload = input.products.map((product) => ({
    query_id: query.id,
    provider: product.provider,
    provider_product_id: product.providerProductId,
    title: product.title,
    normalized_title: product.normalizedTitle,
    image_url: product.imageUrl || null,
    product_url: product.productUrl,
    mall_name: product.mallName || null,
    price: product.price,
    high_price: product.highPrice,
    brand: product.brand || null,
    maker: product.maker || null,
    category1: product.category1 || null,
    category2: product.category2 || null,
    category3: product.category3 || null,
    category4: product.category4 || null,
    product_type: product.productType || null,
    relevance_score: product.relevanceScore,
    price_rank: product.priceRank,
    allergy_keyword_matches_json: product.allergyKeywordMatches,
    warning_badges_json: product.warningBadges,
    is_hidden_by_allergy_filter: product.isHiddenByAllergyFilter,
    fetched_at: product.fetchedAt,
    raw_json: product.rawJson
  }));

  const { data: resultRows, error: resultError } = await input.adminClient
    .from("product_search_results")
    .insert(resultPayload)
    .select(
      "id, provider, provider_product_id, title, image_url, product_url, mall_name, price, price_rank, allergy_keyword_matches_json, warning_badges_json, fetched_at, is_hidden_by_allergy_filter"
    );

  if (resultError) {
    console.warn("Failed to save product search results", resultError);
  }

  const snapshotPayload = input.products.map((product) => ({
    provider: product.provider,
    provider_product_id: product.providerProductId,
    normalized_title: product.normalizedTitle,
    price: product.price,
    mall_name: product.mallName || null,
    product_url: product.productUrl,
    fetched_at: product.fetchedAt
  }));

  const { error: snapshotError } = await input.adminClient
    .from("product_price_snapshots")
    .insert(snapshotPayload);

  if (snapshotError) {
    console.warn("Failed to save product price snapshots", snapshotError);
  }

  return {
    queryId: query.id,
    createdAt: query.created_at,
    resultRows: (resultRows ?? []) as ProductSearchResultRow[]
  };
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "지원하지 않는 요청 방식이에요." }, 405);
  }

  try {
    const clients = createClientPair(request);

    if (!clients) {
      return jsonResponse({ error: "상품 검색 인증 정보를 확인하지 못했어요." }, 401);
    }

    const { data: userData, error: userError } = await clients.userClient.auth.getUser(
      clients.accessToken
    );

    if (userError || !userData.user) {
      return jsonResponse({ error: "상품 검색을 위한 로그인이 필요해요." }, 401);
    }

    const requestBody = parseRequest(await request.json());
    const normalizedQuery = buildNormalizedQuery(requestBody.query, requestBody.category);
    const childContext = requestBody.useChildContext
      ? await loadChildContext(clients.adminClient, requestBody.childId, userData.user.id)
      : null;
    const cacheKey = buildCacheKey({
      provider: "naver",
      normalizedQuery,
      category: requestBody.category,
      filters: requestBody.filters,
      allergyKeywords: childContext?.allergies ?? [],
      limit: requestBody.limit
    });
    const cachedResponse = await loadCachedResponse(
      clients.adminClient,
      cacheKey,
      requestBody.filters.excludeAllergyKeywordMatches
    );

    if (cachedResponse) {
      return jsonResponse(cachedResponse);
    }

    const naverClientId = Deno.env.get("NAVER_SHOPPING_CLIENT_ID")?.trim();
    const naverClientSecret = Deno.env.get("NAVER_SHOPPING_CLIENT_SECRET")?.trim();

    if (!naverClientId || !naverClientSecret) {
      return jsonResponse({ error: "상품 검색 서버 설정이 아직 준비되지 않았어요." }, 500);
    }

    const provider = new NaverShoppingProvider(naverClientId, naverClientSecret);
    const fetchedAt = new Date().toISOString();
    const naverItems = await provider.search({
      query: normalizedQuery,
      limit: requestBody.limit,
      onlyNaverPay: requestBody.filters.onlyNaverPay,
      excludeUsed: requestBody.filters.excludeUsed,
      excludeRental: requestBody.filters.excludeRental,
      excludeOverseas: requestBody.filters.excludeOverseas
    });
    const products = rankProducts(
      naverItems
        .flatMap((item) => {
          const product = normalizeNaverProduct(item, fetchedAt);
          return product ? [product] : [];
        })
        .filter((product) => isFoodProduct(product))
        .map((product) =>
          applyAllergyKeywordFilter({
            product,
            allergies: childContext?.allergies ?? [],
            excludeMatches: requestBody.filters.excludeAllergyKeywordMatches
          })
        )
        .filter((product) => applyPriceFilter(product, requestBody.filters))
    );
    const responseProducts = products
      .filter((product) => !product.isHiddenByAllergyFilter)
      .slice(0, requestBody.limit);
    const saved = await saveSearchResult({
      adminClient: clients.adminClient,
      request: requestBody,
      normalizedQuery,
      cacheKey,
      userId: userData.user.id,
      isAnonymousUser:
        "is_anonymous" in userData.user ? Boolean(userData.user.is_anonymous) : false,
      childContext,
      products: responseProducts
    });
    const savedRows = saved?.resultRows ?? [];

    return jsonResponse({
      query: requestBody.query,
      normalizedQuery,
      provider: "naver",
      fetchedAt: saved?.createdAt ?? fetchedAt,
      cacheTtlSeconds: CACHE_TTL_SECONDS,
      notices: PRODUCT_SEARCH_NOTICES,
      items: responseProducts.map((product) => {
        const savedRow = savedRows.find(
          (row) => row.provider_product_id === product.providerProductId
        );

        return {
          id: savedRow?.id ?? `${product.providerProductId}-${product.priceRank}`,
          provider: "naver",
          providerProductId: product.providerProductId,
          title: product.title,
          imageUrl: product.imageUrl,
          productUrl: product.productUrl,
          mallName: product.mallName || "판매처 확인",
          price: product.price,
          displayPrice: formatDisplayPrice(product.price),
          priceRank: product.priceRank,
          allergyKeywordMatches: product.allergyKeywordMatches,
          warningBadges: product.warningBadges,
          fetchedAt: product.fetchedAt
        };
      })
    });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    console.warn("Product search failed", error);
    return jsonResponse({ error: "상품 검색을 완료하지 못했어요. 잠시 후 다시 시도해 주세요." }, 502);
  }
});
