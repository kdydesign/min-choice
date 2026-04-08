import { EmptyState } from "../../../components/empty-state";
import type { ChildProfile, DailyMealPlan } from "../../../types/domain";
import { MealHistoryEmptyView } from "./meal-history-empty-view";
import { MealHistoryCard } from "./meal-history-card";

interface MealHistorySectionProps {
  selectedChild: ChildProfile | null;
  history: DailyMealPlan[];
  selectedPlanId: string;
  onLoad: (planId: string) => void;
}

export function MealHistorySection({
  selectedChild,
  history,
  selectedPlanId,
  onLoad
}: MealHistorySectionProps) {
  const hasHistory = history.length > 0;
  const isEmptyHistory = Boolean(selectedChild) && !hasHistory;

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

  if (isEmptyHistory) {
    return <MealHistoryEmptyView />;
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
