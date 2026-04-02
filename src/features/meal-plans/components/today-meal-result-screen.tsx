import { useEffect, useState } from "react";
import type { DailyMealPlan, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

const MEAL_META: Record<MealType, { icon: string; color: string }> = {
  breakfast: {
    icon: "☀️",
    color: "#4A90E2"
  },
  lunch: {
    icon: "🌤️",
    color: "#6BC47D"
  },
  dinner: {
    icon: "🌙",
    color: "#FF8A7A"
  }
};

interface TodayMealResultScreenProps {
  childName: string;
  plan: DailyMealPlan | null;
  isGenerating?: boolean;
  onBack: () => void;
  onRegenerate?: () => void;
}

function getFallbackRecipeSummary(recipe: string[]) {
  return recipe.length > 0 ? recipe : ["식단 추천을 다시 생성해 주세요."];
}

export function TodayMealResultScreen({
  childName,
  plan,
  isGenerating = false,
  onBack,
  onRegenerate
}: TodayMealResultScreenProps) {
  const [expandedMealType, setExpandedMealType] = useState<MealType | null>("breakfast");

  useEffect(() => {
    setExpandedMealType("breakfast");
  }, [plan?.id]);

  if (!plan) {
    return (
      <div className="meal-result-screen">
        <header className="meal-result-header">
          <div className="meal-result-header-bar">
            <button
              type="button"
              className="meal-result-header-side"
              onClick={onBack}
              aria-label="재료 입력으로 돌아가기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="meal-result-brand">
              <div className="meal-result-brand-mark" aria-hidden="true">
                👶
              </div>
              <h1>베베 초이스</h1>
            </div>
            <div className="meal-result-header-placeholder" aria-hidden="true" />
          </div>
        </header>

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
    <div className="meal-result-screen">
      <header className="meal-result-header">
        <div className="meal-result-header-bar">
          <button
            type="button"
            className="meal-result-header-side"
            onClick={onBack}
            aria-label="재료 입력으로 돌아가기"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="meal-result-brand">
            <div className="meal-result-brand-mark" aria-hidden="true">
              👶
            </div>
            <h1>베베 초이스</h1>
          </div>
          <div className="meal-result-header-placeholder" aria-hidden="true" />
        </div>
      </header>

      <div className="meal-result-content">
        <section className="meal-result-title">
          <h1>오늘의 추천 식단</h1>
          <p>{childName}를 위한 맞춤 식단입니다</p>
        </section>

        {MEAL_TYPES.map((mealType) => {
          const meal = plan.results[mealType];
          const isExpanded = expandedMealType === mealType;

          return (
            <article key={mealType} className="meal-result-card">
              <div className="meal-result-card-head">
                <span className="meal-result-card-emoji" aria-hidden="true">
                  {MEAL_META[mealType].icon}
                </span>
                <h2>{MEAL_LABELS[mealType]}</h2>
              </div>

              <div className="meal-result-card-body">
                <h3 style={{ color: MEAL_META[mealType].color }}>{meal.name}</h3>
                <p className="meal-result-description">{meal.description}</p>

                <div className="meal-result-chip-row">
                  {meal.inputIngredients.map((ingredient) => (
                    <span
                      key={`${mealType}-${ingredient}`}
                      className="meal-result-ingredient-chip"
                      style={{ backgroundColor: `${MEAL_META[mealType].color}22` }}
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>

                <div className="meal-result-stats">
                  <span>🍼 12개월 기준</span>
                  <span>🍽️ {meal.usedIngredients.length}개 사용</span>
                  <span>⏰ 3줄 조리법</span>
                </div>

                <button
                  type="button"
                  className="meal-result-toggle"
                  onClick={() =>
                    setExpandedMealType((current) => (current === mealType ? null : mealType))
                  }
                >
                  <span>{isExpanded ? "접기" : "상세보기"}</span>
                  <svg
                    className={isExpanded ? "rotated" : undefined}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded ? (
                  <div className="meal-result-detail-stack">
                    <div className="meal-result-detail-card">
                      <h4>사용 가능한 재료</h4>
                      <div className="meal-result-chip-row">
                        {meal.usedIngredients.length > 0 ? (
                          meal.usedIngredients.map((ingredient) => (
                            <span key={`${mealType}-used-${ingredient}`} className="meal-result-detail-chip">
                              {ingredient}
                            </span>
                          ))
                        ) : (
                          <span className="meal-result-detail-text">입력 재료가 없어요.</span>
                        )}
                      </div>
                    </div>

                    {meal.missingIngredients.length > 0 ? (
                      <div className="meal-result-detail-card">
                        <h4>부족한 재료</h4>
                        <div className="meal-result-chip-row">
                          {meal.missingIngredients.map((ingredient) => (
                            <span key={`${mealType}-missing-${ingredient}`} className="meal-result-detail-chip">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                        <p className="meal-result-detail-text">{meal.missingIngredientExplanation}</p>
                      </div>
                    ) : null}

                    <div className="meal-result-detail-card">
                      <h4>대체 가능한 재료</h4>
                      <div className="meal-result-detail-list">
                        {Object.entries(meal.substitutes).length > 0 ? (
                          Object.entries(meal.substitutes).map(([ingredient, substitutes]) => (
                            <div key={`${mealType}-${ingredient}`} className="meal-result-substitute-row">
                              <span className="meal-result-detail-chip">{ingredient}</span>
                              <span className="meal-result-arrow">→</span>
                              <span className="meal-result-detail-text">
                                {substitutes.join(", ") || "없음"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="meal-result-detail-text">대체 재료가 필요 없어요.</span>
                        )}
                      </div>
                    </div>

                    <div className="meal-result-detail-card">
                      <h4>주의사항</h4>
                      <p className="meal-result-detail-text">{meal.caution}</p>
                    </div>

                    <div className="meal-result-detail-card">
                      <h4>조리법 3줄</h4>
                      <ol className="meal-result-recipe-list">
                        {getFallbackRecipeSummary(meal.recipeSummary).map((step) => (
                          <li key={`${mealType}-${step}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}

        <section className="meal-result-tip-card">
          <div className="meal-result-tip-head">
            <span aria-hidden="true">💡</span>
            <h3>이유식 조리 팁</h3>
          </div>
          <ul>
            <li>재료는 충분히 익혀서 부드럽게 만들어 주세요.</li>
            <li>간은 하지 말고 재료 본연의 맛을 살려 주세요.</li>
            <li>처음 먹는 재료는 소량부터 시작해서 반응을 확인해 주세요.</li>
            <li>조리한 이유식은 냉장 2~3일, 냉동 1주일 이내에 사용하는 편이 안전해요.</li>
          </ul>
        </section>

        <div className="meal-result-actions">
          <button type="button" className="meal-result-secondary-button" onClick={onBack}>
            재료 다시 입력
          </button>
          {onRegenerate ? (
            <button
              type="button"
              className="meal-result-primary-button"
              onClick={onRegenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "식단 다시 생성 중" : "식단 다시 생성"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
