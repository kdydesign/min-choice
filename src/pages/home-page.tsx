import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChildProfilesSection } from "../features/children/components/child-profiles-section";
import {
  deleteChildProfile,
  listChildProfiles,
  saveChildProfile,
  type SaveChildProfileInput
} from "../features/children/api/child-profile-repository";
import {
  clearMealDraft,
  getMealDraft,
  saveMealDraft
} from "../services/storage/meal-draft-storage";
import type { ChildProfile, DailyMealPlan, MealDraft, MealType } from "../types/domain";
import { emptyMealDraft, getIngredientConflicts } from "../features/ingredients/lib/ingredient-utils";
import { useAppStore } from "../store/use-app-store";
import { MealInputSection } from "../features/meal-plans/components/meal-input-section";
import {
  deleteMealPlansByChild,
  listMealPlansByChild,
  saveMealPlan,
  type SaveMealPlanInput
} from "../features/meal-plans/api/meal-plan-repository";
import { generateMealPlan } from "../features/meal-plans/api/generate-meal-plan-service";
import { MealResultsSection } from "../features/meal-plans/components/meal-results-section";
import { MealHistorySection } from "../features/meal-plans/components/meal-history-section";
import { MEAL_TYPES } from "../types/domain";
import { normalizeIngredients } from "../features/ingredients/api/normalize-ingredients-service";
import { PwaStatusBanner } from "../features/pwa/components/pwa-status-banner";
import { useAuth } from "../features/auth/hooks/use-auth";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const selectedPlanId = useAppStore((state) => state.selectedPlanId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);
  const { identityLabel, isAnonymous, providerLabel, signOut } = useAuth();

  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [mealDraft, setMealDraft] = useState<MealDraft>(emptyMealDraft());
  const [generatedPlan, setGeneratedPlan] = useState<DailyMealPlan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: profiles = [],
    error: profilesError
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
    error: historyError
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
      setActionError(null);
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
      setActionError(null);

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
      setActionError(null);
    }
  });

  const pageError =
    actionError ??
    (profilesError ? getErrorMessage(profilesError, "아이 프로필을 불러오지 못했어요.") : null) ??
    (historyError ? getErrorMessage(historyError, "식단 이력을 불러오지 못했어요.") : null);

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
    const nextProfile: SaveChildProfileInput = {
      id: editingId,
      name: payload.name,
      ageMonths: payload.ageMonths,
      birthDate: payload.birthDate,
      allergies: payload.allergies,
      createdAt: original?.createdAt ?? now,
      updatedAt: now
    };

    try {
      await profileMutation.mutateAsync(nextProfile);
    } catch (error) {
      setActionError(getErrorMessage(error, "아이 프로필을 저장하지 못했어요."));
    }
  }

  async function handleDeleteProfile(childId: string) {
    try {
      await deleteProfileMutation.mutateAsync(childId);
    } catch (error) {
      setActionError(getErrorMessage(error, "아이 프로필을 삭제하지 못했어요."));
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

    try {
      const normalizedDraft = {
        breakfast: (await normalizeIngredients(mealDraft.breakfast)).map((item) => item.standardKey),
        lunch: (await normalizeIngredients(mealDraft.lunch)).map((item) => item.standardKey),
        dinner: (await normalizeIngredients(mealDraft.dinner)).map((item) => item.standardKey),
        updatedAt: new Date().toISOString()
      } satisfies MealDraft;

      const plan = await generateMealPlan({
        child: selectedChild,
        mealInputs: {
          breakfast: normalizedDraft.breakfast,
          lunch: normalizedDraft.lunch,
          dinner: normalizedDraft.dinner
        }
      });

      const nextPlanPayload: SaveMealPlanInput = {
        plan,
        sourceMealInputs: {
          breakfast: mealDraft.breakfast,
          lunch: mealDraft.lunch,
          dinner: mealDraft.dinner
        }
      };

      await savePlanMutation.mutateAsync(nextPlanPayload);
      saveMealDraft(selectedChild.id, normalizedDraft);
      setMealDraft(normalizedDraft);
    } catch (error) {
      setActionError(getErrorMessage(error, "식단을 생성하지 못했어요."));
    }
  }

  return (
    <div className="app-shell">
      <PwaStatusBanner />
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
          <div className="auth-summary">
            <span className="inline-chip">{providerLabel}</span>
            <span className="subtle">{identityLabel}</span>
          </div>
          <div className="card-actions">
            {isAnonymous ? (
              <button type="button" className="secondary small" onClick={() => navigate("/login")}>
                계정 연결
              </button>
            ) : null}
            <button type="button" className="ghost small" onClick={() => void signOut()}>
              {isAnonymous ? "익명 종료" : "로그아웃"}
            </button>
          </div>
        </div>
      </header>

      <main className="layout">
        {pageError ? <div className="notice danger">{pageError}</div> : null}

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
          onDelete={(childId) => void handleDeleteProfile(childId)}
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
