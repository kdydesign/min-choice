import type { MealRecommendation, MealType } from "../../../types/domain";

interface MealResultDetailSectionProps {
  mealType: MealType;
  meal: MealRecommendation;
}

function getFallbackRecipeSummary(recipe: string[]) {
  return recipe.length > 0 ? recipe : ["식단 추천을 다시 생성해 주세요."];
}

export function MealResultDetailSection({ mealType, meal }: MealResultDetailSectionProps) {
  return (
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
                <span className="meal-result-detail-text">{substitutes.join(", ") || "없음"}</span>
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
  );
}
