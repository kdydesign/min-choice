import { ProductResultFilterChips } from "./product-result-filter-chips";
import { ProductResultList } from "./product-result-list";
import { ProductSearchBar } from "./product-search-bar";
import { ShoppingDisclaimer } from "./shopping-disclaimer";
import { ShoppingResultHeader } from "./shopping-result-header";
import type {
  MealProductSearchContext,
  ProductSearchFilters,
  ProductSearchItem,
  ProductSearchSource
} from "../types";

interface ShoppingResultViewProps {
  variant: "meal" | "manual";
  title: string;
  subtitle: string;
  query: string;
  filters: ProductSearchFilters;
  items: ProductSearchItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  childId?: string | null;
  source: ProductSearchSource;
  mealContext?: MealProductSearchContext | null;
  onSubmitSearch: (query: string) => void;
  onChangeFilters: (filters: ProductSearchFilters) => void;
  onRetry: () => void;
}

export function ShoppingResultView({
  variant,
  title,
  subtitle,
  query,
  filters,
  items,
  isLoading,
  isError,
  errorMessage,
  childId = null,
  source,
  mealContext = null,
  onSubmitSearch,
  onChangeFilters,
  onRetry
}: ShoppingResultViewProps) {
  return (
    <>
      <ShoppingResultHeader title={title} subtitle={subtitle} variant={variant}>
        <section className="shopping-condition-panel" aria-label="검색 조건">
          {variant === "meal" ? (
            <div className="shopping-query-summary">
              <strong>검색어:</strong>
              <span>{query}</span>
            </div>
          ) : null}
          {variant === "meal" ? (
            <ProductSearchBar
              value={query}
              disabled={isLoading}
              variant="result"
              placeholder="검색어를 입력해 주세요"
              onSubmit={onSubmitSearch}
            />
          ) : null}
          <ProductResultFilterChips
            filters={filters}
            disabled={isLoading}
            onChangeFilters={onChangeFilters}
          />
        </section>
      </ShoppingResultHeader>

      <main
        className={`shopping-content shopping-content-result shopping-result-${variant}`}
        aria-busy={isLoading}
      >
        <ProductResultList
          items={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          childId={childId}
          source={source}
          mealContext={mealContext}
          onRetry={onRetry}
        />

        {!isLoading && !isError ? <ShoppingDisclaimer /> : null}
      </main>
    </>
  );
}
