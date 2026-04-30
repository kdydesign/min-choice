import { ProgressLayerDialog } from "../../../components/progress-layer-dialog";
import { ProductEmptyState } from "./product-empty-state";
import { ProductErrorState } from "./product-error-state";
import { ProductResultCard } from "./product-result-card";
import type { MealProductSearchContext, ProductSearchItem, ProductSearchSource } from "../types";

interface ProductResultListProps {
  items: ProductSearchItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  childId?: string | null;
  source: ProductSearchSource;
  mealContext?: MealProductSearchContext | null;
  onRetry: () => void;
}

export function ProductResultList({
  items,
  isLoading,
  isError,
  errorMessage,
  childId = null,
  source,
  mealContext = null,
  onRetry
}: ProductResultListProps) {
  if (isLoading) {
    return (
      <ProgressLayerDialog
        title="상품을 검색 중이에요"
        description="조건에 맞는 결과를 정리하고 있어요."
        className="shopping-search-progress-layer"
      />
    );
  }

  if (isError) {
    return <ProductErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return <ProductEmptyState />;
  }

  return (
    <section className="product-result-list" aria-label="상품 검색 결과">
      {items.map((item) => (
        <ProductResultCard
          key={item.id}
          item={item}
          childId={childId}
          source={source}
          mealContext={mealContext}
        />
      ))}
    </section>
  );
}
