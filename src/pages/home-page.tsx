import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppFrame } from "../components/app-frame";
import { ErrorState } from "../components/error-state";
import { LoadingState } from "../components/loading-state";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import {
  clearMealDraft,
  getMealDraft,
  hasMealDraft,
  saveMealDraft
} from "../services/storage/meal-draft-storage";
import type { DailyMealPlan, MealDraft, MealType } from "../types/domain";
import { emptyMealDraft, getIngredientConflicts } from "../features/ingredients/lib/ingredient-utils";
import { useAppStore } from "../store/use-app-store";
import { MealInputSection } from "../features/meal-plans/components/meal-input-section";
import {
  listMealPlansByChild,
  saveMealPlan,
  type SaveMealPlanInput
} from "../features/meal-plans/api/meal-plan-repository";
import { generateMealPlan } from "../features/meal-plans/api/generate-meal-plan-service";
import { MEAL_TYPES } from "../types/domain";
import { normalizeIngredients } from "../features/ingredients/api/normalize-ingredients-service";
import { TodayMealResultScreen } from "../features/meal-plans/components/today-meal-result-screen";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

type GenerationStage = "normalizing" | "generating" | "saving";

const GENERATION_STAGE_LABELS: Record<GenerationStage, string> = {
  normalizing: "재료 이름을 정리하고 있어요.",
  generating: "식단을 만들고 있어요.",
  saving: "추천 식단을 저장하고 있어요."
};

const GENERATION_STAGE_PROGRESS: Record<GenerationStage, number> = {
  normalizing: 20,
  generating: 80,
  saving: 100
};

function hasAnyMealInput(draft: MealDraft) {
  return MEAL_TYPES.some((mealType) => draft[mealType].length > 0);
}

function areMealInputsEqual(draft: MealDraft, plan: DailyMealPlan | null) {
  if (!plan) {
    return !hasAnyMealInput(draft);
  }

  return MEAL_TYPES.every((mealType) => {
    const left = draft[mealType];
    const right = plan.mealInputs[mealType];

    if (left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => item === right[index]);
  });
}

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);

  const [mealDraft, setMealDraft] = useState<MealDraft>(emptyMealDraft());
  const [actionError, setActionError] = useState<string | null>(null);
  const [hasSeededInitialDraft, setHasSeededInitialDraft] = useState(false);
  const [todayView, setTodayView] = useState<"input" | "result">("input");
  const [generationStage, setGenerationStage] = useState<GenerationStage | null>(null);

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
    if (!selectedChild) {
      setMealDraft(emptyMealDraft());
      setHasSeededInitialDraft(false);
      return;
    }

    setHasSeededInitialDraft(hasMealDraft(selectedChild.id));
    setMealDraft(getMealDraft(selectedChild.id));
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedChild || hasSeededInitialDraft) {
      return;
    }

    if (!history[0]) {
      setHasSeededInitialDraft(true);
      return;
    }

    setMealDraft({
      breakfast: history[0].mealInputs.breakfast,
      lunch: history[0].mealInputs.lunch,
      dinner: history[0].mealInputs.dinner,
      updatedAt: history[0].createdAt
    });
    setHasSeededInitialDraft(true);
  }, [hasSeededInitialDraft, history, selectedChild]);

  const savePlanMutation = useMutation({
    mutationFn: saveMealPlan,
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: ["meal-plans", plan.childId] });
      setSelectedPlan(plan.id);
      setActionError(null);
    }
  });

  const latestPlan = history[0] ?? null;
  const hasPendingChanges = useMemo(() => !areMealInputsEqual(mealDraft, latestPlan), [latestPlan, mealDraft]);
  const visiblePlan = hasPendingChanges ? null : latestPlan;
  const isGenerating = generationStage !== null;
  const generationLabel = generationStage ? GENERATION_STAGE_LABELS[generationStage] : null;
  const generationProgressValue = generationStage ? GENERATION_STAGE_PROGRESS[generationStage] : 0;

  const allergyWarnings = useMemo<Record<MealType, string[]>>(
    () => ({
      breakfast: selectedChild ? getIngredientConflicts(mealDraft.breakfast, selectedChild.allergies) : [],
      lunch: selectedChild ? getIngredientConflicts(mealDraft.lunch, selectedChild.allergies) : [],
      dinner: selectedChild ? getIngredientConflicts(mealDraft.dinner, selectedChild.allergies) : []
    }),
    [mealDraft, selectedChild]
  );

  async function handleGeneratePlan() {
    if (!selectedChild || isGenerating) {
      return;
    }

    try {
      setActionError(null);
      setGenerationStage("normalizing");

      const normalizedDraft = {
        breakfast: (await normalizeIngredients(mealDraft.breakfast)).map((item) => item.standardKey),
        lunch: (await normalizeIngredients(mealDraft.lunch)).map((item) => item.standardKey),
        dinner: (await normalizeIngredients(mealDraft.dinner)).map((item) => item.standardKey),
        updatedAt: new Date().toISOString()
      } satisfies MealDraft;

      setGenerationStage("generating");

      const plan = await generateMealPlan({
        child: selectedChild,
        mealInputs: {
          breakfast: normalizedDraft.breakfast,
          lunch: normalizedDraft.lunch,
          dinner: normalizedDraft.dinner
        }
      });

      setGenerationStage("saving");

      const nextPlanPayload: SaveMealPlanInput = {
        plan,
        sourceMealInputs: {
          breakfast: mealDraft.breakfast,
          lunch: mealDraft.lunch,
          dinner: mealDraft.dinner
        }
      };

      const savedPlan = await savePlanMutation.mutateAsync(nextPlanPayload);
      saveMealDraft(selectedChild.id, normalizedDraft);
      setMealDraft(normalizedDraft);
      setHasSeededInitialDraft(true);
      setSelectedPlan(savedPlan.id);
      setTodayView("result");
    } catch (error) {
      setActionError(getErrorMessage(error, "식단을 생성하지 못했어요."));
    } finally {
      setGenerationStage(null);
    }
  }

  function handleChangeMealDraft(mealType: MealType, ingredients: string[]) {
    if (!selectedChild || isGenerating) {
      return;
    }

    const nextDraft = {
      ...mealDraft,
      [mealType]: ingredients,
      updatedAt: new Date().toISOString()
    };

    setMealDraft(nextDraft);
    saveMealDraft(selectedChild.id, nextDraft);
    setHasSeededInitialDraft(true);
    setActionError(null);
  }

  function handleClearMealDraft() {
    if (!selectedChild || isGenerating) {
      return;
    }

    clearMealDraft(selectedChild.id);
    setMealDraft(emptyMealDraft());
    setHasSeededInitialDraft(true);
    setActionError(null);
  }

  const pageError =
    actionError ??
    (profilesError ? getErrorMessage(profilesError, "아이 프로필을 불러오지 못했어요.") : null) ??
    (historyError ? getErrorMessage(historyError, "식단 이력을 불러오지 못했어요.") : null);
  const isPageLoading = isProfilesLoading || (Boolean(selectedChild) && isHistoryLoading);

  useEffect(() => {
    if (!selectedChild) {
      setTodayView("input");
    }
  }, [selectedChild]);

  useEffect(() => {
    if (hasPendingChanges) {
      setTodayView("input");
    }
  }, [hasPendingChanges]);

  if (todayView === "result") {
    return (
      <AppFrame
        title="오늘의 식단"
        subtitle="집에 있는 재료를 끼니별로 적으면, 하루 3끼를 바로 추천해요."
        showIntro={false}
        showTopbar={false}
      >
        {pageError ? (
          <ErrorState
            title="오늘 식단 화면을 준비하지 못했어요"
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
            title="오늘 식단 화면을 준비하고 있어요"
            description="선택한 아이 정보와 최근 식단을 불러오는 중이에요."
          />
        ) : null}

        {!pageError && !isPageLoading ? (
          <TodayMealResultScreen
            childName={selectedChild?.name ?? ""}
            plan={visiblePlan}
            isGenerating={isGenerating}
            loadingLabel={generationLabel ?? undefined}
            progressValue={generationProgressValue}
            onBack={() => {
              if (isGenerating) {
                return;
              }

              setTodayView("input");
            }}
            onRegenerate={selectedChild ? handleGeneratePlan : undefined}
          />
        ) : null}
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title="오늘의 식단"
      subtitle="집에 있는 재료를 끼니별로 적으면, 하루 3끼를 바로 추천해요."
      showIntro={false}
      showTopbar={false}
    >
      <section className="meal-plan-page-header">
        <div className="meal-plan-page-header-bar">
          <button
            type="button"
            className="meal-plan-page-header-side"
            onClick={() => {
              if (isGenerating) {
                return;
              }

              navigate("/profile");
            }}
            aria-label="아이 프로필로 이동"
            disabled={isGenerating}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="meal-plan-page-brand">
            <div className="meal-plan-page-brand-mark" aria-hidden="true">
              👶
            </div>
            <h1>베베 초이스</h1>
          </div>
          <div className="meal-plan-page-header-placeholder" aria-hidden="true" />
        </div>
      </section>

      {selectedChild ? (
        <section className="meal-plan-selected-child-card">
          <div className="meal-plan-selected-child-avatar" aria-hidden="true">
            👶
          </div>
          <div className="meal-plan-selected-child-copy">
            <strong>{selectedChild.name}</strong>
            <span>{selectedChild.ageMonths}개월</span>
          </div>
          <button
            type="button"
            className="meal-plan-selected-child-action"
            onClick={() => {
              if (isGenerating) {
                return;
              }

              navigate("/profile");
            }}
            aria-label="아이 프로필 수정"
            disabled={isGenerating}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </section>
      ) : (
        <section className="figma-screen-head">
          <h1>오늘의 식단</h1>
          <p>아이를 먼저 선택해 주세요</p>
        </section>
      )}

      {pageError ? (
        <ErrorState
          title="오늘 식단 화면을 준비하지 못했어요"
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
          title="오늘 식단 화면을 준비하고 있어요"
          description="선택한 아이 정보와 최근 식단을 불러오는 중이에요."
        />
      ) : null}

      {selectedChild ? (
        <section className="figma-screen-head meal-plan-title-copy">
          <h2>오늘의 식단</h2>
          <p>{selectedChild.name}를 위한 맞춤 식단입니다</p>
        </section>
      ) : null}

      {hasPendingChanges ? (
        <div className="notice warning">
          입력한 재료가 바뀌었어요. 이전 추천은 숨기고 있고, 새로 생성하면 오늘 식단이 갱신돼요.
        </div>
      ) : null}

      <MealInputSection
        panelId="meal-input-panel"
        selectedChild={selectedChild}
        draft={mealDraft}
        allergyWarnings={allergyWarnings}
        onChange={handleChangeMealDraft}
        onClear={handleClearMealDraft}
        onGenerate={handleGeneratePlan}
        isGenerating={isGenerating}
        loadingLabel={generationLabel ?? undefined}
        progressValue={generationProgressValue}
      />
    </AppFrame>
  );
}
