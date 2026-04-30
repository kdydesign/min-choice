import type { ProductSearchFilters } from "../types";

interface ProductResultFilterChipsProps {
  filters: ProductSearchFilters;
  disabled?: boolean;
  onChangeFilters: (filters: ProductSearchFilters) => void;
}

export function ProductResultFilterChips({
  filters,
  disabled = false,
  onChangeFilters
}: ProductResultFilterChipsProps) {
  const excludeNonFoodSources =
    filters.excludeUsed && filters.excludeRental && filters.excludeOverseas;

  return (
    <div className="shopping-result-filter-row" aria-label="상품 결과 필터">
      <button
        type="button"
        className="shopping-result-filter-chip is-sort-active"
        aria-pressed="true"
      >
        가격 낮은 순
      </button>
      <button
        type="button"
        className={`shopping-result-filter-chip ${filters.onlyNaverPay ? "is-selected" : ""}`}
        disabled={disabled}
        aria-pressed={filters.onlyNaverPay}
        onClick={() => onChangeFilters({ ...filters, onlyNaverPay: !filters.onlyNaverPay })}
      >
        네이버페이
      </button>
      <button
        type="button"
        className={`shopping-result-filter-chip ${
          filters.excludeAllergyKeywordMatches ? "is-selected" : ""
        }`}
        disabled={disabled}
        aria-pressed={filters.excludeAllergyKeywordMatches}
        onClick={() =>
          onChangeFilters({
            ...filters,
            excludeAllergyKeywordMatches: !filters.excludeAllergyKeywordMatches
          })
        }
      >
        알레르기 키워드 제외
      </button>
      <button
        type="button"
        className={`shopping-result-filter-chip ${excludeNonFoodSources ? "is-selected" : ""}`}
        disabled={disabled}
        aria-pressed={excludeNonFoodSources}
        onClick={() =>
          onChangeFilters({
            ...filters,
            excludeUsed: !excludeNonFoodSources,
            excludeRental: !excludeNonFoodSources,
            excludeOverseas: !excludeNonFoodSources
          })
        }
      >
        중고·렌탈·해외직구 제외
      </button>
    </div>
  );
}
