import type { ChildProfile } from "../../../types/domain";
import { ChildSelectionCard } from "./child-selection-card";

interface ChildProfilesSectionProps {
  profiles: ChildProfile[];
  selectedChildId: string;
  onSelect: (childId: string) => void;
  onAdd: () => void;
  onEdit: (profile: ChildProfile) => void;
  onDelete: (childId: string) => void;
}

export function ChildProfilesSection({
  profiles,
  selectedChildId,
  onSelect,
  onAdd,
  onEdit,
  onDelete
}: ChildProfilesSectionProps) {
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
        onClick={onAdd}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>아이 추가하기</span>
      </button>
    </section>
  );
}
