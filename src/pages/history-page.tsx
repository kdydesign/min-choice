import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CommonBottomMenu } from "../components/common-bottom-menu";
import { ErrorState } from "../components/error-state";
import { SessionCheckingOverlay } from "../features/auth/components/session-checking-overlay";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import { MealHistorySection } from "../features/meal-plans/components/meal-history-section";
import {
  getMealPlanById,
  listMealPlansByChild
} from "../features/meal-plans/api/meal-plan-repository";
import { TodayMealResultScreen } from "../features/meal-plans/components/today-meal-result-screen";
import { useAppStore } from "../store/use-app-store";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatHistoryTitle(value: string) {
  const date = new Date(value);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

export function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mealPlanId } = useParams<{ mealPlanId?: string }>();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const selectedPlanId = useAppStore((state) => state.selectedPlanId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);
  const isDetailView = Boolean(mealPlanId);

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
    enabled: Boolean(selectedChild) && !isDetailView
  });

  const {
    data: detailPlan = null,
    error: detailError,
    isLoading: isDetailLoading,
    refetch: refetchDetail
  } = useQuery({
    queryKey: ["meal-plan", mealPlanId],
    queryFn: () => getMealPlanById(mealPlanId ?? ""),
    enabled: isDetailView,
    placeholderData: () => {
      const cachedHistory = queryClient.getQueryData<import("../types/domain").DailyMealPlan[]>([
        "meal-plans",
        selectedChild?.id
      ]);

      return cachedHistory?.find((plan) => plan.id === mealPlanId) ?? null;
    }
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
    if (!isDetailView) {
      return;
    }

    if (detailPlan?.id) {
      setSelectedPlan(detailPlan.id);
    }
  }, [detailPlan?.id, isDetailView, setSelectedPlan]);

  useEffect(() => {
    if (isDetailView) {
      return;
    }

    if (!history.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlan(history[0]?.id ?? "");
    }
  }, [history, isDetailView, selectedPlanId, setSelectedPlan]);

  const selectedPlan = useMemo(
    () => history.find((plan) => plan.id === selectedPlanId) ?? history[0] ?? null,
    [history, selectedPlanId]
  );

  const formattedDetailTitle = useMemo(
    () => (detailPlan ? formatHistoryTitle(detailPlan.createdAt) : ""),
    [detailPlan]
  );

  const pageError = isDetailView
    ? detailError
      ? getErrorMessage(detailError, "저장된 식단 상세를 불러오지 못했어요.")
      : null
    : (profilesError ? getErrorMessage(profilesError, "아이 프로필을 불러오지 못했어요.") : null) ??
      (historyError ? getErrorMessage(historyError, "식단 이력을 불러오지 못했어요.") : null);
  const isPageLoading = isDetailView
    ? isDetailLoading
    : isProfilesLoading || (Boolean(selectedChild) && isHistoryLoading);

  if (isDetailView) {
    return (
      <div className="meal-result-page">
        {pageError ? (
          <ErrorState
            title="히스토리 식단을 불러오지 못했어요"
            description={pageError}
            action={
              <button
                type="button"
                className="secondary small"
                onClick={() => {
                  void refetchDetail();
                }}
              >
                다시 시도
              </button>
            }
          />
        ) : null}

        {isPageLoading && !pageError ? (
          <SessionCheckingOverlay
            title="지난 식단을 불러오는 중..."
            description="선택한 기록의 상세 식단 정보를 다시 준비하고 있어요."
          />
        ) : null}

        {!pageError && !isPageLoading && detailPlan ? (
          <TodayMealResultScreen
            childName={detailPlan.childName}
            title={formattedDetailTitle}
            subtitle={`${detailPlan.childName}를 위한 맞춤 식단입니다`}
            secondaryActionLabel={null}
            plan={detailPlan}
            onBack={() => navigate("/history")}
          />
        ) : null}

        {!pageError && !isPageLoading && !detailPlan ? (
          <ErrorState
            title="식단 기록을 찾지 못했어요"
            description="선택한 히스토리 기록이 없거나 접근할 수 없어요."
            action={
              <button type="button" className="secondary small" onClick={() => navigate("/history")}>
                목록으로 돌아가기
              </button>
            }
          />
        ) : null}

        <CommonBottomMenu />
      </div>
    );
  }

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
          <SessionCheckingOverlay
            title="최근 식단 준비 중..."
            description="선택한 아이의 저장된 식단 기록을 불러오는 중이에요."
          />
        ) : null}

        {!pageError && !isPageLoading ? (
          <MealHistorySection
            selectedChild={selectedChild}
            history={history}
            selectedPlanId={selectedPlan?.id ?? ""}
            onLoad={(planId) => {
              setSelectedPlan(planId);
              navigate(`/history/${planId}`);
            }}
          />
        ) : null}
      </main>

      <CommonBottomMenu />
    </div>
  );
}
