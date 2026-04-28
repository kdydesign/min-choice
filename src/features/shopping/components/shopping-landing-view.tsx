import type { ChildProfile } from "../../../types/domain";
import { ChildShoppingContextCard } from "./child-shopping-context-card";
import { ProductFilterChips } from "./product-filter-chips";
import { ProductSearchBar } from "./product-search-bar";
import { RecommendedProductSearchChips } from "./recommended-product-search-chips";
import { ShoppingDisclaimer } from "./shopping-disclaimer";
import type { ProductSearchCategory, ProductSearchFilters } from "../types";

interface ShoppingLandingViewProps {
  child: ChildProfile | null;
  query: string;
  category: ProductSearchCategory;
  filters: ProductSearchFilters;
  disabled?: boolean;
  onSubmitSearch: (query: string) => void;
  onSelectRecommendation: (query: string, category: ProductSearchCategory) => void;
  onChangeCategory: (category: ProductSearchCategory) => void;
  onChangeFilters: (filters: ProductSearchFilters) => void;
}

export function ShoppingLandingView({
  child,
  query,
  category,
  filters,
  disabled = false,
  onSubmitSearch,
  onSelectRecommendation,
  onChangeCategory,
  onChangeFilters
}: ShoppingLandingViewProps) {
  return (
    <main className="shopping-content shopping-content-landing">
      <section className="shopping-landing-header">
        <div className="shopping-header-icon" aria-hidden="true">
          <span>☺</span>
        </div>
        <div>
          <h1>기성제품 찾기</h1>
          <p>아이 정보에 맞춰 이유식·유아식을 찾아볼게요</p>
        </div>
      </section>

      <ChildShoppingContextCard child={child} />

      <ProductSearchBar
        value={query}
        disabled={disabled}
        variant="landing"
        placeholder="찾고 싶은 이유식이나 유아식을 입력해 주세요"
        helperText="예: 소고기 이유식, 고구마 퓨레, 아기반찬"
        onSubmit={onSubmitSearch}
      />

      <RecommendedProductSearchChips
        child={child}
        disabled={disabled}
        onSelect={onSelectRecommendation}
      />

      <ProductFilterChips
        category={category}
        filters={filters}
        disabled={disabled}
        onChangeCategory={onChangeCategory}
        onChangeFilters={onChangeFilters}
      />

      <ShoppingDisclaimer />
    </main>
  );
}
