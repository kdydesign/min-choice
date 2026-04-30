import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { CommonBottomMenu } from "../components/common-bottom-menu";
import { SessionCheckingOverlay } from "../features/auth/components/session-checking-overlay";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import { ShoppingLandingView } from "../features/shopping/components/shopping-landing-view";
import { ShoppingResultView } from "../features/shopping/components/shopping-result-view";
import { useProductSearch } from "../features/shopping/hooks";
import {
  parseProductSearchCategory,
  parseProductSearchSortMode,
  parseProductSearchSource
} from "../features/shopping/schema";
import {
  DEFAULT_PRODUCT_SEARCH_FILTERS,
  DEFAULT_PRODUCT_SEARCH_SORT_MODE,
  type MealProductSearchContext,
  type ProductSearchCategory,
  type ProductSearchFilters,
  type ProductSearchSource,
  type ProductSearchSortMode
} from "../features/shopping/types";
import { buildProductSearchQuery } from "../features/shopping/utils/build-product-query";
import { useAppStore } from "../store/use-app-store";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getBooleanParam(value: string | null, fallback: boolean) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function getFiltersFromSearchParams(searchParams: URLSearchParams): ProductSearchFilters {
  return {
    ...DEFAULT_PRODUCT_SEARCH_FILTERS,
    onlyNaverPay: getBooleanParam(searchParams.get("naverPay"), false),
    excludeAllergyKeywordMatches: getBooleanParam(searchParams.get("excludeAllergy"), true)
  };
}

function getKoreanTopicJoiner(value: string) {
  const lastChar = value.trim().at(-1);

  if (!lastChar) {
    return "와";
  }

  const code = lastChar.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (code < hangulStart || code > hangulEnd) {
    return "와";
  }

  const hasFinalConsonant = (code - hangulStart) % 28 !== 0;
  return hasFinalConsonant ? "과" : "와";
}

function buildMealContext(searchParams: URLSearchParams): MealProductSearchContext | null {
  const mealType = searchParams.get("mealType");

  if (!mealType || !["breakfast", "lunch", "dinner"].includes(mealType)) {
    return null;
  }

  return {
    mealPlanId: searchParams.get("mealPlanId"),
    mealPlanItemId: searchParams.get("mealPlanItemId"),
    mealType: mealType as MealProductSearchContext["mealType"],
    originMenuName: searchParams.get("originMenuName") ?? ""
  };
}

function writeSearchParams(input: {
  query: string;
  category: ProductSearchCategory;
  source: ProductSearchSource;
  sortMode: ProductSearchSortMode;
  childId?: string | null;
  filters: ProductSearchFilters;
  mealContext?: MealProductSearchContext | null;
}) {
  const params = new URLSearchParams();

  params.set("q", input.query);
  params.set("category", input.category);
  params.set("source", input.source);

  if (input.sortMode !== DEFAULT_PRODUCT_SEARCH_SORT_MODE) {
    params.set("sort", input.sortMode);
  }

  if (input.childId) {
    params.set("childId", input.childId);
  }

  if (input.filters.onlyNaverPay) {
    params.set("naverPay", "true");
  }

  if (!input.filters.excludeAllergyKeywordMatches) {
    params.set("excludeAllergy", "false");
  }

  if (input.mealContext) {
    params.set("mealType", input.mealContext.mealType);
    params.set("originMenuName", input.mealContext.originMenuName);

    if (input.mealContext.mealPlanId) {
      params.set("mealPlanId", input.mealContext.mealPlanId);
    }

    if (input.mealContext.mealPlanItemId) {
      params.set("mealPlanItemId", input.mealContext.mealPlanItemId);
    }
  }

  return params;
}

function getShoppingResultSubtitle(sortMode: ProductSearchSortMode) {
  if (sortMode === "price_low") {
    return "관련도 높은 상품 안에서 낮은 가격순으로 보여드려요";
  }

  return "관련도 높은 기성제품부터 보여드려요";
}

export function ShoppingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = parseProductSearchCategory(searchParams.get("category"));
  const initialSource = parseProductSearchSource(searchParams.get("source"));
  const initialSortMode = parseProductSearchSortMode(searchParams.get("sort"));
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<ProductSearchCategory>(initialCategory);
  const [source, setSource] = useState<ProductSearchSource>(initialSource);
  const [sortMode, setSortMode] = useState<ProductSearchSortMode>(initialSortMode);
  const [filters, setFilters] = useState<ProductSearchFilters>(() =>
    getFiltersFromSearchParams(searchParams)
  );
  const mealContext = useMemo(() => buildMealContext(searchParams), [searchParams]);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setCategory(parseProductSearchCategory(searchParams.get("category")));
    setSource(parseProductSearchSource(searchParams.get("source")));
    setSortMode(parseProductSearchSortMode(searchParams.get("sort")));
    setFilters(getFiltersFromSearchParams(searchParams));
  }, [searchParams]);

  const { data: profiles = [], isLoading: isProfilesLoading } = useQuery({
    queryKey: ["children"],
    queryFn: listChildProfiles
  });
  const selectedChild = useMemo(
    () =>
      profiles.find((profile) => profile.id === (searchParams.get("childId") || selectedChildId)) ??
      null,
    [profiles, searchParams, selectedChildId]
  );
  const normalizedQuery = useMemo(
    () => buildProductSearchQuery({ query, category }),
    [category, query]
  );
  const searchRequest = {
    query: normalizedQuery,
    category,
    childId: selectedChild?.id ?? null,
    useChildContext: Boolean(selectedChild),
    source,
    mealContext,
    filters,
    sortMode,
    limit: 20
  };
  const productSearch = useProductSearch(searchRequest, Boolean(normalizedQuery));
  const isBusy = productSearch.isFetching;
  const hasSearchQuery = Boolean(normalizedQuery.trim());
  const isMealResultSearch = source === "meal_result" && Boolean(mealContext?.originMenuName);
  const mealResultTitleBase = mealContext?.originMenuName ?? normalizedQuery;

  function commitSearch(nextQuery: string, nextCategory = category, nextSource: ProductSearchSource = "manual") {
    const normalized = buildProductSearchQuery({ query: nextQuery, category: nextCategory });

    setQuery(nextQuery);
    setCategory(nextCategory);
    setSource(nextSource);
    setSearchParams(
      writeSearchParams({
        query: normalized,
        category: nextCategory,
        source: nextSource,
        sortMode,
        childId: selectedChild?.id,
        filters,
        mealContext: nextSource === "meal_result" ? mealContext : null
      })
    );
  }

  function handleChangeSortMode(nextSortMode: ProductSearchSortMode) {
    setSortMode(nextSortMode);
    if (query.trim()) {
      setSearchParams(
        writeSearchParams({
          query: normalizedQuery,
          category,
          source,
          sortMode: nextSortMode,
          childId: selectedChild?.id,
          filters,
          mealContext
        })
      );
    }
  }

  function handleChangeFilters(nextFilters: ProductSearchFilters) {
    setFilters(nextFilters);
    if (query.trim()) {
      setSearchParams(
        writeSearchParams({
          query: normalizedQuery,
          category,
          source,
          sortMode,
          childId: selectedChild?.id,
          filters: nextFilters,
          mealContext
        })
      );
    }
  }

  return (
    <div className="shopping-page">
      {isProfilesLoading ? (
        <SessionCheckingOverlay
          title="아이 정보 확인 중..."
          description="선택된 아이 정보를 준비하고 있어요."
        />
      ) : null}

      {hasSearchQuery ? (
        <ShoppingResultView
          variant={isMealResultSearch ? "meal" : "manual"}
          title={
            isMealResultSearch
              ? `${mealResultTitleBase}${getKoreanTopicJoiner(mealResultTitleBase)} 비슷한 기성제품`
              : `"${normalizedQuery}" 검색 결과`
          }
          subtitle={getShoppingResultSubtitle(sortMode)}
          query={normalizedQuery}
          sortMode={sortMode}
          filters={filters}
          items={productSearch.data?.items ?? []}
          isLoading={productSearch.isLoading || productSearch.isFetching}
          isError={productSearch.isError}
          errorMessage={getErrorMessage(productSearch.error, "상품 검색을 완료하지 못했어요.")}
          childId={selectedChild?.id ?? null}
          source={source}
          mealContext={mealContext}
          onSubmitSearch={(nextQuery) => commitSearch(nextQuery, category, source)}
          onChangeSortMode={handleChangeSortMode}
          onChangeFilters={handleChangeFilters}
          onRetry={() => {
            void productSearch.refetch();
          }}
        />
      ) : (
        <ShoppingLandingView
          child={selectedChild}
          query={query}
          category={category}
          filters={filters}
          disabled={isBusy}
          onSubmitSearch={(nextQuery) => commitSearch(nextQuery)}
          onSelectRecommendation={(nextQuery, nextCategory) =>
            commitSearch(nextQuery, nextCategory, "child_suggestion")
          }
          onChangeCategory={(nextCategory) => {
            setCategory(nextCategory);
          }}
          onChangeFilters={handleChangeFilters}
        />
      )}

      <CommonBottomMenu />
    </div>
  );
}
