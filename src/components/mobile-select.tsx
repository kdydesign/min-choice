import { useEffect, useId, useMemo, useRef, useState } from "react";

export type MobileSelectValue = string | number;

export interface MobileSelectOption {
  label: string;
  value: MobileSelectValue;
}

interface MobileSelectProps {
  label?: string;
  value: MobileSelectValue | null;
  options: MobileSelectOption[];
  placeholder?: string;
  onChange: (value: MobileSelectValue) => void;
  disabled?: boolean;
  error?: string;
  ariaLabel?: string;
  compact?: boolean;
}

function isSameValue(left: MobileSelectValue | null, right: MobileSelectValue) {
  return String(left) === String(right);
}

export function MobileSelect({
  label,
  value,
  options,
  placeholder = "선택해 주세요",
  onChange,
  disabled = false,
  error,
  ariaLabel,
  compact = false
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => isSameValue(value, option.value)) ?? null,
    [options, value]
  );
  const resolvedLabel = label ?? ariaLabel ?? placeholder;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function closeSheet() {
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function handleSelect(nextValue: MobileSelectValue) {
    onChange(nextValue);
    closeSheet();
  }

  return (
    <div className={`mobile-select ${compact ? "is-compact" : ""}`}>
      {label ? <span className="mobile-select-label">{label}</span> : null}
      <button
        ref={buttonRef}
        type="button"
        className={`mobile-select-trigger ${selectedOption ? "has-value" : "is-placeholder"}`}
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? label}
        aria-invalid={Boolean(error)}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span className="mobile-select-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {error ? <small className="mobile-select-error">{error}</small> : null}

      {isOpen ? (
        <div className="mobile-select-layer" role="presentation">
          <button
            type="button"
            className="mobile-select-backdrop"
            aria-label="선택 닫기"
            onClick={closeSheet}
          />
          <div className="mobile-select-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="mobile-select-sheet-head">
              <strong id={titleId}>{resolvedLabel}</strong>
              <button type="button" className="mobile-select-close" onClick={closeSheet}>
                닫기
              </button>
            </div>
            <div className="mobile-select-options" role="listbox" aria-label={resolvedLabel}>
              {options.map((option) => {
                const isSelected = isSameValue(value, option.value);

                return (
                  <button
                    key={`${option.value}`}
                    type="button"
                    className={`mobile-select-option ${isSelected ? "is-selected" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <span className="mobile-select-option-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
