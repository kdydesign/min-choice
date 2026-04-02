import { useEffect, useState } from "react";
import { TagInput } from "../../../components/tag-input";
import type { ChildProfile } from "../../../types/domain";
import { getProfileBackgroundColor } from "../lib/profile-tone";

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
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [touchedFields, setTouchedFields] = useState<{ name: boolean; ageMonths: boolean }>({
    name: false,
    ageMonths: false
  });

  useEffect(() => {
    if (!editingProfile) {
      setFormState(EMPTY_FORM);
      setTouchedFields({ name: false, ageMonths: false });
      setIsComposerOpen(profiles.length === 0);
    } else {
      setFormState({
        name: editingProfile.name,
        ageMonths: String(editingProfile.ageMonths),
        birthDate: editingProfile.birthDate,
        allergies: editingProfile.allergies
      });
      setTouchedFields({ name: false, ageMonths: false });
      setIsComposerOpen(true);
    }
  }, [editingProfile, profiles.length]);

  const fieldErrors = validateProfileForm(formState);

  return (
    <section className="profile-selection-screen">
      <div className="profile-list">
        {profiles.length === 0 ? (
          <div className="profile-selection-empty-card">
            <p>등록된 아이가 아직 없어요.</p>
            <span>첫 번째 아이를 등록하면 오늘 식단과 최근 이력을 바로 이어서 볼 수 있어요.</span>
          </div>
        ) : (
          profiles.map((profile) => (
            <article
              key={profile.id}
              className={`profile-selection-card ${profile.id === selectedChildId ? "selected" : ""}`}
              style={{ backgroundColor: getProfileBackgroundColor(profile.id || profile.name) }}
            >
              <div className="profile-selection-card-head">
                <div className="profile-selection-card-identity">
                  <div className="profile-selection-card-avatar" aria-hidden="true">
                    👶
                  </div>
                  <div>
                    <h3>{profile.name}</h3>
                    <p>{profile.ageMonths}개월</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="profile-selection-card-menu"
                  onClick={() => onEdit(profile)}
                  aria-label={`${profile.name} 프로필 수정`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
              </div>

              <div className="profile-selection-tag-row">
                {(profile.allergies.length > 0 ? profile.allergies : ["알레르기 없음"]).map((tag) => (
                  <span key={`${profile.id}-${tag}`} className="profile-selection-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="profile-selection-actions">
                <button
                  type="button"
                  className="profile-selection-button soft"
                  onClick={() => onSelect(profile.id)}
                >
                  {profile.id === selectedChildId ? "선택됨" : "선택"}
                </button>
                <button
                  type="button"
                  className="profile-selection-button solid"
                  onClick={() => onEdit(profile)}
                >
                  수정
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <button
        type="button"
        className="profile-selection-add-button"
        onClick={() => {
          setFormState(EMPTY_FORM);
          setTouchedFields({ name: false, ageMonths: false });
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
              setIsComposerOpen(profiles.length === 0);
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
                  <small className="field-helper">
                    개월 수는 6개월부터 36개월 사이로 입력해 주세요.
                  </small>
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
              tone="profile"
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
                  setIsComposerOpen(profiles.length === 0);
                  onCancelEdit();
                }}
              >
                닫기
              </button>
              {editingProfile ? (
                <button
                  type="button"
                  className="ghost profile-form-delete"
                  onClick={() => onDelete(editingProfile.id)}
                >
                  프로필 삭제
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
