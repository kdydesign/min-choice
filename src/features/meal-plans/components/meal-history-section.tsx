import { EmptyState } from "../../../components/empty-state";
import type { ChildProfile, DailyMealPlan } from "../../../types/domain";
import { MealHistoryCard } from "./meal-history-card";

interface MealHistorySectionProps {
  selectedChild: ChildProfile | null;
  history: DailyMealPlan[];
  selectedPlanId: string;
  onLoad: (planId: string) => void;
  onCreatePlan?: () => void;
}

export function MealHistorySection({
  selectedChild,
  history,
  selectedPlanId,
  onLoad,
  onCreatePlan
}: MealHistorySectionProps) {
  if (!selectedChild) {
    return (
      <div className="history-figma-state-card">
        <EmptyState
          title="아이를 먼저 선택해 주세요"
          description="선택한 아이의 식단 이력이 여기에 표시돼요."
        />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-figma-state-card">
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
      </div>
    );
  }

  return (
    <div className="history-figma-list">
      {history.map((plan) => (
        <MealHistoryCard
          key={plan.id}
          plan={plan}
          selected={plan.id === selectedPlanId}
          onSelect={() => onLoad(plan.id)}
        />
      ))}
    </div>
  );
}
