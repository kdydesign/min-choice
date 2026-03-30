import { useMemo, useState } from "react";
import { parseDelimitedIngredients, uniqueIngredients } from "../features/ingredients/lib/ingredient-utils";

interface TagInputProps {
  label: string;
  value: string[];
  placeholder: string;
  onChange: (nextValue: string[]) => void;
  helperText?: string;
  warningTags?: string[];
}

export function TagInput({
  label,
  value,
  placeholder,
  onChange,
  helperText,
  warningTags = []
}: TagInputProps) {
  const [draftValue, setDraftValue] = useState("");
  const warningSet = useMemo(() => new Set(warningTags), [warningTags]);

  function commitDraft() {
    if (!draftValue.trim()) {
      return;
    }

    onChange(uniqueIngredients([...value, ...parseDelimitedIngredients(draftValue)]));
    setDraftValue("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  return (
    <label className="field">
      <span>{label}</span>
      <div className="tag-input">
        <div className="tag-list">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-button ${warningSet.has(tag) ? "warning" : ""}`}
              onClick={() => removeTag(tag)}
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
          />
        </div>
      </div>
      {helperText ? <small className="field-helper">{helperText}</small> : null}
    </label>
  );
}
