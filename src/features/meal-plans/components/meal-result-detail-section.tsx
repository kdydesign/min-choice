import type { MealRecommendation, MealType } from "../../../types/domain";

interface MealResultDetailSectionProps {
  mealType: MealType;
  meal: MealRecommendation;
}

export function MealResultDetailSection({ mealType, meal }: MealResultDetailSectionProps) {
  return (
    <div className="meal-result-detail-stack">
      <div className="meal-result-detail-card">
        <h4>사용 재료</h4>
        <div className="meal-result-chip-row">
          {meal.usedIngredients.length > 0 ? (
            meal.usedIngredients.map((ingredient) => (
              <span key={`${mealType}-used-${ingredient}`} className="meal-result-detail-chip">
                {ingredient}
              </span>
            ))
          ) : (
            <span className="meal-result-detail-text">사용된 재료 정보를 준비 중이에요.</span>
          )}
        </div>
        {meal.inputIngredients.length === 0 ? (
          <p className="meal-result-detail-text">입력 재료 없이 자동 추천했어요.</p>
        ) : null}
      </div>

      {meal.isFallback ? (
        <div className="meal-result-detail-card is-warning">
          <h4>안내</h4>
          <p className="meal-result-detail-text">
            후보가 충분하지 않아 시스템 기본 규칙으로 안전한 대체 식단을 구성했어요.
          </p>
        </div>
      ) : null}

      {meal.inputIngredients.length > 0 ? (
        <div className="meal-result-detail-card">
          <h4>입력한 재료</h4>
          <div className="meal-result-chip-row">
            {meal.inputIngredients.map((ingredient) => (
              <span key={`${mealType}-input-${ingredient}`} className="meal-result-detail-chip">
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {meal.recipeFull.length > 0 ? (
        <div className="meal-result-detail-card">
          <h4>상세 조리법</h4>
          <ol className="meal-result-recipe-list is-detailed">
            {meal.recipeFull.map((step) => (
              <li key={`${mealType}-full-${step}`}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="meal-result-detail-card">
        <h4>주의사항</h4>
        <p className="meal-result-detail-text">{meal.caution}</p>
      </div>

      {meal.optionalAddedIngredients.length > 0 ? (
        <div className="meal-result-detail-card">
          <h4>자동 보완 재료</h4>
          <div className="meal-result-chip-row">
            {meal.optionalAddedIngredients.map((ingredient) => (
              <span key={`${mealType}-optional-${ingredient}`} className="meal-result-detail-chip">
                {ingredient}
              </span>
            ))}
          </div>
          <p className="meal-result-detail-text">
            입력 재료가 적거나 없어서 시스템이 함께 고려한 기본 재료예요.
          </p>
        </div>
      ) : null}

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
                <span className="meal-result-detail-text">{substitutes.join(", ") || "없음"}</span>
              </div>
            ))
          ) : (
            <span className="meal-result-detail-text">대체 재료가 필요 없어요.</span>
          )}
        </div>
      </div>

      <div className="meal-result-detail-card">
        <h4>예상 영양 기준</h4>
        <p className="meal-result-detail-text">{meal.nutritionEstimate.basisNote}</p>
      </div>
    </div>
  );
}
