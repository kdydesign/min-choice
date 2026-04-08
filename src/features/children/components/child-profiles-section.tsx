import { useEffect, useState } from "react";
import type { ChildProfile } from "../../../types/domain";
import { ChildSelectionCard } from "./child-selection-card";
import { ChildProfileForm } from "./child-profile-form";

interface ChildProfilesSectionProps {
  profiles: ChildProfile[];
  selectedChildId: string;
  onSelect: (childId: string) => void;
  onSave: (payload: Omit<ChildProfile, "id" | "createdAt" | "updatedAt">, editingId?: string) => void;
  onEdit: (profile: ChildProfile) => void;
  onDelete: (childId: string) => void;
  editingProfile: ChildProfile | null;
  onCancelEdit: () => void;
}

export function ChildProfilesSection({
  profiles,
  selectedChildId,
  onSelect,
  onSave,
  onEdit,
  onDelete,
  editingProfile,
  onCancelEdit
}: ChildProfilesSectionProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  useEffect(() => {
    if (!editingProfile) {
      setIsComposerOpen(false);
    } else {
      setIsComposerOpen(true);
    }
  }, [editingProfile]);

  return (
    <section className="profile-selection-screen">
      <div className="profile-list">
        {profiles.map((profile) => (
          <ChildSelectionCard
            key={profile.id}
            child={profile}
            selected={profile.id === selectedChildId}
            onSelect={() => onSelect(profile.id)}
            onEdit={() => onEdit(profile)}
            onDelete={() => onDelete(profile.id)}
          />
        ))}
      </div>

      <button
        type="button"
        className="profile-selection-add-button"
        onClick={() => {
          onCancelEdit();
          setIsComposerOpen(true);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>아이 추가하기</span>
      </button>

      {isComposerOpen ? (
        <div className="profile-form-card">
          <div className="profile-form-head">
            <div>
              <p className="eyebrow">{editingProfile ? "Edit" : "Create"}</p>
              <strong>{editingProfile ? "아이 정보 수정" : "새 아이 등록"}</strong>
            </div>
            <span className="subtle">입력은 최소화하고, 알레르기는 태그로 관리해요.</span>
          </div>

          <ChildProfileForm
            initialProfile={editingProfile}
            layout="editor"
            submitLabel={editingProfile ? "프로필 수정" : "프로필 저장"}
            cancelLabel="닫기"
            showDelete={Boolean(editingProfile)}
            onSave={async (payload, editingId) => {
              await onSave(payload, editingId);
              setIsComposerOpen(false);
              onCancelEdit();
            }}
            onCancel={() => {
              setIsComposerOpen(false);
              onCancelEdit();
            }}
            onDelete={(childId) => onDelete(childId)}
          />
        </div>
      ) : null}
    </section>
  );
}
