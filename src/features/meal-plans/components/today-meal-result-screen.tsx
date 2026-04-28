import { useEffect, useState } from "react";
import { CommonHeader } from "../../../components/common-header";
import { AppIcon } from "../../../components/icons/app-icon";
import type { DailyMealPlan, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MealGenerationProgress, type MealGenerationStage } from "./meal-generation-progress";
import { MealProductSearchAction } from "./meal-product-search-action";
import { MealResultCard } from "./meal-result-card";

interface TodayMealResultScreenProps {
  childName: string;
  plan: DailyMealPlan | null;
  title?: string;
  subtitle?: string;
  secondaryActionLabel?: string | null;
  isGenerating?: boolean;
  generationStage?: MealGenerationStage | null;
  isSaving?: boolean;
  isSaved?: boolean;
  saveError?: string | null;
  saveSuccess?: string | null;
  onBack: () => void;
  onSave?: () => void;
}

export function TodayMealResultScreen({
  childName,
  plan,
  title = "오늘의 추천 식단",
  subtitle,
  secondaryActionLabel = "재료 다시 입력",
  isGenerating = false,
  generationStage = null,
  isSaving = false,
  isSaved = false,
  saveError = null,
  saveSuccess = null,
  onBack,
  onSave
}: TodayMealResultScreenProps) {
  const [expandedMealType, setExpandedMealType] = useState<MealType | null>(null);

  useEffect(() => {
    setExpandedMealType(null);
  }, [plan?.id]);

  if (!plan) {
    return (
      <div className="meal-result-screen">
        <CommonHeader title="베베 초이스" onBack={isGenerating ? undefined : onBack} />

        <div className="meal-result-content">
          <section className="figma-screen-head">
            <h1>오늘의 추천 식단</h1>
            <p>생성된 식단이 아직 없어요. 재료를 입력하고 다시 생성해 주세요.</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`meal-result-screen ${isGenerating || isSaving ? "is-busy" : ""}`}
      aria-busy={isGenerating || isSaving}
    >
      <CommonHeader title="베베 초이스" onBack={isGenerating ? undefined : onBack} />

      <div className="meal-result-content">
        <section className="meal-result-title">
          <h1>{title}</h1>
          <p>{subtitle ?? `${childName}를 위한 맞춤 식단입니다`}</p>
        </section>

        {isGenerating && generationStage ? (
          <MealGenerationProgress
            stage={generationStage}
            title="식단 생성 중"
            className="meal-plan-progress-card meal-result-progress-card"
          />
        ) : null}

        {plan.notices.length > 0 ? (
          <div className="notice-list meal-result-notice-list" role="status" aria-live="polite">
            {plan.notices.map((notice) => (
              <div
                key={`${notice.tone}-${notice.message}`}
                className={`notice ${notice.tone} meal-result-inline-notice`}
              >
                {notice.message}
              </div>
            ))}
          </div>
        ) : null}

        {MEAL_TYPES.map((mealType) => {
          const meal = plan.results[mealType];
          const isExpanded = expandedMealType === mealType;

          return (
            <MealResultCard
              key={mealType}
              mealType={mealType}
              meal={meal}
              expanded={isExpanded}
              disabled={isGenerating || isSaving}
              productSearchAction={
                <MealProductSearchAction
                  mealType={mealType}
                  meal={meal}
                  childId={plan.childId}
                  mealPlanId={plan.id}
                  disabled={isGenerating || isSaving}
                />
              }
              onToggle={() =>
                setExpandedMealType((current) => (current === mealType ? null : mealType))
              }
            />
          );
        })}

        <section className="meal-result-tip-card">
          <div className="meal-result-tip-head">
            <span className="meal-result-tip-icon" aria-hidden="true">
              <AppIcon name="tip" size={20} />
            </span>
            <h3>이유식 조리 팁</h3>
          </div>
          <ul>
            <li>재료는 충분히 익혀서 부드럽게 만들어 주세요.</li>
            <li>간은 하지 말고 재료 본연의 맛을 살려 주세요.</li>
            <li>처음 먹는 재료는 소량부터 시작해서 반응을 확인해 주세요.</li>
            <li>조리한 이유식은 냉장 2~3일, 냉동 1주일 이내에 사용하는 편이 안전해요.</li>
          </ul>
        </section>

        {secondaryActionLabel || onSave ? (
          <div className="meal-result-actions">
            {secondaryActionLabel ? (
              <button
                type="button"
                className="meal-result-secondary-button"
                onClick={onBack}
                disabled={isGenerating || isSaving}
              >
                {secondaryActionLabel}
              </button>
            ) : null}
            {onSave ? (
              <button
                type="button"
                className={`meal-result-primary-button ${
                  isSaved ? "is-saved" : isSaving ? "is-saving" : ""
                }`}
                onClick={onSave}
                disabled={isGenerating || isSaving || isSaved}
              >
                {isSaving ? <span className="meal-result-button-spinner" aria-hidden="true" /> : null}
                {isSaved ? "식단 저장 완료" : isSaving ? "식단 저장 중..." : "식단 저장하기"}
              </button>
            ) : null}
          </div>
        ) : null}

        {saveError ? (
          <div className="notice danger meal-result-notice" role="status" aria-live="polite">
            {saveError}
          </div>
        ) : null}
        {!saveError && saveSuccess ? (
          <div className="notice success meal-result-notice" role="status" aria-live="polite">
            {saveSuccess}
          </div>
        ) : null}
      </div>
    </div>
  );
}
