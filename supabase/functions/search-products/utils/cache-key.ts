export interface CacheKeyInput {
  provider: string;
  normalizedQuery: string;
  category: string;
  filters: Record<string, unknown>;
  allergyKeywords: string[];
  limit: number;
}

export const PRODUCT_SEARCH_FILTER_POLICY_VERSION = "filter-policy-v2";

export function buildCacheKey(input: CacheKeyInput) {
  const normalizedFilters = Object.fromEntries(
    Object.entries(input.filters).sort(([left], [right]) => left.localeCompare(right))
  );

  return [
    input.provider,
    PRODUCT_SEARCH_FILTER_POLICY_VERSION,
    input.normalizedQuery,
    input.category,
    JSON.stringify(normalizedFilters),
    input.allergyKeywords.map((keyword) => keyword.trim()).filter(Boolean).sort().join(","),
    String(input.limit)
  ].join("|");
}
