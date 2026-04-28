import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { searchProducts } from "./api";
import { normalizeProductSearchRequest } from "./schema";
import type { ProductSearchRequest } from "./types";

export function getProductSearchQueryKey(input: ProductSearchRequest) {
  const request = normalizeProductSearchRequest(input);

  return [
    "product-search",
    request.query,
    request.category,
    request.childId ?? "",
    request.source,
    request.useChildContext,
    request.filters.onlyNaverPay,
    request.filters.excludeUsed,
    request.filters.excludeRental,
    request.filters.excludeOverseas,
    request.filters.excludeAllergyKeywordMatches,
    request.filters.minPrice ?? "",
    request.filters.maxPrice ?? "",
    request.limit
  ] as const;
}

export function useProductSearch(input: ProductSearchRequest, enabled: boolean) {
  const request = normalizeProductSearchRequest(input);

  return useQuery({
    queryKey: getProductSearchQueryKey(request),
    queryFn: () => searchProducts(request),
    enabled: enabled && Boolean(request.query.trim()),
    staleTime: 60 * 1000,
    retry: 1
  });
}

export function useMealProductSearchNavigation() {
  const navigate = useNavigate();

  return (params: URLSearchParams) => {
    navigate(`/shopping?${params.toString()}`);
  };
}
