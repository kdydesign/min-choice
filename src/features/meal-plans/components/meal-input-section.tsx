import { Panel } from "../../../components/panel";
import { TagInput } from "../../../components/tag-input";
import type { ChildProfile, MealDraft, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

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

  return (
    <Panel
      id={panelId}
      eyebrow="Planner"
      title="끼니별 재료 입력"
      subtitle="태그로 입력하고, 먹이지 않는 재료는 자동으로 경고해요."
    >
      {!selectedChild ? (
        <div className="empty-state">식단을 만들 아이를 먼저 선택해 주세요.</div>
      ) : (
        <>
          {isGenerating && progressLabel ? (
            <div className="progress-card" aria-live="polite">
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
              <article key={mealType} className={`meal-input-card meal-input-card-${mealType}`}>
                <div className="meal-input-head">
                  <div>
                    <p className="meal-input-kicker">{MEAL_LABELS[mealType]}</p>
                    <strong>{`${MEAL_LABELS[mealType]} 재료`}</strong>
                  </div>
                  <span className="meal-input-note">
                    {mealType === "breakfast"
                      ? "부드럽게 시작"
                      : mealType === "lunch"
                        ? "든든한 한 끼"
                        : "편안한 마무리"}
                  </span>
                </div>

                <TagInput
                  label={`${MEAL_LABELS[mealType]} 재료`}
                  hideLabel
                  value={draft[mealType]}
                  placeholder="재료를 입력해 주세요"
                  warningTags={allergyWarnings[mealType]}
                  helperText={
                    allergyWarnings[mealType].length > 0
                      ? `알레르기 재료 ${allergyWarnings[mealType].join(", ")}는 추천 계산에서 제외돼요.`
                      : "쉼표 또는 Enter로 바로 추가할 수 있어요."
                  }
                  onChange={(ingredients) => onChange(mealType, ingredients)}
                />
              </article>
            ))}
          </div>

          {hasAllergyWarnings ? (
            <div className="planner-warning-card">
              <strong>알레르기 주의</strong>
              <div className="notice-list">
                {MEAL_TYPES.flatMap((mealType) =>
                  allergyWarnings[mealType].length > 0 ? (
                    <div key={mealType} className="notice danger">
                      {MEAL_LABELS[mealType]} 입력에서 {allergyWarnings[mealType].join(", ")}는 자동 제외돼요.
                    </div>
                  ) : []
                )}
              </div>
            </div>
          ) : null}

          <div className="planner-action-bar">
            <button
              type="button"
              className="primary planner-cta"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "식단 준비 중" : "오늘 식단 생성"}
            </button>
            <button
              type="button"
              className="ghost small planner-reset"
              onClick={onClear}
              disabled={isGenerating}
            >
              입력 초기화
            </button>
          </div>
        </>
      )}
    </Panel>
  );
}
