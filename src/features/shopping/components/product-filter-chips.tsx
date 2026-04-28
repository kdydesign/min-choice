import type { ProductSearchCategory, ProductSearchFilters } from "../types";

interface ProductFilterChipsProps {
  category: ProductSearchCategory;
  filters: ProductSearchFilters;
  disabled?: boolean;
  showAdvancedFilters?: boolean;
  onChangeCategory: (category: ProductSearchCategory) => void;
  onChangeFilters: (filters: ProductSearchFilters) => void;
}

const CATEGORY_OPTIONS: Array<{ value: ProductSearchCategory; label: string }> = [
  { value: "all", label: "전체" },
  { value: "baby_food", label: "이유식" },
  { value: "toddler_food", label: "유아식" },
  { value: "baby_side_dish", label: "아기반찬" },
  { value: "snack", label: "간식" }
];

export function ProductFilterChips({
  category,
  filters,
  disabled = false,
  showAdvancedFilters = false,
  onChangeCategory,
  onChangeFilters
}: ProductFilterChipsProps) {
  return (
    <section className="shopping-filter-section" aria-label="상품 검색 필터">
      <h2>카테고리</h2>
      <div className="shopping-filter-group" aria-label="카테고리">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`shopping-chip ${category === option.value ? "is-active" : ""}`}
            disabled={disabled}
            onClick={() => onChangeCategory(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showAdvancedFilters ? (
        <div className="shopping-filter-group" aria-label="상세 필터">
          <button
            type="button"
            className={`shopping-chip ${filters.onlyNaverPay ? "is-active" : ""}`}
            disabled={disabled}
            onClick={() => onChangeFilters({ ...filters, onlyNaverPay: !filters.onlyNaverPay })}
          >
            네이버페이
          </button>
          <button
            type="button"
            className={`shopping-chip ${filters.excludeAllergyKeywordMatches ? "is-active" : ""}`}
            disabled={disabled}
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
            className={`shopping-chip ${
              filters.excludeUsed && filters.excludeRental && filters.excludeOverseas ? "is-active" : ""
            }`}
            disabled={disabled}
            onClick={() => {
              const nextValue = !(filters.excludeUsed && filters.excludeRental && filters.excludeOverseas);
              onChangeFilters({
                ...filters,
                excludeUsed: nextValue,
                excludeRental: nextValue,
                excludeOverseas: nextValue
              });
            }}
          >
            중고/렌탈/해외직구 제외
          </button>
        </div>
      ) : null}
    </section>
  );
}
