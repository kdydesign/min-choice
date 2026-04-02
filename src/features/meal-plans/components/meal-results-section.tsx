import { useEffect, useState } from "react";
import { Panel } from "../../../components/panel";
import { EmptyState } from "../../../components/empty-state";
import type { DailyMealPlan, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

const MEAL_VISUALS: Record<MealType, { icon: string; summary: string }> = {
  breakfast: {
    icon: "☀️",
    summary: "부드럽고 가벼운 시작"
  },
  lunch: {
    icon: "🌿",
    summary: "영양 균형을 챙긴 한 끼"
  },
  dinner: {
    icon: "🌙",
    summary: "편안하게 마무리하는 저녁"
  }
};

interface MealResultsSectionProps {
  panelId?: string;
  plan: DailyMealPlan | null;
  emptyMessage?: string;
  onEditInputs?: () => void;
  onRegenerate?: () => void;
  isGenerating?: boolean;
  hidePanelHeader?: boolean;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function MealResultsSection({
  panelId,
  plan,
  emptyMessage = "아직 생성된 식단이 없어요.",
  onEditInputs,
  onRegenerate,
  isGenerating = false,
  hidePanelHeader = false
}: MealResultsSectionProps) {
  const [expandedMealType, setExpandedMealType] = useState<MealType | null>("breakfast");

  useEffect(() => {
    setExpandedMealType("breakfast");
  }, [plan?.id]);

  return (
    <Panel
      id={panelId}
      eyebrow="Today"
      title="오늘의 추천 식단"
      subtitle="하루 3끼 결과와 조리 팁"
      className="planner-panel planner-results-panel"
      hideHeader={hidePanelHeader}
    >
      {!plan ? (
        <EmptyState
          title="오늘 식단이 아직 없어요"
          description={emptyMessage}
          action={
            onEditInputs ? (
              <button type="button" className="secondary small" onClick={onEditInputs}>
                재료 입력하러 가기
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="plan-summary plan-summary-hero">
            <div>
              <strong>{plan.childName}의 오늘 식단</strong>
              <span>{formatDateTime(plan.createdAt)} 생성 · 알레르기 제외와 중복 방지를 반영했어요.</span>
            </div>
            {onEditInputs || onRegenerate ? (
              <div className="plan-summary-actions">
                {onEditInputs ? (
                  <button type="button" className="secondary small" onClick={onEditInputs}>
                    재료 수정
                  </button>
                ) : null}
                {onRegenerate ? (
                  <button
                    type="button"
                    className="primary small"
                    onClick={onRegenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "다시 만드는 중" : "다시 생성"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="notice-list">
            {plan.notices.map((notice) => (
              <div key={`${notice.tone}-${notice.message}`} className={`notice ${notice.tone}`}>
                {notice.message}
              </div>
            ))}
          </div>

          <div className="meal-quick-nav" aria-label="끼니 바로가기">
            {MEAL_TYPES.map((mealType) => {
              const result = plan.results[mealType];

              return (
                <button
                  key={`quick-${mealType}`}
                  type="button"
                  className={`meal-quick-chip ${expandedMealType === mealType ? "active" : ""}`}
                  onClick={() => setExpandedMealType(mealType)}
                  aria-pressed={expandedMealType === mealType}
                >
                  <span className="meal-quick-chip-label">{MEAL_LABELS[mealType]}</span>
                  <strong>{result.name}</strong>
                </button>
              );
            })}
          </div>

          <div className="results-grid">
            {MEAL_TYPES.map((mealType) => {
              const result = plan.results[mealType];
              const isExpanded = expandedMealType === mealType;

              return (
                <article
                  key={mealType}
                  className={`meal-card meal-card-${mealType} ${isExpanded ? "expanded" : ""}`}
                >
                  <div className="meal-head">
                    <div className="meal-title-block">
                      <span className="meal-icon" aria-hidden="true">
                        {MEAL_VISUALS[mealType].icon}
                      </span>
                      <div>
                        <p className="eyebrow">{MEAL_LABELS[mealType]}</p>
                        <h3>{result.name}</h3>
                      </div>
                    </div>
                    <div className="meal-badges">
                      <span className="pill">{result.cookingStyle}</span>
                      {result.isFallback ? <span className="pill warning">기본 문구</span> : null}
                    </div>
                  </div>

                  <div className="meal-card-lead">
                    <span className="meal-summary-pill">{MEAL_VISUALS[mealType].summary}</span>
                    <div className="notice success">{result.recommendationText}</div>
                  </div>

                  {result.excludedAllergyIngredients.length > 0 ? (
                    <div className="notice danger">
                      제외된 알레르기 재료: {result.excludedAllergyIngredients.join(", ")}
                    </div>
                  ) : null}

                  <div className="meal-card-summary">
                    <span className="inline-chip">사용 재료 {result.usedIngredients.length}개</span>
                    <span className="inline-chip">부족 재료 {result.missingIngredients.length}개</span>
                    <span className="inline-chip">조리법 3줄</span>
                  </div>

                  <button
                    type="button"
                    className="secondary small meal-toggle"
                    onClick={() =>
                      setExpandedMealType((current) => (current === mealType ? null : mealType))
                    }
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? "상세 접기" : "상세 보기"}
                  </button>

                  {isExpanded ? (
                    <div className="meal-card-details">
                      <div className="detail-list">
                        <div className="detail-item detail-surface">
                          <strong>추천 이유</strong>
                          <span>{result.description}</span>
                        </div>
                        <div className="detail-item detail-surface">
                          <strong>사용 가능한 재료</strong>
                          <div className="chip-row">
                            {result.usedIngredients.length > 0 ? (
                              result.usedIngredients.map((ingredient) => (
                                <span key={ingredient} className="inline-chip">
                                  {ingredient}
                                </span>
                              ))
                            ) : (
                              <span className="inline-chip">입력 재료 없음</span>
                            )}
                          </div>
                        </div>
                        <div className="detail-item detail-surface">
                          <strong>부족한 재료</strong>
                          <div className="chip-row">
                            {result.missingIngredients.length > 0 ? (
                              result.missingIngredients.map((ingredient) => (
                                <span key={ingredient} className="inline-chip">
                                  {ingredient}
                                </span>
                              ))
                            ) : (
                              <span className="inline-chip">추가 재료 없이 가능</span>
                            )}
                          </div>
                          <p className="subtle">{result.missingIngredientExplanation}</p>
                        </div>
                        <div className="detail-item detail-surface">
                          <strong>대체 가능한 재료</strong>
                          <div className="chip-row">
                            {Object.entries(result.substitutes).length > 0 ? (
                              Object.entries(result.substitutes).map(([ingredient, substitutes]) => (
                                <span key={ingredient} className="inline-chip">
                                  {ingredient} → {substitutes.join(", ") || "없음"}
                                </span>
                              ))
                            ) : (
                              <span className="inline-chip">대체 재료 필요 없음</span>
                            )}
                          </div>
                        </div>
                        <div className="detail-item detail-surface">
                          <strong>식감 안내</strong>
                          <span>{result.textureNote}</span>
                        </div>
                        <div className="detail-item detail-surface">
                          <strong>주의사항</strong>
                          <span>{result.caution}</span>
                        </div>
                        <div className="detail-item detail-item-recipe detail-surface">
                          <strong>조리법 3줄</strong>
                          <ol className="recipe-list">
                            {result.recipeSummary.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {result.alternatives.length > 0 ? (
                        <div>
                          <strong>다른 후보 메뉴</strong>
                          <div className="alternatives">
                            {result.alternatives.map((alternative) => (
                              <span key={alternative} className="tag-button static">
                                {alternative}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}
