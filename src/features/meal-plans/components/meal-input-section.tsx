import { AppIcon } from "../../../components/icons/app-icon";
import type { ChildProfile, MealDraft, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";
import { MealGenerationProgress, type MealGenerationStage } from "./meal-generation-progress";
import { MealIngredientCard } from "./meal-ingredient-card";

interface MealInputSectionProps {
  panelId?: string;
  selectedChild: ChildProfile | null;
  draft: MealDraft;
  allergyWarnings: Record<MealType, string[]>;
  onChange: (mealType: MealType, ingredients: string[]) => void;
  onClear: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  generationStage?: MealGenerationStage | null;
  showReset?: boolean;
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
  generationStage = null,
  showReset = true
}: MealInputSectionProps) {
  const hasMealInput = MEAL_TYPES.some((mealType) => draft[mealType].length > 0);
  const activeWarnings = MEAL_TYPES.flatMap((mealType) => allergyWarnings[mealType]);
  const allergySummary =
    activeWarnings.length > 0
      ? `${activeWarnings.join(", ")}는 알레르기 재료로 추천에서 제외해 주세요.`
      : selectedChild?.allergies.length
        ? `${selectedChild.allergies.join(", ")}는 알레르기 재료로 추천에서 제외해 주세요.`
        : "알레르기 재료는 추천에서 제외해 주세요.";

  return (
    <section
      id={panelId}
      className={`meal-plan-input-screen ${isGenerating ? "is-busy" : ""}`}
      aria-busy={isGenerating}
    >
      {!selectedChild ? (
        <div className="empty-state">식단을 만들 아이를 먼저 선택해 주세요.</div>
      ) : (
        <>
          {isGenerating && generationStage ? (
            <MealGenerationProgress
              stage={generationStage}
              title="식단 생성 중"
              className="meal-plan-progress-card"
            />
          ) : null}

          <div className="meal-input-stack">
            {MEAL_TYPES.map((mealType) => (
              <MealIngredientCard
                key={mealType}
                mealType={mealType}
                title={`${MEAL_LABELS[mealType]} 재료`}
                icon={
                  <AppIcon
                    name={mealType === "breakfast" ? "breakfast" : mealType === "lunch" ? "lunch" : "dinner"}
                    size={20}
                  />
                }
                value={draft[mealType]}
                warningTags={allergyWarnings[mealType]}
                placeholder="재료 추가"
                disabled={isGenerating}
                onChange={(ingredients) => onChange(mealType, ingredients)}
              />
            ))}
          </div>

          <div className="meal-plan-info-box">
            <span className="meal-plan-info-icon" aria-hidden="true">
              <AppIcon name="allergy" size={20} />
            </span>
            <div className="meal-plan-info-copy">
              <p>{allergySummary}</p>
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
            {showReset && hasMealInput ? (
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
