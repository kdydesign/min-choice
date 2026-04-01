import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../../components/empty-state";
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

interface ProfileFormErrors {
  name?: string;
  ageMonths?: string;
}

const EMPTY_FORM: ProfileFormState = {
  name: "",
  ageMonths: "12",
  birthDate: "",
  allergies: []
};

function validateProfileForm(state: ProfileFormState): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  const trimmedName = state.name.trim();
  const ageMonths = Number(state.ageMonths);

  if (!trimmedName) {
    errors.name = "아이 이름을 입력해 주세요.";
  }

  if (!state.ageMonths.trim()) {
    errors.ageMonths = "개월 수를 입력해 주세요.";
  } else if (!Number.isFinite(ageMonths) || ageMonths < 6 || ageMonths > 36) {
    errors.ageMonths = "개월 수는 6개월부터 36개월 사이로 입력해 주세요.";
  }

  return errors;
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
  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_FORM);
  const [touchedFields, setTouchedFields] = useState<{ name: boolean; ageMonths: boolean }>({
    name: false,
    ageMonths: false
  });

  useEffect(() => {
    if (!editingProfile) {
      setFormState(EMPTY_FORM);
      setTouchedFields({ name: false, ageMonths: false });
      return;
    }

    setFormState({
      name: editingProfile.name,
      ageMonths: String(editingProfile.ageMonths),
      birthDate: editingProfile.birthDate,
      allergies: editingProfile.allergies
    });
    setTouchedFields({ name: false, ageMonths: false });
  }, [editingProfile]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedChildId) ?? null,
    [profiles, selectedChildId]
  );
  const fieldErrors = useMemo(() => validateProfileForm(formState), [formState]);

  return (
    <Panel eyebrow="Profile" title="우리 아이" subtitle="아이를 선택하고, 필요할 때만 수정하거나 추가해요.">
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
          <EmptyState
            title="등록된 아이가 아직 없어요"
            description="첫 번째 아이 프로필을 만들면 오늘 식단과 최근 이력을 바로 이어서 볼 수 있어요."
          />
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
                <span className="inline-chip">{profile.ageMonths}개월</span>
                <span className="inline-chip">
                  알레르기 {profile.allergies.length ? profile.allergies.join(", ") : "없음"}
                </span>
              </div>
              <div className="card-actions">
                <button type="button" className="ghost" onClick={() => onSelect(profile.id)}>
                  {profile.id === selectedChildId ? "선택 중" : "이 아이 선택"}
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

      <div className="profile-form-card">
        <div className="profile-form-head">
          <div>
            <p className="eyebrow">{editingProfile ? "Edit" : "Create"}</p>
            <strong>{editingProfile ? "아이 정보 수정" : "새 아이 등록"}</strong>
          </div>
          <span className="subtle">입력은 최소화하고, 알레르기는 태그로 관리해요.</span>
        </div>

        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();

            const nextErrors = validateProfileForm(formState);

            if (nextErrors.name || nextErrors.ageMonths) {
              setTouchedFields({ name: true, ageMonths: true });
              return;
            }

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
            setTouchedFields({ name: false, ageMonths: false });
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
              onBlur={() => setTouchedFields((current) => ({ ...current, name: true }))}
              placeholder="예: 하민"
              maxLength={20}
              aria-invalid={touchedFields.name && Boolean(fieldErrors.name)}
              required
            />
            {touchedFields.name && fieldErrors.name ? (
              <small className="field-helper error">{fieldErrors.name}</small>
            ) : null}
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
              onBlur={() => setTouchedFields((current) => ({ ...current, ageMonths: true }))}
              min={6}
              max={36}
              aria-invalid={touchedFields.ageMonths && Boolean(fieldErrors.ageMonths)}
              required
            />
            {touchedFields.ageMonths && fieldErrors.ageMonths ? (
              <small className="field-helper error">{fieldErrors.ageMonths}</small>
            ) : (
              <small className="field-helper">개월 수는 6개월부터 36개월 사이로 입력해 주세요.</small>
            )}
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

          <div className="form-actions profile-form-actions">
            <button type="submit" className="primary profile-form-submit">
              {editingProfile ? "프로필 수정" : "프로필 저장"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setFormState(EMPTY_FORM);
                setTouchedFields({ name: false, ageMonths: false });
                onCancelEdit();
              }}
            >
              입력 초기화
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
