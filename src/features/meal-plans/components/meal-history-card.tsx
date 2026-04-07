import type { DailyMealPlan, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙"
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5.5 2.917V5M14.5 2.917V5M3.417 7.083h13.166M4.667 16.667h10.666A1.25 1.25 0 0 0 16.583 15.417V5A1.25 1.25 0 0 0 15.333 3.75H4.667A1.25 1.25 0 0 0 3.417 5v10.417a1.25 1.25 0 0 0 1.25 1.25Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
              <CalendarIcon />
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
                {MEAL_EMOJIS[mealType]} {MEAL_LABELS[mealType]}:
              </span>
              <span className="history-figma-line-value">{getIngredientPreview(plan, mealType)}</span>
            </div>
          ))}
        </div>
      </button>
    </article>
  );
}
