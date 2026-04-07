import { useEffect, useState } from "react";
import { TagInput } from "../../../components/tag-input";
import type { ChildProfile } from "../../../types/domain";
import {
  deriveAgeMonthsFromBirthDate,
  deriveBirthDateFromAgeMonths,
  getDefaultBirthDate,
  isFutureBirthDate,
  isValidAgeMonthsInput,
  isValidChildName
} from "../lib/profile-date-utils";
import { ChildSelectionCard } from "./child-selection-card";

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
  birthDate?: string;
}

function createEmptyFormState(): ProfileFormState {
  return {
    name: "",
    ageMonths: "0",
    birthDate: getDefaultBirthDate(),
    allergies: []
  };
}

function createFormStateFromProfile(profile: ChildProfile): ProfileFormState {
  const fallbackAgeMonths =
    typeof profile.ageMonths === "number"
      ? profile.ageMonths
      : deriveAgeMonthsFromBirthDate(profile.birthDate) ?? 0;
  const fallbackBirthDate =
    profile.birthDate || deriveBirthDateFromAgeMonths(fallbackAgeMonths) || getDefaultBirthDate();

  return {
    name: profile.name,
    ageMonths: String(fallbackAgeMonths),
    birthDate: fallbackBirthDate,
    allergies: profile.allergies
  };
}

function validateProfileForm(state: ProfileFormState): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  const trimmedName = state.name.trim();

  if (!trimmedName) {
    errors.name = "아이 이름을 입력해 주세요.";
  } else if (!isValidChildName(trimmedName)) {
    errors.name = "아이 이름 형식을 다시 확인해 주세요.";
  }

  if (!state.ageMonths.trim()) {
    errors.ageMonths = "개월 수를 입력해 주세요.";
  } else if (!isValidAgeMonthsInput(state.ageMonths)) {
    errors.ageMonths = "개월 수는 0 이상의 숫자로 입력해 주세요.";
  }

  if (!state.birthDate.trim()) {
    errors.birthDate = "생년월일을 입력해 주세요.";
  } else if (isFutureBirthDate(state.birthDate)) {
    errors.birthDate = "생년월일은 오늘 이후 날짜로 입력할 수 없어요.";
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
  const [formState, setFormState] = useState<ProfileFormState>(() => createEmptyFormState());
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [touchedFields, setTouchedFields] = useState<{
    name: boolean;
    ageMonths: boolean;
    birthDate: boolean;
  }>({
    name: false,
    ageMonths: false,
    birthDate: false
  });

  useEffect(() => {
    if (!editingProfile) {
      setFormState(createEmptyFormState());
      setTouchedFields({ name: false, ageMonths: false, birthDate: false });
      setIsComposerOpen(profiles.length === 0);
    } else {
      setFormState(createFormStateFromProfile(editingProfile));
      setTouchedFields({ name: false, ageMonths: false, birthDate: false });
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
            <ChildSelectionCard
              key={profile.id}
              child={profile}
              selected={profile.id === selectedChildId}
              onSelect={() => onSelect(profile.id)}
              onEdit={() => onEdit(profile)}
              onDelete={() => onDelete(profile.id)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        className="profile-selection-add-button"
        onClick={() => {
          setFormState(createEmptyFormState());
          setTouchedFields({ name: false, ageMonths: false, birthDate: false });
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

              if (nextErrors.name || nextErrors.ageMonths || nextErrors.birthDate) {
                setTouchedFields({ name: true, ageMonths: true, birthDate: true });
                return;
              }

              onSave(
                {
                  name: formState.name.trim(),
                  ageMonths: Number(formState.ageMonths || "0"),
                  birthDate: formState.birthDate.trim(),
                  allergies: formState.allergies
                },
                editingProfile?.id
              );
              setFormState(createEmptyFormState());
              setTouchedFields({ name: false, ageMonths: false, birthDate: false });
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
                  type="text"
                  value={formState.ageMonths}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (nextValue && !/^\d+$/.test(nextValue)) {
                      return;
                    }

                    setFormState((current) => ({
                      ...current,
                      ageMonths: nextValue,
                      birthDate: nextValue
                        ? deriveBirthDateFromAgeMonths(Number(nextValue)) || current.birthDate
                        : current.birthDate
                    }));
                  }}
                  onBlur={() => setTouchedFields((current) => ({ ...current, ageMonths: true }))}
                  aria-invalid={touchedFields.ageMonths && Boolean(fieldErrors.ageMonths)}
                  required
                />
                {touchedFields.ageMonths && fieldErrors.ageMonths ? (
                  <small className="field-helper error">{fieldErrors.ageMonths}</small>
                ) : (
                  <small className="field-helper">
                    개월 수를 입력하면 오늘 날짜 기준으로 생년월일이 자동 계산돼요.
                  </small>
                )}
              </label>
              <label className="field">
                <span>생년월일</span>
                <input
                  type="date"
                  value={formState.birthDate}
                  max={getDefaultBirthDate()}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    const derivedAgeMonths = deriveAgeMonthsFromBirthDate(nextValue);

                    setFormState((current) => ({
                      ...current,
                      birthDate: nextValue,
                      ageMonths:
                        derivedAgeMonths === null ? current.ageMonths : String(derivedAgeMonths)
                    }));
                  }}
                  onBlur={() => setTouchedFields((current) => ({ ...current, birthDate: true }))}
                />
                {touchedFields.birthDate && fieldErrors.birthDate ? (
                  <small className="field-helper error">{fieldErrors.birthDate}</small>
                ) : (
                  <small className="field-helper">
                    생년월일을 먼저 입력해도 오늘 기준 개월 수가 자동으로 맞춰져요.
                  </small>
                )}
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
                  setFormState(createEmptyFormState());
                  setTouchedFields({ name: false, ageMonths: false, birthDate: false });
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
