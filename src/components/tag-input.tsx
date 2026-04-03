import { useMemo, useState } from "react";
import { parseDelimitedIngredients, uniqueIngredients } from "../features/ingredients/lib/ingredient-utils";

interface TagInputProps {
  label: string;
  value: string[];
  placeholder: string;
  onChange: (nextValue: string[]) => void;
  helperText?: string;
  warningTags?: string[];
  hideLabel?: boolean;
  tone?: "neutral" | "breakfast" | "lunch" | "dinner" | "profile";
  disabled?: boolean;
}

export function TagInput({
  label,
  value,
  placeholder,
  onChange,
  helperText,
  warningTags = [],
  hideLabel = false,
  tone = "neutral",
  disabled = false
}: TagInputProps) {
  const [draftValue, setDraftValue] = useState("");
  const warningSet = useMemo(() => new Set(warningTags), [warningTags]);

  function commitDraft() {
    if (disabled || !draftValue.trim()) {
      return;
    }

    onChange(uniqueIngredients([...value, ...parseDelimitedIngredients(draftValue)]));
    setDraftValue("");
  }

  function removeTag(tag: string) {
    if (disabled) {
      return;
    }

    onChange(value.filter((item) => item !== tag));
  }

  return (
    <label className="field">
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <div className={`tag-input tag-input-${tone}`}>
        <div className="tag-list">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-button ${warningSet.has(tag) ? "warning" : ""}`}
              onClick={() => removeTag(tag)}
              disabled={disabled}
            >
              {tag}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <input
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitDraft();
              }
            }}
            onBlur={commitDraft}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      </div>
      {helperText ? <small className="field-helper">{helperText}</small> : null}
    </label>
  );
}
