import { AppIcon, type AppIconName } from "../../../components/icons/app-icon";
import type { DailyMealPlan, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

const MEAL_ICONS: Record<MealType, { iconName: AppIconName; color: string }> = {
  breakfast: { iconName: "breakfast", color: "#4A90E2" },
  lunch: { iconName: "lunch", color: "#6BC47D" },
  dinner: { iconName: "dinner", color: "#FF8A7A" }
};

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(value));
}

function getIngredientPreview(plan: DailyMealPlan, mealType: MealType) {
  const ingredients = plan.mealInputs[mealType];
  return ingredients.length > 0 ? ingredients.join(", ") : "입력한 재료가 없어요";
}

interface MealHistoryCardProps {
  plan: DailyMealPlan;
  selected: boolean;
  onSelect: () => void;
}

export function MealHistoryCard({ plan, selected, onSelect }: MealHistoryCardProps) {
  return (
    <article className={`history-figma-card ${selected ? "selected" : ""}`}>
      <button
        type="button"
        className="history-figma-card-button"
        onClick={onSelect}
        aria-label={`${formatDateLabel(plan.createdAt)} 식단 불러오기`}
      >
        <div className="history-figma-card-head">
          <div className="history-figma-date">
            <span className="history-figma-date-icon" aria-hidden="true">
              <AppIcon name="weekday" size={20} />
            </span>
            <strong>{formatDateLabel(plan.createdAt)}</strong>
          </div>
          <span className="history-figma-chevron" aria-hidden="true">
            <ChevronRightIcon />
          </span>
        </div>

        <div className="history-figma-card-body">
          {MEAL_TYPES.map((mealType) => (
            <div key={`${plan.id}-${mealType}`} className="history-figma-line">
              <span className="history-figma-line-label">
                <span
                  className="history-figma-line-icon"
                  aria-hidden="true"
                  style={{ color: MEAL_ICONS[mealType].color }}
                >
                  <AppIcon name={MEAL_ICONS[mealType].iconName} size={14} />
                </span>
                <span>{MEAL_LABELS[mealType]}:</span>
              </span>
              <span className="history-figma-line-value">{getIngredientPreview(plan, mealType)}</span>
            </div>
          ))}
        </div>
      </button>
    </article>
  );
}
