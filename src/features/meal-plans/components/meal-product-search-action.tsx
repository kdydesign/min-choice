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

  return (
    <button
      type="button"
      className="meal-product-search-action"
      disabled={disabled}
      onClick={handleClick}
    >
      <span className="meal-product-search-action-main">
        <AppIcon name="navShopping" size={16} />
        <span>{searchLink.ctaLabel}</span>
      </span>
      <span className="meal-product-search-action-subtitle">
        직접 만들기 어렵다면 비슷한 기성제품을 찾아볼 수 있어요
      </span>
    </button>
  );
}
