import type { MouseEvent } from "react";
import { logProductClick } from "../api";
import type { MealProductSearchContext, ProductSearchItem, ProductSearchSource } from "../types";

const OUTBOUND_NAVIGATION_FALLBACK_MS = 250;

interface ProductResultCardProps {
  item: ProductSearchItem;
  childId?: string | null;
  source: ProductSearchSource;
  mealContext?: MealProductSearchContext | null;
  variant?: "default" | "warning";
}

export function ProductResultCard({
  item,
  childId = null,
  source,
  mealContext = null,
  variant = item.warningBadges.length > 0 ? "warning" : "default"
}: ProductResultCardProps) {
  const isWarning = variant === "warning";
  const displayPrice = item.displayPrice || "가격 정보 없음";

  function handlePriceLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    let didNavigate = false;
    const navigateToProduct = () => {
      if (didNavigate) {
        return;
      }

      didNavigate = true;
      window.location.assign(item.productUrl);
    };

    const fallbackTimer = window.setTimeout(navigateToProduct, OUTBOUND_NAVIGATION_FALLBACK_MS);

    void logProductClick({
      productResultId: item.id,
      childId,
      source,
      mealPlanId: mealContext?.mealPlanId ?? null,
      mealPlanItemId: mealContext?.mealPlanItemId ?? null,
      provider: item.provider,
      outboundUrl: item.productUrl
    }).finally(() => {
      window.clearTimeout(fallbackTimer);
      navigateToProduct();
    });
  }

  return (
    <article className={`product-result-card ${isWarning ? "is-warning" : ""}`}>
      <div className="product-result-image-wrap">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="product-result-image-empty">이미지 없음</span>
        )}
      </div>
      <div className="product-result-copy">
        {isWarning ? (
          <div className="product-warning-badge-row">
            <span>알레르기 키워드 포함</span>
          </div>
        ) : null}
        <div>
          <h3>{item.title}</h3>
          <p>{item.mallName}</p>
        </div>
        <div className="product-result-price-row">
          <strong>{displayPrice}</strong>
          <span>검색 시점 기준</span>
        </div>
        {item.warningBadges.length > 0 ? (
          <div className="product-warning-row">
            <span>등록된 알레르기 재료가 상품명에 포함되어 있어요.</span>
          </div>
        ) : null}
        <a
          className="product-price-link"
          href={item.productUrl}
          rel="external noopener noreferrer"
          onClick={handlePriceLinkClick}
          aria-label={`${item.title} 외부 상품 페이지에서 가격 확인하기`}
        >
          가격 확인하기
        </a>
      </div>
    </article>
  );
}
