import type { ReactNode } from "react";
import { TagInput } from "../../../components/tag-input";
import type { MealType } from "../../../types/domain";

interface MealIngredientCardProps {
  mealType: MealType;
  title: string;
  value: string[];
  warningTags?: string[];
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  icon?: ReactNode;
  onChange: (ingredients: string[]) => void;
}

export function MealIngredientCard({
  mealType,
  title,
  value,
  warningTags = [],
  placeholder = "재료 추가",
  helperText,
  disabled = false,
  icon,
  onChange
}: MealIngredientCardProps) {
  return (
    <article className={`meal-plan-section-card meal-plan-section-card-${mealType}`}>
      <div className="meal-plan-section-head">
        {icon ? <span className="meal-plan-section-icon">{icon}</span> : null}
        <h3>{title}</h3>
      </div>

      <TagInput
        label={title}
        hideLabel
        tone={mealType}
        value={value}
        placeholder={placeholder}
        helperText={helperText}
        warningTags={warningTags}
        inputStyle="dashed-add"
        disabled={disabled}
        onChange={onChange}
      />
    </article>
  );
}
