import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CommonBottomMenu } from "../components/common-bottom-menu";
import { ErrorState } from "../components/error-state";
import { LoadingState } from "../components/loading-state";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import { MealHistorySection } from "../features/meal-plans/components/meal-history-section";
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

  return (
    <div className="history-figma-page">
      <section className="history-figma-header">
        <button
          type="button"
          className="history-figma-profile-button"
          onClick={() => navigate("/profile")}
          aria-label="아이 프로필로 이동"
        >
          <span className="history-figma-profile-avatar" aria-hidden="true">
            👶
          </span>
          <span className="history-figma-profile-copy">
            <strong>{selectedChild ? `${selectedChild.name}의 식단 이력` : "아이의 식단 이력"}</strong>
            <span>{selectedChild ? `${selectedChild.ageMonths}개월` : "아이를 먼저 선택해 주세요"}</span>
          </span>
        </button>
      </section>

      <main className="history-figma-content">
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
            description="선택한 아이의 저장된 식단 기록을 불러오는 중이에요."
          />
        ) : null}

        {!pageError && !isPageLoading ? (
          <MealHistorySection
            selectedChild={selectedChild}
            history={history}
            selectedPlanId={selectedPlan?.id ?? ""}
            onLoad={(planId) => setSelectedPlan(planId)}
            onCreatePlan={() => navigate("/")}
          />
        ) : null}
      </main>

      <CommonBottomMenu />
    </div>
  );
}
