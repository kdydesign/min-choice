import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppFrame } from "../components/app-frame";
import { ChildProfileCard } from "../components/child-profile-card";
import { ErrorState } from "../components/error-state";
import { LoadingState } from "../components/loading-state";
import { ChildSwitcher } from "../features/children/components/child-switcher";
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
import { MealResultsSection } from "../features/meal-plans/components/meal-results-section";
import { MEAL_TYPES } from "../types/domain";
import { normalizeIngredients } from "../features/ingredients/api/normalize-ingredients-service";

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
  const queryClient = useQueryClient();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);

  const [mealDraft, setMealDraft] = useState<MealDraft>(emptyMealDraft());
  const [actionError, setActionError] = useState<string | null>(null);
  const [hasSeededInitialDraft, setHasSeededInitialDraft] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    label: string;
    value: number;
  } | null>(null);

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

  function handleScrollToInputs() {
    document.getElementById("meal-input-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  const allergyWarnings = useMemo<Record<MealType, string[]>>(
    () => ({
      breakfast: selectedChild ? getIngredientConflicts(mealDraft.breakfast, selectedChild.allergies) : [],
      lunch: selectedChild ? getIngredientConflicts(mealDraft.lunch, selectedChild.allergies) : [],
      dinner: selectedChild ? getIngredientConflicts(mealDraft.dinner, selectedChild.allergies) : []
    }),
    [mealDraft, selectedChild]
  );

  async function handleGeneratePlan() {
    if (!selectedChild) {
      return;
    }

    try {
      setActionError(null);
      setGenerationProgress({
        label: "재료 이름을 정리하고 있어요.",
        value: 24
      });

      const normalizedDraft = {
        breakfast: (await normalizeIngredients(mealDraft.breakfast)).map((item) => item.standardKey),
        lunch: (await normalizeIngredients(mealDraft.lunch)).map((item) => item.standardKey),
        dinner: (await normalizeIngredients(mealDraft.dinner)).map((item) => item.standardKey),
        updatedAt: new Date().toISOString()
      } satisfies MealDraft;

      setGenerationProgress({
        label: "오늘 3끼에 맞는 메뉴를 고르고 있어요.",
        value: 62
      });

      const plan = await generateMealPlan({
        child: selectedChild,
        mealInputs: {
          breakfast: normalizedDraft.breakfast,
          lunch: normalizedDraft.lunch,
          dinner: normalizedDraft.dinner
        }
      });

      setGenerationProgress({
        label: "추천 식단을 저장하고 있어요.",
        value: 88
      });

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
      setGenerationProgress({
        label: "오늘 식단 준비가 끝났어요.",
        value: 100
      });

      window.setTimeout(() => setGenerationProgress(null), 650);
    } catch (error) {
      setGenerationProgress(null);
      setActionError(getErrorMessage(error, "식단을 생성하지 못했어요."));
    }
  }

  function handleChangeMealDraft(mealType: MealType, ingredients: string[]) {
    if (!selectedChild) {
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
    if (!selectedChild) {
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

  return (
    <AppFrame
      title="오늘 식단 입력"
      subtitle="아침, 점심, 저녁에 쓸 재료를 차례대로 적어 주세요."
      context={
        selectedChild ? (
          <ChildProfileCard
            child={selectedChild}
            label="Selected Child"
            helperText="이 아이 기준으로 오늘 아침, 점심, 저녁 식단을 맞춰드려요."
          />
        ) : null
      }
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

      <ChildSwitcher
        profiles={profiles}
        selectedChildId={selectedChildId}
        onSelect={(childId) => {
          setSelectedChild(childId);
          setSelectedPlan("");
        }}
      />

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
        isGenerating={savePlanMutation.isPending || Boolean(generationProgress)}
        progressLabel={generationProgress?.label}
        progressValue={generationProgress?.value}
      />

      <MealResultsSection
        plan={visiblePlan}
        onEditInputs={selectedChild ? handleScrollToInputs : undefined}
        onRegenerate={selectedChild ? handleGeneratePlan : undefined}
        isGenerating={savePlanMutation.isPending || Boolean(generationProgress)}
        emptyMessage={
          selectedChild
            ? "오늘 식단이 아직 없어요. 위에서 재료를 입력하고 새로 생성해 주세요."
            : "아이를 먼저 선택하면 오늘 식단이 여기에 표시돼요."
        }
      />
    </AppFrame>
  );
}
