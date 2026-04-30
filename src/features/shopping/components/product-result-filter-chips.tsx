import type { ProductSearchFilters, ProductSearchSortMode } from "../types";

interface ProductResultFilterChipsProps {
  sortMode: ProductSearchSortMode;
  filters: ProductSearchFilters;
  disabled?: boolean;
  onChangeSortMode: (sortMode: ProductSearchSortMode) => void;
  onChangeFilters: (filters: ProductSearchFilters) => void;
}

const SORT_OPTIONS: Array<{ value: ProductSearchSortMode; label: string }> = [
  { value: "recommended", label: "추천순" },
  { value: "price_low", label: "가격 낮은순" }
];

export function ProductResultFilterChips({
  sortMode,
  filters,
  disabled = false,
  onChangeSortMode,
  onChangeFilters
}: ProductResultFilterChipsProps) {
  return (
    <div className="shopping-result-filter-row" aria-label="상품 결과 필터">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`shopping-result-filter-chip ${sortMode === option.value ? "is-selected" : ""}`}
          disabled={disabled}
          aria-pressed={sortMode === option.value}
          onClick={() => onChangeSortMode(option.value)}
        >
          {option.label}
        </button>
      ))}
      <button
        type="button"
        className={`shopping-result-filter-chip ${filters.onlyNaverPay ? "is-selected" : ""}`}
        disabled={disabled}
        aria-label="네이버페이 상품만 보기"
        aria-pressed={filters.onlyNaverPay}
        onClick={() => onChangeFilters({ ...filters, onlyNaverPay: !filters.onlyNaverPay })}
      >
        네이버페이 상품
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
    </div>
  );
}
