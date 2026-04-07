import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CommonBottomMenu } from "../components/common-bottom-menu";
import { ErrorState } from "../components/error-state";
import { LoadingState } from "../components/loading-state";
import { ChildProfilesSection } from "../features/children/components/child-profiles-section";
import { useAuth } from "../features/auth/hooks/use-auth";
import {
  deleteChildProfile,
  listChildProfiles,
  saveChildProfile,
  type SaveChildProfileInput
} from "../features/children/api/child-profile-repository";
import { deleteMealPlansByChild } from "../features/meal-plans/api/meal-plan-repository";
import { clearMealDraft } from "../services/storage/meal-draft-storage";
import { useAppStore } from "../store/use-app-store";
import type { ChildProfile } from "../types/domain";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAnonymous, signOut } = useAuth();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    data: profiles = [],
    error: profilesError,
    isLoading: isProfilesLoading,
    refetch: refetchProfiles
  } = useQuery({
    queryKey: ["children"],
    queryFn: listChildProfiles
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

  const profileMutation = useMutation({
    mutationFn: saveChildProfile,
    onSuccess: async (profile) => {
      const isFirstProfile = profiles.length === 0;
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      setSelectedChild(profile.id);
      setEditingProfile(null);
      setActionError(null);
      setActionSuccess(isFirstProfile ? null : "아이 프로필을 저장했어요.");

      if (isFirstProfile) {
        navigate("/", { replace: true });
      }
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
      setActionSuccess("아이 프로필을 삭제했어요.");

      if (selectedChildId === profileId) {
        setSelectedChild("");
        setSelectedPlan("");
      }
    }
  });

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
      setActionSuccess(null);
      setActionError(getErrorMessage(error, "아이 프로필을 저장하지 못했어요."));
    }
  }

  async function handleDeleteProfile(childId: string) {
    try {
      await deleteProfileMutation.mutateAsync(childId);
    } catch (error) {
      setActionSuccess(null);
      setActionError(getErrorMessage(error, "아이 프로필을 삭제하지 못했어요."));
    }
  }

  const pageError =
    actionError ??
    (profilesError ? getErrorMessage(profilesError, "아이 프로필을 불러오지 못했어요.") : null);

  return (
    <div className="profile-figma-page">
      <main className="profile-selection-layout">
        <section className="profile-selection-header">
          <div className="profile-selection-header-bar">
            <button
              type="button"
              className="profile-selection-header-side"
              onClick={() => navigate("/")}
              aria-label="오늘 식단으로 이동"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1>우리 아이 선택</h1>
            <div className="profile-selection-header-placeholder" aria-hidden="true" />
          </div>
        </section>

        {pageError ? (
          <ErrorState
            title="아이 프로필 화면을 준비하지 못했어요"
            description={pageError}
            action={
              <button
                type="button"
                className="secondary small"
                onClick={() => void refetchProfiles()}
              >
                다시 시도
              </button>
            }
          />
        ) : null}
        {actionSuccess ? <div className="notice success">{actionSuccess}</div> : null}

        {isProfilesLoading && !pageError ? (
          <LoadingState
            title="아이 프로필을 불러오는 중이에요"
            description="등록된 아이 정보와 마지막 선택 상태를 정리하고 있어요."
          />
        ) : null}

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

        <div className="profile-page-actions">
          <button type="button" className="profile-selection-logout-button" onClick={() => void signOut()}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 16.5L19.5 12L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.5 12H10.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 20H7.5C6.67157 20 6 19.3284 6 18.5V5.5C6 4.67157 6.67157 4 7.5 4H13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{isAnonymous ? "시작 화면으로" : "로그아웃"}</span>
          </button>
        </div>
      </main>

      <CommonBottomMenu />
    </div>
  );
}
