import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CommonBottomMenu } from "../components/common-bottom-menu";
import { CommonHeader } from "../components/common-header";
import { ErrorState } from "../components/error-state";
import { AppIcon } from "../components/icons/app-icon";
import { LoadingState } from "../components/loading-state";
import { ChildRegistrationScreen } from "../features/children/components/child-registration-screen";
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

type ProfileViewMode = "list" | "create" | "edit";

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAnonymous, signOut } = useAuth();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);
  const [viewMode, setViewMode] = useState<ProfileViewMode>("list");
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
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
      queryClient.setQueryData<ChildProfile[]>(["children"], (current = []) => {
        const remaining = current.filter((item) => item.id !== profile.id);
        return [...remaining, profile].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      });
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      setSelectedChild(profile.id);
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
      queryClient.setQueryData<ChildProfile[]>(["children"], (current = []) =>
        current.filter((profile) => profile.id !== profileId)
      );
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      await queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
      setEditingChildId(null);
      setViewMode("list");
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
    const isEditing = Boolean(editingId);
    const wasEmpty = profiles.length === 0;
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
      setEditingChildId(null);
      setViewMode("list");
      setActionSuccess(
        wasEmpty ? "첫 아이 프로필을 저장했어요." : isEditing ? "아이 프로필을 수정했어요." : "새 아이 프로필을 저장했어요."
      );
    } catch (error) {
      setActionSuccess(null);
      setActionError(getErrorMessage(error, "아이 프로필을 저장하지 못했어요."));
      throw error;
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
  const isEmptyState = !isProfilesLoading && profiles.length === 0;
  const resolvedViewMode: ProfileViewMode = isEmptyState ? "create" : viewMode;
  const editingProfile =
    resolvedViewMode === "edit" && editingChildId
      ? profiles.find((profile) => profile.id === editingChildId) ?? null
      : null;
  const isRegistrationMode = resolvedViewMode !== "list";
  const isMissingEditingProfile =
    resolvedViewMode === "edit" && !isProfilesLoading && !editingProfile;

  function handleOpenCreate() {
    setActionError(null);
    setActionSuccess(null);
    setEditingChildId(null);
    setViewMode("create");
  }

  function handleOpenEdit(profile: ChildProfile) {
    setActionError(null);
    setActionSuccess(null);
    setEditingChildId(profile.id);
    setViewMode("edit");
  }

  function handleCloseRegistration() {
    setActionError(null);
    setEditingChildId(null);

    if (profiles.length === 0) {
      navigate("/");
      return;
    }

    setViewMode("list");
  }

  return (
    <div className="profile-figma-page">
      <CommonHeader
        title={isRegistrationMode ? "베베 초이스" : "우리 아이 선택"}
        onBack={isRegistrationMode ? handleCloseRegistration : () => navigate("/")}
      />

      <main className={`profile-selection-layout ${isRegistrationMode ? "is-empty-state" : ""}`}>
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

        {!isProfilesLoading ? (
          isMissingEditingProfile ? (
            <ErrorState
              title="아이 정보를 찾지 못했어요"
              description="수정하려는 아이 프로필이 없거나 새로고침으로 상태가 초기화되었어요."
              action={
                <button
                  type="button"
                  className="secondary small"
                  onClick={handleCloseRegistration}
                >
                  목록으로 돌아가기
                </button>
              }
            />
          ) : isRegistrationMode ? (
            <ChildRegistrationScreen
              mode={resolvedViewMode === "edit" ? "edit" : "create"}
              initialProfile={editingProfile}
              submitting={profileMutation.isPending}
              onSave={handleSaveProfile}
              onCancel={handleCloseRegistration}
            />
          ) : (
            <>
              <ChildProfilesSection
                profiles={profiles}
                selectedChildId={selectedChildId}
                onSelect={(childId) => {
                  setSelectedChild(childId);
                  setSelectedPlan("");
                  setEditingChildId(null);
                  setViewMode("list");
                }}
                onAdd={handleOpenCreate}
                onEdit={handleOpenEdit}
                onDelete={(childId) => void handleDeleteProfile(childId)}
              />

              <div className="profile-page-actions">
                <button type="button" className="profile-selection-logout-button" onClick={() => void signOut()}>
                  <AppIcon name="logout" size={20} aria-hidden="true" />
                  <span>{isAnonymous ? "시작 화면으로" : "로그아웃"}</span>
                </button>
              </div>
            </>
          )
        ) : null}
      </main>

      <CommonBottomMenu />
    </div>
  );
}
