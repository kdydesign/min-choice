import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppIcon } from "../../../components/icons/app-icon";
import type { MealRecommendation, MealType } from "../../../types/domain";
import { buildMealProductSearchQuery } from "../../shopping/utils/build-meal-product-search-query";

interface MealProductSearchActionProps {
  mealType: MealType;
  meal: MealRecommendation;
  childId: string;
  mealPlanId?: string | null;
  mealPlanItemId?: string | null;
  disabled?: boolean;
}

export function MealProductSearchAction({
  mealType,
  meal,
  childId,
  mealPlanId = null,
  mealPlanItemId = null,
  disabled = false
}: MealProductSearchActionProps) {
  const navigate = useNavigate();
  const searchLink = useMemo(
    () =>
      buildMealProductSearchQuery({
        mealType,
        meal,
        mealPlanId,
        mealPlanItemId
      }),
    [meal, mealPlanId, mealPlanItemId, mealType]
  );

  function handleClick() {
    const params = new URLSearchParams();

    params.set("q", searchLink.query);
    params.set("category", searchLink.category);
    params.set("source", searchLink.source);
    params.set("childId", childId);
    params.set("mealType", searchLink.mealContext.mealType);
    params.set("originMenuName", searchLink.mealContext.originMenuName);

    if (searchLink.mealContext.mealPlanId) {
      params.set("mealPlanId", searchLink.mealContext.mealPlanId);
    }

    if (searchLink.mealContext.mealPlanItemId) {
      params.set("mealPlanItemId", searchLink.mealContext.mealPlanItemId);
    }

    navigate(`/shopping?${params.toString()}`);
  }

  const ariaLabel = `${searchLink.ctaLabel} 검색 화면으로 이동`;

  return (
    <button
      type="button"
      className="meal-product-search-action"
      disabled={disabled}
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      <span className="meal-product-search-action-main">
        <span className="meal-product-search-action-icon" aria-hidden="true">
          <AppIcon name="navShopping" size={18} />
        </span>
        <span className="meal-product-search-action-label">{searchLink.ctaLabel}</span>
      </span>
      <span className="meal-product-search-action-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M9 5L15 12L9 19"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
