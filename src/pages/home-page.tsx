import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CommonBottomMenu } from "../components/common-bottom-menu";
import { CommonHeader } from "../components/common-header";
import { ErrorState } from "../components/error-state";
import { AppIcon } from "../components/icons/app-icon";
import { SessionCheckingOverlay } from "../features/auth/components/session-checking-overlay";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import { ChildCardMenuButton } from "../features/children/components/child-card-menu-button";
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
import type { MealGenerationStage } from "../features/meal-plans/components/meal-generation-progress";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

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
  const [generationStage, setGenerationStage] = useState<MealGenerationStage | null>(null);
  const [resultPlan, setResultPlan] = useState<DailyMealPlan | null>(null);
  const [resultSourceMealInputs, setResultSourceMealInputs] = useState<Record<MealType, string[]> | null>(null);
  const [resultSaveError, setResultSaveError] = useState<string | null>(null);
  const [resultSaveSuccess, setResultSaveSuccess] = useState<string | null>(null);
  const [isResultSaved, setIsResultSaved] = useState(false);

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
    mutationFn: saveMealPlan
  });

  const latestPlan = history[0] ?? null;
  const hasPendingChanges = useMemo(() => !areMealInputsEqual(mealDraft, latestPlan), [latestPlan, mealDraft]);
  const isGenerating = generationStage !== null;

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

      const sourceMealInputs = {
        breakfast: mealDraft.breakfast,
        lunch: mealDraft.lunch,
        dinner: mealDraft.dinner
      } satisfies Record<MealType, string[]>;

      const nextPlanPayload: SaveMealPlanInput = {
        plan,
        sourceMealInputs
      };

      setResultPlan(nextPlanPayload.plan);
      setResultSourceMealInputs(sourceMealInputs);
      setResultSaveError(null);
      setResultSaveSuccess(null);
      setIsResultSaved(false);
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
    setResultSaveError(null);
    setResultSaveSuccess(null);
    setIsResultSaved(false);
  }

  function handleClearMealDraft() {
    if (!selectedChild || isGenerating) {
      return;
    }

    clearMealDraft(selectedChild.id);
    setMealDraft(emptyMealDraft());
    setHasSeededInitialDraft(true);
    setActionError(null);
    setResultSaveError(null);
    setResultSaveSuccess(null);
    setIsResultSaved(false);
  }

  async function handleSavePlan() {
    if (!selectedChild || !resultPlan || savePlanMutation.isPending || isResultSaved) {
      return;
    }

    try {
      setResultSaveError(null);
      const savedPlan = await savePlanMutation.mutateAsync({
        plan: resultPlan,
        sourceMealInputs: resultSourceMealInputs ?? mealDraft
      });

      queryClient.setQueryData<DailyMealPlan[]>(
        ["meal-plans", selectedChild.id],
        (current = []) =>
          [savedPlan, ...current.filter((plan) => plan.id !== savedPlan.id)].sort(
            (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          )
      );

      await queryClient.invalidateQueries({ queryKey: ["meal-plans", selectedChild.id] });

      const normalizedDraft = {
        breakfast: savedPlan.mealInputs.breakfast,
        lunch: savedPlan.mealInputs.lunch,
        dinner: savedPlan.mealInputs.dinner,
        updatedAt: savedPlan.createdAt
      } satisfies MealDraft;

      saveMealDraft(selectedChild.id, normalizedDraft);
      setMealDraft(normalizedDraft);
      setHasSeededInitialDraft(true);
      setSelectedPlan(savedPlan.id);
      setResultPlan(savedPlan);
      setResultSaveSuccess("오늘 식단을 저장했어요.");
      setIsResultSaved(true);
      setActionError(null);
    } catch (error) {
      setResultSaveError(getErrorMessage(error, "식단을 저장하지 못했어요."));
      setResultSaveSuccess(null);
    }
  }

  const pageError =
    actionError ??
    (profilesError ? getErrorMessage(profilesError, "아이 프로필을 불러오지 못했어요.") : null) ??
    (historyError ? getErrorMessage(historyError, "식단 이력을 불러오지 못했어요.") : null);
  const isPageLoading = isProfilesLoading || (Boolean(selectedChild) && isHistoryLoading);

  useEffect(() => {
    if (!selectedChild) {
      setTodayView("input");
      setResultPlan(null);
      setResultSourceMealInputs(null);
      setResultSaveError(null);
      setResultSaveSuccess(null);
      setIsResultSaved(false);
    }
  }, [selectedChild]);

  useEffect(() => {
    if (todayView === "result" && resultPlan) {
      return;
    }

    if (hasPendingChanges) {
      setTodayView("input");
    }
  }, [hasPendingChanges, resultPlan, todayView]);

  if (todayView === "result") {
    return (
      <div className="meal-result-page">
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
          <SessionCheckingOverlay
            title="오늘 식단 화면 준비 중..."
            description="선택한 아이 정보와 최근 식단을 불러오는 중이에요."
          />
        ) : null}

        {!pageError && !isPageLoading ? (
          <TodayMealResultScreen
            childName={selectedChild?.name ?? ""}
            plan={resultPlan}
            isGenerating={isGenerating}
            generationStage={generationStage}
            isSaving={savePlanMutation.isPending}
            isSaved={isResultSaved}
            saveError={resultSaveError}
            saveSuccess={resultSaveSuccess}
            onBack={() => {
              if (isGenerating) {
                return;
              }

              setResultPlan(null);
              setResultSourceMealInputs(null);
              setResultSaveError(null);
              setResultSaveSuccess(null);
              setIsResultSaved(false);
              setTodayView("input");
            }}
            onSave={selectedChild ? handleSavePlan : undefined}
          />
        ) : null}

        <CommonBottomMenu />
      </div>
    );
  }

  return (
    <div className="meal-plan-figma-page">
      <CommonHeader
        title="베베 초이스"
        onBack={() => {
          if (isGenerating) {
            return;
          }

          navigate("/profile");
        }}
      />

      <main className="meal-plan-figma-content">
        {selectedChild ? (
          <section className="meal-plan-selected-child-card">
            <div className="meal-plan-selected-child-avatar" aria-hidden="true">
              <AppIcon name="childProfile" size={24} />
            </div>
            <div className="meal-plan-selected-child-copy">
              <strong>{selectedChild.name}</strong>
              <span>{selectedChild.ageMonths}개월</span>
            </div>
            <div className="child-card-menu-wrap">
              <ChildCardMenuButton
                onClick={() => {
                  if (isGenerating) {
                    return;
                  }

                  navigate("/profile");
                }}
                ariaLabel="아이 프로필 화면 열기"
                disabled={isGenerating}
              />
            </div>
          </section>
        ) : null}

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
          <SessionCheckingOverlay
            title="오늘 식단 화면 준비 중..."
            description="선택한 아이 정보와 최근 식단을 불러오는 중이에요."
          />
        ) : null}

        {!pageError && !isPageLoading ? (
          <MealInputSection
            panelId="meal-input-panel"
            selectedChild={selectedChild}
            draft={mealDraft}
            allergyWarnings={allergyWarnings}
            onChange={handleChangeMealDraft}
            onClear={handleClearMealDraft}
            onGenerate={handleGeneratePlan}
            isGenerating={isGenerating}
            generationStage={generationStage}
            showReset={false}
          />
        ) : null}
      </main>

      <CommonBottomMenu />
    </div>
  );
}
