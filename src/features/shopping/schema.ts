import {
  DEFAULT_PRODUCT_SEARCH_FILTERS,
  DEFAULT_PRODUCT_SEARCH_SORT_MODE,
  PRODUCT_SEARCH_CATEGORIES,
  PRODUCT_SEARCH_SORT_MODES,
  PRODUCT_SEARCH_SOURCES,
  type MealProductSearchContext,
  type ProductSearchCategory,
  type ProductSearchFilters,
  type ProductSearchItem,
  type ProductSearchRequest,
  type ProductSearchResponse,
  type ProductSearchSource,
  type ProductSearchSortMode
} from "./types";
import { formatProductPrice } from "./utils/format-product-price";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function parseNumber(value: unknown, fallback: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
}

export function parseProductSearchCategory(value: unknown): ProductSearchCategory {
  return typeof value === "string" &&
    PRODUCT_SEARCH_CATEGORIES.includes(value as ProductSearchCategory)
    ? (value as ProductSearchCategory)
    : "all";
}

export function parseProductSearchSource(value: unknown): ProductSearchSource {
  return typeof value === "string" && PRODUCT_SEARCH_SOURCES.includes(value as ProductSearchSource)
    ? (value as ProductSearchSource)
    : "manual";
}

export function parseProductSearchSortMode(value: unknown): ProductSearchSortMode {
  return typeof value === "string" &&
    PRODUCT_SEARCH_SORT_MODES.includes(value as ProductSearchSortMode)
    ? (value as ProductSearchSortMode)
    : DEFAULT_PRODUCT_SEARCH_SORT_MODE;
}

export function parseProductSearchFilters(value: unknown): ProductSearchFilters {
  const raw = isRecord(value) ? value : {};

  return {
    onlyNaverPay: parseBoolean(raw.onlyNaverPay, DEFAULT_PRODUCT_SEARCH_FILTERS.onlyNaverPay),
    excludeUsed: parseBoolean(raw.excludeUsed, DEFAULT_PRODUCT_SEARCH_FILTERS.excludeUsed),
    excludeRental: parseBoolean(raw.excludeRental, DEFAULT_PRODUCT_SEARCH_FILTERS.excludeRental),
    excludeOverseas: parseBoolean(raw.excludeOverseas, DEFAULT_PRODUCT_SEARCH_FILTERS.excludeOverseas),
    excludeAllergyKeywordMatches: parseBoolean(
      raw.excludeAllergyKeywordMatches,
      DEFAULT_PRODUCT_SEARCH_FILTERS.excludeAllergyKeywordMatches
    ),
    minPrice:
      typeof raw.minPrice === "number" && Number.isFinite(raw.minPrice) ? raw.minPrice : null,
    maxPrice:
      typeof raw.maxPrice === "number" && Number.isFinite(raw.maxPrice) ? raw.maxPrice : null
  };
}

function parseMealContext(value: unknown): MealProductSearchContext | null {
  if (!isRecord(value)) {
    return null;
  }

  const mealType = parseString(value.mealType);
  if (!["breakfast", "lunch", "dinner"].includes(mealType)) {
    return null;
  }

  return {
    mealPlanId: parseString(value.mealPlanId) || null,
    mealPlanItemId: parseString(value.mealPlanItemId) || null,
    mealType: mealType as MealProductSearchContext["mealType"],
    originMenuName: parseString(value.originMenuName)
  };
}

export function normalizeProductSearchRequest(input: Partial<ProductSearchRequest>): ProductSearchRequest {
  return {
    query: parseString(input.query),
    category: parseProductSearchCategory(input.category),
    childId: parseString(input.childId) || null,
    useChildContext: Boolean(input.useChildContext),
    source: parseProductSearchSource(input.source),
    mealContext: parseMealContext(input.mealContext),
    filters: parseProductSearchFilters(input.filters),
    sortMode: parseProductSearchSortMode(input.sortMode),
    limit: Math.min(Math.max(Math.round(parseNumber(input.limit, 20)), 1), 100)
  };
}

function parseProductSearchItem(value: unknown): ProductSearchItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = parseString(value.title);
  const productUrl = parseString(value.productUrl);
  const price = parseNumber(value.price, 0);

  if (!title || !productUrl || price <= 0) {
    return null;
  }

  return {
    id: parseString(value.id, `${parseString(value.providerProductId)}-${title}`),
    provider: "naver",
    providerProductId: parseString(value.providerProductId),
    title,
    imageUrl: parseString(value.imageUrl),
    productUrl,
    mallName: parseString(value.mallName, "판매처 확인"),
    price,
    displayPrice: parseString(value.displayPrice) || formatProductPrice(price),
    priceRank: Math.max(1, Math.round(parseNumber(value.priceRank, 1))),
    relevanceScore: parseNumber(value.relevanceScore, 0),
    allergyKeywordMatches: parseStringArray(value.allergyKeywordMatches),
    warningBadges: parseStringArray(value.warningBadges),
    fetchedAt: parseString(value.fetchedAt, new Date().toISOString())
  };
}

export function parseProductSearchResponse(value: unknown): ProductSearchResponse {
  if (!isRecord(value)) {
    throw new Error("상품 검색 응답이 올바르지 않아요.");
  }

  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        const parsed = parseProductSearchItem(item);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    query: parseString(value.query),
    normalizedQuery: parseString(value.normalizedQuery),
    provider: "naver",
    fetchedAt: parseString(value.fetchedAt, new Date().toISOString()),
    cacheTtlSeconds: Math.max(0, Math.round(parseNumber(value.cacheTtlSeconds, 1800))),
    notices: parseStringArray(value.notices),
    items
  };
}
