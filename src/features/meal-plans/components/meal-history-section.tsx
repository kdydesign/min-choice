import { Panel } from "../../../components/panel";
import type { ChildProfile, DailyMealPlan } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

interface MealHistorySectionProps {
  selectedChild: ChildProfile | null;
  history: DailyMealPlan[];
  selectedPlanId: string;
  onLoad: (planId: string) => void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function MealHistorySection({
  selectedChild,
  history,
  selectedPlanId,
  onLoad
}: MealHistorySectionProps) {
  return (
    <Panel eyebrow="History" title="최근 식단" subtitle="아이별 생성 이력">
      {!selectedChild ? (
        <div className="empty-state">선택한 아이의 식단 이력이 여기에 표시돼요.</div>
      ) : history.length === 0 ? (
        <div className="empty-state">{selectedChild.name}의 식단 이력이 아직 없어요.</div>
      ) : (
        <div className="history-list">
          {history.map((plan) => (
            <article key={plan.id} className="history-card">
              <div className="history-head">
                <div>
                  <h3>{formatDateTime(plan.createdAt)}</h3>
                  <p className="subtle">
                    {MEAL_TYPES.map(
                      (mealType) => `${MEAL_LABELS[mealType]}: ${plan.results[mealType].name}`
                    ).join(" · ")}
                  </p>
                </div>
                <div className="history-actions">
                  <button
                    type="button"
                    className={plan.id === selectedPlanId ? "primary small" : "ghost small"}
                    onClick={() => onLoad(plan.id)}
                  >
                    {plan.id === selectedPlanId ? "보고 있음" : "불러오기"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
