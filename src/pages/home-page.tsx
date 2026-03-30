import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { ChildProfilesSection } from "../features/children/components/child-profiles-section";
import {
  deleteChildProfile,
  listChildProfiles,
  saveChildProfile
} from "../features/children/api/child-profile-repository";
import {
  clearMealDraft,
  getMealDraft,
  saveMealDraft
} from "../services/storage/meal-draft-storage";
import type { ChildProfile, DailyMealPlan, MealDraft, MealType } from "../types/domain";
import { emptyMealDraft, getIngredientConflicts } from "../features/ingredients/lib/ingredient-utils";
import { useAppStore } from "../store/use-app-store";
import { createId } from "../lib/create-id";
import { MealInputSection } from "../features/meal-plans/components/meal-input-section";
import { buildDailyMealPlan } from "../features/meal-plans/lib/plan-generator";
import {
  deleteMealPlansByChild,
  listMealPlansByChild,
  saveMealPlan
} from "../features/meal-plans/api/meal-plan-repository";
import { MealResultsSection } from "../features/meal-plans/components/meal-results-section";
import { MealHistorySection } from "../features/meal-plans/components/meal-history-section";
import { MEAL_TYPES } from "../types/domain";

export function HomePage() {
  const queryClient = useQueryClient();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const selectedPlanId = useAppStore((state) => state.selectedPlanId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);

  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [mealDraft, setMealDraft] = useState<MealDraft>(emptyMealDraft());
  const [generatedPlan, setGeneratedPlan] = useState<DailyMealPlan | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ["children"],
    queryFn: listChildProfiles
  });

  const selectedChild = useMemo(
    () => profiles.find((profile) => profile.id === selectedChildId) ?? null,
    [profiles, selectedChildId]
  );

  const { data: history = [] } = useQuery({
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
      setGeneratedPlan(null);
      return;
    }

    setMealDraft(getMealDraft(selectedChild.id));
    setGeneratedPlan(null);
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedChild) {
      return;
    }

    if (selectedPlanId) {
      const foundPlan = history.find((plan) => plan.id === selectedPlanId) ?? null;
      setGeneratedPlan(foundPlan);
      return;
    }

    setGeneratedPlan(history[0] ?? null);
  }, [history, selectedChild, selectedPlanId]);

  const profileMutation = useMutation({
    mutationFn: saveChildProfile,
    onSuccess: async (profile) => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      setSelectedChild(profile.id);
      setEditingProfile(null);
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      await deleteChildProfile(profileId);
      await deleteMealPlansByChild(profileId);
      clearMealDraft(profileId);
      return profileId;
    },
    onSuccess: async (profileId) => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      await queryClient.invalidateQueries({ queryKey: ["meal-plans"] });

      if (selectedChildId === profileId) {
        setSelectedChild("");
        setSelectedPlan("");
      }
    }
  });

  const savePlanMutation = useMutation({
    mutationFn: saveMealPlan,
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: ["meal-plans", plan.childId] });
      setSelectedPlan(plan.id);
      setGeneratedPlan(plan);
    }
  });

  const allergyWarnings = useMemo<Record<MealType, string[]>>(
    () => ({
      breakfast: selectedChild ? getIngredientConflicts(mealDraft.breakfast, selectedChild.allergies) : [],
      lunch: selectedChild ? getIngredientConflicts(mealDraft.lunch, selectedChild.allergies) : [],
      dinner: selectedChild ? getIngredientConflicts(mealDraft.dinner, selectedChild.allergies) : []
    }),
    [mealDraft, selectedChild]
  );

  async function handleSaveProfile(
    payload: Omit<ChildProfile, "id" | "createdAt" | "updatedAt">,
    editingId?: string
  ) {
    const now = new Date().toISOString();
    const original = profiles.find((profile) => profile.id === editingId);

    await profileMutation.mutateAsync({
      id: editingId ?? createId("child"),
      name: payload.name,
      ageMonths: payload.ageMonths,
      birthDate: payload.birthDate,
      allergies: payload.allergies,
      createdAt: original?.createdAt ?? now,
      updatedAt: now
    });
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
  }

  function handleClearMealDraft() {
    if (!selectedChild) {
      return;
    }

    clearMealDraft(selectedChild.id);
    setMealDraft(emptyMealDraft());
  }

  async function handleGeneratePlan() {
    if (!selectedChild) {
      return;
    }

    const normalizedDraft = MEAL_TYPES.reduce(
      (accumulator, mealType) => {
        accumulator[mealType] = mealDraft[mealType];
        return accumulator;
      },
      { ...emptyMealDraft() } as MealDraft
    );

    const plan = buildDailyMealPlan({
      child: selectedChild,
      mealInputs: {
        breakfast: normalizedDraft.breakfast,
        lunch: normalizedDraft.lunch,
        dinner: normalizedDraft.dinner
      }
    });

    await savePlanMutation.mutateAsync(plan);
    saveMealDraft(selectedChild.id, normalizedDraft);
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="badge">Vite + React MVP</span>
          <h1>12개월 아이 하루 식단표</h1>
          <p>아이별 알레르기를 반영해, 아침·점심·저녁 재료만으로 오늘 식단을 빠르게 추천해요.</p>
        </div>
        <div className="hero-card">
          <p className="eyebrow">오늘의 기준</p>
          <strong>{selectedChild ? `${selectedChild.name} 기준 추천 준비 완료` : "아이를 선택해 주세요"}</strong>
          <span>
            {selectedChild
              ? `${selectedChild.ageMonths}개월 · 알레르기 ${selectedChild.allergies.length ? selectedChild.allergies.join(", ") : "없음"}`
              : "프로필이 없으면 아래에서 바로 추가할 수 있어요."}
          </span>
        </div>
      </header>

      <main className="layout">
        <ChildProfilesSection
          profiles={profiles}
          selectedChildId={selectedChildId}
          onSelect={(childId) => {
            setSelectedChild(childId);
            setSelectedPlan("");
            setEditingProfile(null);
          }}
          onSave={handleSaveProfile}
          onEdit={setEditingProfile}
          onDelete={(childId) => deleteProfileMutation.mutate(childId)}
          editingProfile={editingProfile}
          onCancelEdit={() => setEditingProfile(null)}
        />

        <MealInputSection
          selectedChild={selectedChild}
          draft={mealDraft}
          allergyWarnings={allergyWarnings}
          onChange={handleChangeMealDraft}
          onClear={handleClearMealDraft}
          onGenerate={handleGeneratePlan}
        />

        <MealResultsSection plan={generatedPlan} />

        <MealHistorySection
          selectedChild={selectedChild}
          history={history}
          selectedPlanId={selectedPlanId}
          onLoad={(planId) => setSelectedPlan(planId)}
        />
      </main>
    </div>
  );
}
