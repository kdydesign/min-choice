import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "../../../components/icons/app-icon";
import { MobileSelect, type MobileSelectOption, type MobileSelectValue } from "../../../components/mobile-select";
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

interface ChildProfileFormProps {
  initialProfile?: ChildProfile | null;
  layout?: "editor" | "onboarding";
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  showDelete?: boolean;
  submitting?: boolean;
  onSave: (
    payload: Omit<ChildProfile, "id" | "createdAt" | "updatedAt">,
    editingId?: string
  ) => Promise<void> | void;
  onCancel?: () => void;
  onDelete?: (childId: string) => void;
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

interface BirthDateParts {
  year: number;
  month: number;
  day: number;
}

const AGE_MONTH_OPTIONS: MobileSelectOption[] = Array.from({ length: 61 }, (_, ageMonths) => ({
  label: `${ageMonths}개월`,
  value: ageMonths
}));

function toNumericSelectValue(value: MobileSelectValue) {
  return typeof value === "number" ? value : Number(value);
}

function padDateSegment(value: number) {
  return String(value).padStart(2, "0");
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function formatBirthDate({ year, month, day }: BirthDateParts) {
  return `${year}-${padDateSegment(month)}-${padDateSegment(day)}`;
}

function parseBirthDate(value: string): BirthDateParts {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return parseBirthDate(getDefaultBirthDate());
  }

  return { year, month, day };
}

function clampBirthDateParts(parts: BirthDateParts): BirthDateParts {
  const today = parseBirthDate(getDefaultBirthDate());
  const month = Math.min(Math.max(parts.month, 1), 12);
  const day = Math.min(Math.max(parts.day, 1), getDaysInMonth(parts.year, month));
  const nextParts = { year: parts.year, month, day };

  if (formatBirthDate(nextParts) > getDefaultBirthDate()) {
    return today;
  }

  return nextParts;
}

function createBirthYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 7 }, (_, index) => {
    const year = currentYear - index;
    return { label: `${year}년`, value: year };
  });
}

function createBirthMonthOptions(selectedYear: number) {
  const today = parseBirthDate(getDefaultBirthDate());
  const maxMonth = selectedYear === today.year ? today.month : 12;

  return Array.from({ length: maxMonth }, (_, index) => {
    const month = index + 1;
    return { label: `${month}월`, value: month };
  });
}

function createBirthDayOptions(selectedYear: number, selectedMonth: number) {
  const today = parseBirthDate(getDefaultBirthDate());
  const maxDay =
    selectedYear === today.year && selectedMonth === today.month
      ? today.day
      : getDaysInMonth(selectedYear, selectedMonth);

  return Array.from({ length: maxDay }, (_, index) => {
    const day = index + 1;
    return { label: `${day}일`, value: day };
  });
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

function InfoHelper({ children }: { children: string }) {
  return (
    <small className="child-profile-form-helper">
      <span className="child-profile-form-helper-icon" aria-hidden="true">
        i
      </span>
      <span>{children}</span>
    </small>
  );
}

export function ChildProfileForm({
  initialProfile = null,
  layout = "editor",
  submitLabel = initialProfile ? "프로필 수정" : "프로필 저장",
  cancelLabel = "취소",
  showCancel = true,
  showDelete = false,
  submitting = false,
  onSave,
  onCancel,
  onDelete
}: ChildProfileFormProps) {
  const [formState, setFormState] = useState<ProfileFormState>(() =>
    initialProfile ? createFormStateFromProfile(initialProfile) : createEmptyFormState()
  );
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
    setFormState(initialProfile ? createFormStateFromProfile(initialProfile) : createEmptyFormState());
    setTouchedFields({ name: false, ageMonths: false, birthDate: false });
  }, [initialProfile]);

  const fieldErrors = validateProfileForm(formState);
  const isFormValid = !fieldErrors.name && !fieldErrors.ageMonths && !fieldErrors.birthDate;
  const isSubmitDisabled = !isFormValid || submitting;
  const birthDateParts = parseBirthDate(formState.birthDate);
  const birthYearOptions = useMemo(() => createBirthYearOptions(), []);
  const birthMonthOptions = useMemo(
    () => createBirthMonthOptions(birthDateParts.year),
    [birthDateParts.year]
  );
  const birthDayOptions = useMemo(
    () => createBirthDayOptions(birthDateParts.year, birthDateParts.month),
    [birthDateParts.day, birthDateParts.month, birthDateParts.year]
  );

  function resetToInitialState() {
    setFormState(initialProfile ? createFormStateFromProfile(initialProfile) : createEmptyFormState());
    setTouchedFields({ name: false, ageMonths: false, birthDate: false });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProfileForm(formState);

    if (nextErrors.name || nextErrors.ageMonths || nextErrors.birthDate || submitting) {
      setTouchedFields({ name: true, ageMonths: true, birthDate: true });
      return;
    }

    await onSave(
      {
        name: formState.name.trim(),
        ageMonths: Number(formState.ageMonths || "0"),
        birthDate: formState.birthDate.trim(),
        allergies: formState.allergies
      },
      initialProfile?.id
    );

    if (!initialProfile) {
      resetToInitialState();
    }
  }

  function handleCancel() {
    resetToInitialState();
    onCancel?.();
  }

  function updateAgeMonths(nextAgeMonths: number) {
    setFormState((current) => ({
      ...current,
      ageMonths: String(nextAgeMonths),
      birthDate: deriveBirthDateFromAgeMonths(nextAgeMonths) || current.birthDate
    }));
    setTouchedFields((current) => ({ ...current, ageMonths: true }));
  }

  function updateBirthDatePart(part: keyof BirthDateParts, value: MobileSelectValue) {
    const numericValue = toNumericSelectValue(value);

    setFormState((current) => {
      const currentParts = parseBirthDate(current.birthDate);
      const nextParts = clampBirthDateParts({ ...currentParts, [part]: numericValue });
      const nextBirthDate = formatBirthDate(nextParts);
      const derivedAgeMonths = deriveAgeMonthsFromBirthDate(nextBirthDate);

      return {
        ...current,
        birthDate: nextBirthDate,
        ageMonths: derivedAgeMonths === null ? current.ageMonths : String(derivedAgeMonths)
      };
    });
    setTouchedFields((current) => ({ ...current, birthDate: true }));
  }

  const isOnboarding = layout === "onboarding";

  return (
    <form className={`child-profile-form ${isOnboarding ? "onboarding" : "editor"}`} onSubmit={handleSubmit}>
      {isOnboarding ? (
        <>
          <label className="child-profile-onboarding-card is-compact">
            <div className="child-profile-onboarding-card-header">
              <div className="child-profile-onboarding-card-icon name" aria-hidden="true">
                <AppIcon name="name" size={18} />
              </div>
              <span className="child-profile-onboarding-card-label">아이 이름</span>
            </div>
            <input
              className="child-profile-onboarding-input"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
              onBlur={() => setTouchedFields((current) => ({ ...current, name: true }))}
              placeholder="예: 하민"
              maxLength={20}
              aria-invalid={touchedFields.name && Boolean(fieldErrors.name)}
              required
              disabled={submitting}
            />
            {touchedFields.name && fieldErrors.name ? (
              <small className="child-profile-form-error">{fieldErrors.name}</small>
            ) : null}
          </label>

          <section className="child-profile-onboarding-card has-helper" aria-labelledby="child-age-months-label">
            <div className="child-profile-onboarding-card-header">
              <div className="child-profile-onboarding-card-icon months" aria-hidden="true">
                <AppIcon name="ageMonths" size={18} />
              </div>
              <span id="child-age-months-label" className="child-profile-onboarding-card-label">개월 수</span>
            </div>
            <MobileSelect
              value={Number(formState.ageMonths || "0")}
              options={AGE_MONTH_OPTIONS}
              placeholder="개월 수 선택"
              ariaLabel="개월 수 선택"
              onChange={(nextValue) => updateAgeMonths(toNumericSelectValue(nextValue))}
              disabled={submitting}
              error={touchedFields.ageMonths ? fieldErrors.ageMonths : undefined}
            />
            {touchedFields.ageMonths && fieldErrors.ageMonths ? null : (
              <InfoHelper>0개월부터 60개월 사이로 선택해 주세요</InfoHelper>
            )}
          </section>

          <section className="child-profile-onboarding-card is-birth-date" aria-labelledby="child-birth-date-label">
            <div className="child-profile-onboarding-card-header">
              <div className="child-profile-onboarding-card-icon birth" aria-hidden="true">
                <AppIcon name="birthDate" size={18} />
              </div>
              <span id="child-birth-date-label" className="child-profile-onboarding-card-label">생년월일</span>
              <span className="child-profile-onboarding-card-optional">(선택)</span>
            </div>
            <div className="child-profile-birth-selects">
              <MobileSelect
                value={birthDateParts.year}
                options={birthYearOptions}
                placeholder="년"
                ariaLabel="생년월일 연도 선택"
                onChange={(nextValue) => updateBirthDatePart("year", nextValue)}
                disabled={submitting}
                compact
              />
              <MobileSelect
                value={birthDateParts.month}
                options={birthMonthOptions}
                placeholder="월"
                ariaLabel="생년월일 월 선택"
                onChange={(nextValue) => updateBirthDatePart("month", nextValue)}
                disabled={submitting}
                compact
              />
              <MobileSelect
                value={birthDateParts.day}
                options={birthDayOptions}
                placeholder="일"
                ariaLabel="생년월일 일 선택"
                onChange={(nextValue) => updateBirthDatePart("day", nextValue)}
                disabled={submitting}
                compact
              />
            </div>
            {touchedFields.birthDate && fieldErrors.birthDate ? (
              <small className="child-profile-form-error">{fieldErrors.birthDate}</small>
            ) : null}
          </section>

          <div className="child-profile-onboarding-card has-helper is-allergy">
            <div className="child-profile-onboarding-card-header">
              <div className="child-profile-onboarding-card-icon allergy" aria-hidden="true">
                <AppIcon name="allergy" size={18} />
              </div>
              <span className="child-profile-onboarding-card-label">알레르기 재료</span>
              <span className="child-profile-onboarding-card-optional">(선택)</span>
            </div>
            <TagInput
              label="알레르기 재료"
              tone="profile"
              value={formState.allergies}
              placeholder="쉼표 또는 Enter로 추가"
              helperText="예: 두부, 달걀, 땅콩"
              emptyText="안먹는거 없음"
              valuePanel
              hideLabel
              onChange={(allergies) => setFormState((current) => ({ ...current, allergies }))}
              disabled={submitting}
            />
          </div>
        </>
      ) : (
        <>
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
              disabled={submitting}
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
                disabled={submitting}
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
                disabled={submitting}
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
            disabled={submitting}
          />
        </>
      )}

      <div className={`child-profile-form-actions ${isOnboarding ? "onboarding" : "editor"}`}>
        <button
          type="submit"
          className={`child-profile-form-submit ${isSubmitDisabled ? "is-disabled" : "is-enabled"}`}
          disabled={isSubmitDisabled}
          aria-disabled={isSubmitDisabled}
        >
          {isOnboarding ? (
            <span className="child-profile-form-submit-icon" aria-hidden="true">
              <AppIcon name="check" size={16} />
            </span>
          ) : null}
          {submitLabel}
        </button>
        {showCancel ? (
          <button type="button" className="child-profile-form-cancel" onClick={handleCancel} disabled={submitting}>
            {cancelLabel}
          </button>
        ) : null}
        {showDelete && initialProfile && onDelete ? (
          <button
            type="button"
            className="child-profile-form-delete"
            onClick={() => onDelete(initialProfile.id)}
            disabled={submitting}
          >
            프로필 삭제
          </button>
        ) : null}
      </div>
    </form>
  );
}
