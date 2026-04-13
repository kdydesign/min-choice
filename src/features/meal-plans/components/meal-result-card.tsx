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
          <p className="meal-result-description">
            {meal.recommendationText || meal.description}
          </p>
        </div>

        <div className="meal-result-chip-row">
          {meal.inputIngredients.map((ingredient) => (
            <span
              key={`${mealType}-${ingredient}`}
              className="meal-result-ingredient-chip"
              style={{ backgroundColor: meta.chipBackground }}
            >
              {ingredient}
            </span>
          ))}
        </div>

        <div className="meal-result-stats">
          <span className="meal-result-stat">
            <span className="meal-result-stat-icon calories" aria-hidden="true">
              <AppIcon name="calories" size={16} />
            </span>
            <span>{meal.calories}kcal</span>
          </span>
          <span className="meal-result-stat">
            <span className="meal-result-stat-icon protein" aria-hidden="true">
              <AppIcon name="protein" size={16} />
            </span>
            <span>단백질 {meal.protein}g</span>
          </span>
          <span className="meal-result-stat">
            <span className="meal-result-stat-icon cook-time" aria-hidden="true">
              <AppIcon name="cookTime" size={16} />
            </span>
            <span>{meal.cookTimeMinutes}분</span>
          </span>
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
