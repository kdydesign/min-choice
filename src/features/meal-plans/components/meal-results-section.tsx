import { Panel } from "../../../components/panel";
import type { DailyMealPlan } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

interface MealResultsSectionProps {
  plan: DailyMealPlan | null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function MealResultsSection({ plan }: MealResultsSectionProps) {
  return (
    <Panel eyebrow="Step 3" title="오늘의 추천 식단" subtitle="하루 3끼 결과와 조리 팁">
      {!plan ? (
        <div className="empty-state">아직 생성된 식단이 없어요.</div>
      ) : (
        <>
          <div className="plan-summary">
            <strong>{plan.childName}의 오늘 식단</strong>
            <span>{formatDateTime(plan.createdAt)} 생성 · 알레르기 제외와 중복 방지를 반영했어요.</span>
          </div>

          <div className="notice-list">
            {plan.notices.map((notice) => (
              <div key={`${notice.tone}-${notice.message}`} className={`notice ${notice.tone}`}>
                {notice.message}
              </div>
            ))}
          </div>

          <div className="results-grid">
            {MEAL_TYPES.map((mealType) => {
              const result = plan.results[mealType];

              return (
                <article key={mealType} className="meal-card">
                  <div className="meal-head">
                    <div>
                      <p className="eyebrow">{MEAL_LABELS[mealType]}</p>
                      <h3>{result.name}</h3>
                    </div>
                    <div className="meal-badges">
                      <span className="pill">{result.cookingStyle}</span>
                      {result.isFallback ? <span className="pill warning">기본 문구</span> : null}
                    </div>
                  </div>

                  <div className="notice success">{result.recommendationText}</div>

                  <div className="detail-list">
                    <div className="detail-item">
                      <strong>추천 이유</strong>
                      <span>{result.description}</span>
                    </div>
                    <div className="detail-item">
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
                    <div className="detail-item">
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
                    <div className="detail-item">
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
                    <div className="detail-item">
                      <strong>식감 안내</strong>
                      <span>{result.textureNote}</span>
                    </div>
                    <div className="detail-item">
                      <strong>주의사항</strong>
                      <span>{result.caution}</span>
                    </div>
                    {result.excludedAllergyIngredients.length > 0 ? (
                      <div className="detail-item">
                        <strong>제외된 알레르기 재료</strong>
                        <div className="chip-row">
                          {result.excludedAllergyIngredients.map((ingredient) => (
                            <span key={ingredient} className="inline-chip">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
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

                  <details>
                    <summary>조리법 3줄 보기</summary>
                    <ol>
                      {result.recipeSummary.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </details>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}
