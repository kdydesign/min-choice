import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppFrame } from "../components/app-frame";
import { ChildProfileCard } from "../components/child-profile-card";
import { ErrorState } from "../components/error-state";
import { LoadingState } from "../components/loading-state";
import { ChildSwitcher } from "../features/children/components/child-switcher";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import { MealHistorySection } from "../features/meal-plans/components/meal-history-section";
import { MealResultsSection } from "../features/meal-plans/components/meal-results-section";
import { listMealPlansByChild } from "../features/meal-plans/api/meal-plan-repository";
import { useAppStore } from "../store/use-app-store";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function HistoryPage() {
  const navigate = useNavigate();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const selectedPlanId = useAppStore((state) => state.selectedPlanId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);

  const {
    data: profiles = [],
    error: profilesError,
    isLoading: isProfilesLoading,
    refetch: refetchProfiles
  } = useQuery({
    queryKey: ["children"],
    queryFn: listChildProfiles
  });

  const selectedChild = useMemo(
    () => profiles.find((profile) => profile.id === selectedChildId) ?? null,
    [profiles, selectedChildId]
  );

  const {
    data: history = [],
    error: historyError,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ["meal-plans", selectedChild?.id],
    queryFn: () => (selectedChild ? listMealPlansByChild(selectedChild.id) : Promise.resolve([])),
    enabled: Boolean(selectedChild)
  });

  useEffect(() => {
    if (profiles.length === 0) {
      setSelectedChild("");
      setSelectedPlan("");
      return;
    }

    if (!selectedChildId || !profiles.some((profile) => profile.id === selectedChildId)) {
      setSelectedChild(profiles[0].id);
    }
  }, [profiles, selectedChildId, setSelectedChild, setSelectedPlan]);

  useEffect(() => {
    if (!history.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlan(history[0]?.id ?? "");
    }
  }, [history, selectedPlanId, setSelectedPlan]);

  const selectedPlan = useMemo(
    () => history.find((plan) => plan.id === selectedPlanId) ?? history[0] ?? null,
    [history, selectedPlanId]
  );

  const pageError =
    (profilesError ? getErrorMessage(profilesError, "아이 프로필을 불러오지 못했어요.") : null) ??
    (historyError ? getErrorMessage(historyError, "식단 이력을 불러오지 못했어요.") : null);
  const isPageLoading = isProfilesLoading || (Boolean(selectedChild) && isHistoryLoading);

  function handleScrollToSelectedResult() {
    document.getElementById("history-selected-result")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  return (
    <AppFrame
      title="최근 식단"
      subtitle="저장된 하루 식단을 다시 열어 보고, 끼니별 결과를 빠르게 비교할 수 있어요."
      context={
        selectedChild ? (
          <ChildProfileCard
            child={selectedChild}
            label="History"
            tone="neutral"
            helperText={`저장된 식단 이력 ${history.length}건을 최신순으로 보여주고 있어요.`}
          />
        ) : null
      }
    >
      {pageError ? (
        <ErrorState
          title="최근 식단을 불러오지 못했어요"
          description={pageError}
          action={
            <button
              type="button"
              className="secondary small"
              onClick={() => {
                void refetchProfiles();
                void refetchHistory();
              }}
            >
              다시 시도
            </button>
          }
        />
      ) : null}

      {isPageLoading && !pageError ? (
        <LoadingState
          title="최근 식단을 준비하고 있어요"
          description="선택한 아이의 저장된 식단 기록을 차례대로 불러오는 중이에요."
        />
      ) : null}

      <ChildSwitcher
        profiles={profiles}
        selectedChildId={selectedChildId}
        onSelect={(childId) => {
          setSelectedChild(childId);
          setSelectedPlan("");
        }}
      />

      <MealHistorySection
        selectedChild={selectedChild}
        history={history}
        selectedPlanId={selectedPlan?.id ?? ""}
        onLoad={(planId) => setSelectedPlan(planId)}
        onCreatePlan={() => navigate("/")}
        onViewSelectedDetails={selectedPlan ? handleScrollToSelectedResult : undefined}
      />

      <MealResultsSection panelId="history-selected-result" plan={selectedPlan} />
    </AppFrame>
  );
}
