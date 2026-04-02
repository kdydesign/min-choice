import { TagInput } from "../../../components/tag-input";
import type { ChildProfile, MealDraft, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

const MEAL_VISUALS: Record<MealType, { warningColor: string }> = {
  breakfast: {
    warningColor: "#FFE8B3"
  },
  lunch: {
    warningColor: "#D4E8D4"
  },
  dinner: {
    warningColor: "#FFD4C9"
  }
};

interface MealInputSectionProps {
  panelId?: string;
  selectedChild: ChildProfile | null;
  draft: MealDraft;
  allergyWarnings: Record<MealType, string[]>;
  onChange: (mealType: MealType, ingredients: string[]) => void;
  onClear: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  progressLabel?: string;
  progressValue?: number;
}

export function MealInputSection({
  panelId,
  selectedChild,
  draft,
  allergyWarnings,
  onChange,
  onClear,
  onGenerate,
  isGenerating = false,
  progressLabel,
  progressValue = 0
}: MealInputSectionProps) {
  const hasAllergyWarnings = MEAL_TYPES.some((mealType) => allergyWarnings[mealType].length > 0);
  const allergySummary = selectedChild?.allergies.length
    ? `${selectedChild.allergies.join(", ")}는 알레르기 재료라 추천에서 제외해 주세요.`
    : "알레르기 재료가 입력되면 추천 계산에서 자동으로 제외해요.";

  return (
    <section id={panelId} className="meal-plan-input-screen">
      {!selectedChild ? (
        <div className="empty-state">식단을 만들 아이를 먼저 선택해 주세요.</div>
      ) : (
        <>
          {isGenerating && progressLabel ? (
            <div className="progress-card meal-plan-progress-card" aria-live="polite">
              <div className="progress-copy">
                <strong>식단을 준비하고 있어요</strong>
                <span className="subtle">{progressLabel}</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div className="progress-bar" style={{ width: `${progressValue}%` }} />
              </div>
            </div>
          ) : null}

          <div className="meal-input-stack">
            {MEAL_TYPES.map((mealType) => (
              <article key={mealType} className="meal-plan-section-card">
                <div className="meal-plan-section-head">
                  <h3>{`${MEAL_LABELS[mealType]} 재료`}</h3>
                </div>

                <TagInput
                  label={`${MEAL_LABELS[mealType]} 재료`}
                  hideLabel
                  tone={mealType}
                  value={draft[mealType]}
                  placeholder="재료 입력"
                  warningTags={allergyWarnings[mealType]}
                  helperText={
                    allergyWarnings[mealType].length > 0
                      ? `${allergyWarnings[mealType].join(", ")}는 알레르기 재료예요.`
                      : undefined
                  }
                  onChange={(ingredients) => onChange(mealType, ingredients)}
                />
              </article>
            ))}
          </div>

          <div className="meal-plan-info-box">
            <span className="meal-plan-info-icon" aria-hidden="true">
              🧡
            </span>
            <div className="meal-plan-info-copy">
              <p>{allergySummary}</p>
              {hasAllergyWarnings ? (
                <div className="meal-plan-warning-list">
                  {MEAL_TYPES.flatMap((mealType) =>
                    allergyWarnings[mealType].length > 0 ? (
                      <span
                        key={mealType}
                        className="meal-plan-warning-pill"
                        style={{ backgroundColor: MEAL_VISUALS[mealType].warningColor }}
                      >
                        {MEAL_LABELS[mealType]}: {allergyWarnings[mealType].join(", ")}
                      </span>
                    ) : []
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="meal-plan-action-area">
            <button
              type="button"
              className="meal-plan-generate-button"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "식단 준비 중" : "하루 식단 생성하기"}
            </button>
            {MEAL_TYPES.some((mealType) => draft[mealType].length > 0) ? (
              <button
                type="button"
                className="meal-plan-reset-link"
                onClick={onClear}
                disabled={isGenerating}
              >
                입력 초기화
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
