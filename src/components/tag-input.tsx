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
  inputStyle?: "default" | "dashed-add";
  expandedPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
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
  inputStyle = "default",
  expandedPlaceholder = "재료를 입력하세요 (쉼표나 줄바꿈으로 구분)",
  confirmLabel = "추가",
  cancelLabel = "취소",
  disabled = false
}: TagInputProps) {
  const [draftValue, setDraftValue] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const warningSet = useMemo(() => new Set(warningTags), [warningTags]);

  function commitDraft() {
    if (disabled) {
      return;
    }

    const nextIngredients = parseDelimitedIngredients(draftValue);

    if (nextIngredients.length === 0) {
      return;
    }

    onChange(uniqueIngredients([...value, ...nextIngredients]));
    setDraftValue("");
    setIsComposerOpen(false);
  }

  function removeTag(tag: string) {
    if (disabled) {
      return;
    }

    onChange(value.filter((item) => item !== tag));
  }

  function closeComposer() {
    setDraftValue("");
    setIsComposerOpen(false);
  }

  const tagInputClassName = [
    "tag-input",
    `tag-input-${tone}`,
    inputStyle === "dashed-add" ? "is-dashed-add" : "",
    isComposerOpen ? "is-expanded" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="field">
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <div className={tagInputClassName} data-expanded={isComposerOpen}>
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

          {inputStyle === "dashed-add" ? (
            isComposerOpen ? (
              <div className="tag-input-composer">
                <textarea
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  placeholder={expandedPlaceholder}
                  disabled={disabled}
                  rows={3}
                  aria-label={label}
                  autoFocus
                />
                <div className="tag-input-composer-actions">
                  <button type="button" className="tag-input-composer-confirm" onClick={commitDraft} disabled={disabled}>
                    {confirmLabel}
                  </button>
                  <button type="button" className="tag-input-composer-cancel" onClick={closeComposer} disabled={disabled}>
                    {cancelLabel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="tag-input-entry dashed-add"
                onClick={() => {
                  if (!disabled) {
                    setIsComposerOpen(true);
                  }
                }}
                disabled={disabled}
              >
                <span className="tag-input-entry-icon" aria-hidden="true">
                  +
                </span>
                <span className="tag-input-entry-label">{placeholder}</span>
              </button>
            )
          ) : (
            <div className="tag-input-entry">
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
                aria-label={label}
              />
            </div>
          )}
        </div>
      </div>
      {helperText ? <small className="field-helper">{helperText}</small> : null}
    </div>
  );
}
