import type { ChildProfile } from "../../../types/domain";
import { getProfileInitial, getProfileTone } from "../lib/profile-tone";

interface ChildSwitcherProps {
  profiles: ChildProfile[];
  selectedChildId: string;
  onSelect: (childId: string) => void;
}

export function ChildSwitcher({ profiles, selectedChildId, onSelect }: ChildSwitcherProps) {
  if (profiles.length === 0) {
    return (
      <div className="empty-state">
        아직 등록된 아이가 없어요. 먼저 프로필을 만들어 주세요.
      </div>
    );
  }

  return (
    <div className="child-switcher" role="tablist" aria-label="아이 선택">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          className={`child-chip profile-tone-${getProfileTone(profile.id || profile.name)} ${
            profile.id === selectedChildId ? "active" : ""
          }`}
          onClick={() => onSelect(profile.id)}
        >
          <span className="child-chip-avatar" aria-hidden="true">
            {getProfileInitial(profile.name)}
          </span>
          <span className="child-chip-copy">
            <strong>{profile.name}</strong>
            <span>{profile.ageMonths}개월</span>
          </span>
        </button>
      ))}
    </div>
  );
}
