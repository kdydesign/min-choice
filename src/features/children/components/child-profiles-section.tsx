import { useEffect, useMemo, useState } from "react";
import { Panel } from "../../../components/panel";
import { TagInput } from "../../../components/tag-input";
import type { ChildProfile } from "../../../types/domain";

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

interface ProfileFormState {
  name: string;
  ageMonths: string;
  birthDate: string;
  allergies: string[];
}

const EMPTY_FORM: ProfileFormState = {
  name: "",
  ageMonths: "12",
  birthDate: "",
  allergies: []
};

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
  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_FORM);

  useEffect(() => {
    if (!editingProfile) {
      setFormState(EMPTY_FORM);
      return;
    }

    setFormState({
      name: editingProfile.name,
      ageMonths: String(editingProfile.ageMonths),
      birthDate: editingProfile.birthDate,
      allergies: editingProfile.allergies
    });
  }, [editingProfile]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedChildId) ?? null,
    [profiles, selectedChildId]
  );

  return (
    <Panel eyebrow="Step 1" title="아이 프로필" subtitle="여러 아이를 분리해서 관리">
      <div className={`selected-profile ${selectedProfile ? "active" : "empty"}`}>
        {selectedProfile ? (
          <>
            <strong>{selectedProfile.name}</strong>
            <div className="meta-row">
              <span className="inline-chip">{selectedProfile.ageMonths}개월</span>
              {selectedProfile.birthDate ? (
                <span className="inline-chip">{selectedProfile.birthDate}</span>
              ) : null}
              <span className="inline-chip">
                알레르기 {selectedProfile.allergies.length ? selectedProfile.allergies.join(", ") : "없음"}
              </span>
            </div>
          </>
        ) : (
          "아직 선택된 아이가 없어요."
        )}
      </div>

      <div className="profile-list">
        {profiles.length === 0 ? (
          <div className="empty-state">첫 번째 아이 프로필을 추가해 주세요.</div>
        ) : (
          profiles.map((profile) => (
            <article
              key={profile.id}
              className={`profile-card ${profile.id === selectedChildId ? "selected" : ""}`}
            >
              <div className="card-head">
                <div>
                  <h3>{profile.name}</h3>
                  <p className="subtle">{profile.ageMonths}개월</p>
                </div>
                {profile.id === selectedChildId ? <span className="pill">선택됨</span> : null}
              </div>
              <div className="chip-row">
                <span className="inline-chip">
                  알레르기 {profile.allergies.length ? profile.allergies.join(", ") : "없음"}
                </span>
              </div>
              <div className="card-actions">
                <button type="button" className="ghost" onClick={() => onSelect(profile.id)}>
                  {profile.id === selectedChildId ? "선택 중" : "이 아이로 생성"}
                </button>
                <button type="button" className="tiny" onClick={() => onEdit(profile)}>
                  수정
                </button>
                <button type="button" className="tiny" onClick={() => onDelete(profile.id)}>
                  삭제
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <form
        className="stack-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(
            {
              name: formState.name.trim(),
              ageMonths: Number(formState.ageMonths || "12"),
              birthDate: formState.birthDate,
              allergies: formState.allergies
            },
            editingProfile?.id
          );
          setFormState(EMPTY_FORM);
          onCancelEdit();
        }}
      >
        <label className="field">
          <span>아이 이름</span>
          <input
            value={formState.name}
            onChange={(event) =>
              setFormState((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="예: 하민"
            maxLength={20}
            required
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>개월 수</span>
            <input
              type="number"
              value={formState.ageMonths}
              onChange={(event) =>
                setFormState((current) => ({ ...current, ageMonths: event.target.value }))
              }
              min={6}
              max={36}
              required
            />
          </label>
          <label className="field">
            <span>생년월일</span>
            <input
              type="date"
              value={formState.birthDate}
              onChange={(event) =>
                setFormState((current) => ({ ...current, birthDate: event.target.value }))
              }
            />
          </label>
        </div>

        <TagInput
          label="알레르기 재료"
          value={formState.allergies}
          placeholder="쉼표 또는 Enter로 추가"
          helperText="예: 두부, 달걀"
          onChange={(allergies) => setFormState((current) => ({ ...current, allergies }))}
        />

        <div className="form-actions">
          <button type="submit" className="primary">
            {editingProfile ? "프로필 수정" : "프로필 저장"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setFormState(EMPTY_FORM);
              onCancelEdit();
            }}
          >
            입력 초기화
          </button>
        </div>
      </form>
    </Panel>
  );
}
