import { AppIcon, type AppIconName } from "../../../components/icons/app-icon";
import type { MealRecommendation, MealType } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";
import { MealResultDetailSection } from "./meal-result-detail-section";

const MEAL_META: Record<
  MealType,
  { iconName: AppIconName; color: string; chipBackground: string }
> = {
  breakfast: {
    iconName: "breakfast",
    color: "#4A90E2",
    chipBackground: "rgba(74, 144, 226, 0.2)"
  },
  lunch: {
    iconName: "lunch",
    color: "#6BC47D",
    chipBackground: "rgba(107, 196, 125, 0.2)"
  },
  dinner: {
    iconName: "dinner",
    color: "#FF8A7A",
    chipBackground: "rgba(255, 138, 122, 0.2)"
  }
};

interface MealResultCardProps {
  mealType: MealType;
  meal: MealRecommendation;
  expanded: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function MealResultCard({
  mealType,
  meal,
  expanded,
  disabled = false,
  onToggle
}: MealResultCardProps) {
  const meta = MEAL_META[mealType];
  const detailId = `meal-result-detail-${mealType}`;
  const statusBadges = [
    meal.isFallback ? { label: "기본 추천", tone: "warning" as const } : null,
    meal.inputStrength === "none"
      ? { label: "자동 추천", tone: "neutral" as const }
      : meal.optionalAddedIngredients.length > 0
        ? { label: "자동 보완", tone: "neutral" as const }
        : null
  ].filter(Boolean) as Array<{ label: string; tone: "warning" | "neutral" }>;
  const recipeSummary = meal.recipeSummary.slice(0, 3);

  return (
    <article
      className={`meal-result-card meal-result-card-${mealType} ${expanded ? "is-expanded" : "is-collapsed"}`}
    >
      <div className="meal-result-card-head">
        <span className="meal-result-card-icon" aria-hidden="true" style={{ color: meta.color }}>
          <AppIcon name={meta.iconName} size={24} />
        </span>
        <h2>{MEAL_LABELS[mealType]}</h2>
      </div>

      <div className="meal-result-card-body">
        <div className="meal-result-card-copy">
          <h3 style={{ color: meta.color }}>{meal.name}</h3>
          {statusBadges.length > 0 ? (
            <div className="meal-result-badge-row">
              {statusBadges.map((badge) => (
                <span
                  key={`${mealType}-${badge.label}`}
                  className={`meal-result-badge is-${badge.tone}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
          <p className="meal-result-description">
            {meal.recommendationText || meal.description}
          </p>
        </div>

        <div className="meal-result-ingredient-section">
          <span className="meal-result-section-label">사용 재료</span>
          <div className="meal-result-chip-row">
            {meal.usedIngredients.map((ingredient) => (
              <span
                key={`${mealType}-${ingredient}`}
                className="meal-result-ingredient-chip"
                style={{ backgroundColor: meta.chipBackground }}
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>

        <div className="meal-result-summary-card">
          <h4>조리법 3줄</h4>
          <ol className="meal-result-summary-list">
            {recipeSummary.map((step) => (
              <li key={`${mealType}-summary-${step}`}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="meal-result-meta">
          <div className="meal-result-meta-item">
            <span className="meal-result-meta-icon calories" aria-hidden="true">
              <AppIcon name="calories" size={16} />
            </span>
            <span className="meal-result-meta-copy">
              <span className="meal-result-meta-label">칼로리</span>
              <span className="meal-result-meta-value">
                <span className="meal-result-meta-number-group">
                  {meal.nutritionEstimate.caloriesKcal}kcal
                </span>
              </span>
            </span>
          </div>
          <div className="meal-result-meta-item">
            <span className="meal-result-meta-icon protein" aria-hidden="true">
              <AppIcon name="protein" size={16} />
            </span>
            <span className="meal-result-meta-copy">
              <span className="meal-result-meta-label">단백질</span>
              <span className="meal-result-meta-value">
                <span className="meal-result-meta-number-group">
                  {meal.nutritionEstimate.proteinG}g
                </span>
              </span>
            </span>
          </div>
          <div className="meal-result-meta-item meal-result-meta-item-cook-time">
            <span className="meal-result-meta-icon cook-time" aria-hidden="true">
              <AppIcon name="cookTime" size={16} />
            </span>
            <span className="meal-result-meta-copy">
              <span className="meal-result-meta-label">조리 시간</span>
              <span className="meal-result-meta-value">
                <span className="meal-result-meta-number-group">
                  {meal.nutritionEstimate.estimatedCookTimeMin}분
                </span>
              </span>
            </span>
          </div>
        </div>

        <button
          type="button"
          className="meal-result-toggle"
          onClick={onToggle}
          disabled={disabled}
          aria-expanded={expanded}
          aria-controls={detailId}
        >
          <span>{expanded ? "접기" : "상세보기"}</span>
          <svg
            className={expanded ? "rotated" : undefined}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded ? (
          <div id={detailId}>
            <MealResultDetailSection mealType={mealType} meal={meal} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
