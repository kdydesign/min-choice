import { LoadingState } from "../../../components/loading-state";
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
      <LoadingState
        title="상품을 검색 중이에요"
        description="가격 낮은 순 결과를 정리하고 있어요."
        lines={4}
      />
    );
  }

  if (isError) {
    return <ProductErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return <ProductEmptyState />;
  }

  const visibleItems = items.filter((item) => item.warningBadges.length === 0);
  const warningItems = items.filter((item) => item.warningBadges.length > 0);

  return (
    <section className="product-result-list" aria-label="상품 검색 결과">
      {visibleItems.map((item) => (
        <ProductResultCard
          key={item.id}
          item={item}
          childId={childId}
          source={source}
          mealContext={mealContext}
        />
      ))}

      {warningItems.length > 0 ? (
        <div className="product-result-warning-group">
          <p>알레르기 키워드가 포함된 상품</p>
          {warningItems.map((item) => (
            <ProductResultCard
              key={item.id}
              item={item}
              childId={childId}
              source={source}
              mealContext={mealContext}
              variant="warning"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
