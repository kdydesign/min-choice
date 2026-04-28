import type { ChildProfile } from "../../../types/domain";
import type { ProductSearchCategory } from "../types";

interface RecommendedProductSearchChipsProps {
  child: ChildProfile | null;
  disabled?: boolean;
  onSelect: (query: string, category: ProductSearchCategory) => void;
}

const BASE_RECOMMENDATIONS: Array<{ query: string; category: ProductSearchCategory }> = [
  { query: "소고기 이유식", category: "baby_food" },
  { query: "고구마 퓨레", category: "snack" },
  { query: "아기반찬", category: "baby_side_dish" },
  { query: "유아식 간식", category: "snack" }
];

function includesAllergyKeyword(query: string, allergies: string[]) {
  return allergies.some((allergy) => allergy.trim() && query.includes(allergy.trim()));
}

export function RecommendedProductSearchChips({
  child,
  disabled = false,
  onSelect
}: RecommendedProductSearchChipsProps) {
  const allergies = child?.allergies ?? [];
  const recommendations = BASE_RECOMMENDATIONS.filter(
    (item) => !includesAllergyKeyword(item.query, allergies)
  );

  return (
    <section className="shopping-chip-section" aria-label="추천 검색어">
      <div className="shopping-section-head">
        <h2>추천 검색어</h2>
        <p>직접 눌러 검색할 수 있어요.</p>
      </div>
      <div className="shopping-chip-row">
        {recommendations.map((item) => (
          <button
            key={`${item.category}-${item.query}`}
            type="button"
            className="shopping-chip"
            disabled={disabled}
            onClick={() => onSelect(item.query, item.category)}
          >
            {item.query}
          </button>
        ))}
      </div>
    </section>
  );
}
