import { Panel } from "../../../components/panel";
import { EmptyState } from "../../../components/empty-state";
import type { ChildProfile, DailyMealPlan } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

interface MealHistorySectionProps {
  selectedChild: ChildProfile | null;
  history: DailyMealPlan[];
  selectedPlanId: string;
  onLoad: (planId: string) => void;
  onCreatePlan?: () => void;
  onViewSelectedDetails?: () => void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getHistoryLabel(value: string, index: number) {
  const target = new Date(value);
  const today = new Date();

  if (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  ) {
    return "오늘";
  }

  return index < 3 ? "최근" : "이전";
}

function groupHistory(history: DailyMealPlan[]) {
  return history.reduce(
    (groups, plan, index) => {
      const label = getHistoryLabel(plan.createdAt, index);
      groups[label].push(plan);
      return groups;
    },
    {
      오늘: [] as DailyMealPlan[],
      최근: [] as DailyMealPlan[],
      이전: [] as DailyMealPlan[]
    }
  );
}

export function MealHistorySection({
  selectedChild,
  history,
  selectedPlanId,
  onLoad,
  onCreatePlan,
  onViewSelectedDetails
}: MealHistorySectionProps) {
  const groupedHistory = groupHistory(history);

  return (
    <Panel eyebrow="History" title="최근 식단" subtitle="아이별 생성 기록을 다시 불러오기">
      {!selectedChild ? (
        <EmptyState
          title="아이를 먼저 선택해 주세요"
          description="선택한 아이의 식단 이력이 여기에 표시돼요."
        />
      ) : history.length === 0 ? (
        <EmptyState
          title="아직 저장된 식단이 없어요"
          description={`${selectedChild.name}의 최근 식단이 아직 없어요. 오늘 식단을 먼저 만들어 보세요.`}
          action={
            onCreatePlan ? (
              <button type="button" className="primary small" onClick={onCreatePlan}>
                오늘 식단 만들기
              </button>
            ) : null
          }
        />
      ) : (
        <div className="history-list">
          {(["오늘", "최근", "이전"] as const).map((groupLabel) =>
            groupedHistory[groupLabel].length > 0 ? (
              <section key={groupLabel} className="history-group">
                <div className="history-group-head">
                  <div>
                    <p className="eyebrow">Timeline</p>
                    <h3>{groupLabel}</h3>
                  </div>
                  <span className="inline-chip">{groupedHistory[groupLabel].length}건</span>
                </div>

                <div className="history-group-list">
                  {groupedHistory[groupLabel].map((plan) => (
                    <article
                      key={plan.id}
                      className={`history-card ${plan.id === selectedPlanId ? "selected" : ""}`}
                    >
                      <div className="history-head">
                        <div>
                          <div className="history-card-meta">
                            <h3>{formatDateTime(plan.createdAt)}</h3>
                          </div>
                          <div className="history-chip-row">
                            {MEAL_TYPES.map((mealType) => (
                              <span key={`${plan.id}-${mealType}`} className="inline-chip">
                                {MEAL_LABELS[mealType]} · {plan.results[mealType].name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="history-actions">
                          <button
                            type="button"
                            className={plan.id === selectedPlanId ? "primary small" : "ghost small"}
                            onClick={() => onLoad(plan.id)}
                          >
                            {plan.id === selectedPlanId ? "보고 있음" : "불러오기"}
                          </button>
                          {plan.id === selectedPlanId && onViewSelectedDetails ? (
                            <button
                              type="button"
                              className="secondary small"
                              onClick={onViewSelectedDetails}
                            >
                              상세 결과 보기
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      )}
    </Panel>
  );
}
