import { useEffect, useId, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";

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
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef(0);

  const selectedOption = useMemo(
    () => options.find((option) => isSameValue(value, option.value)) ?? null,
    [options, value]
  );
  const resolvedLabel = label ?? ariaLabel ?? placeholder;

  function focusTrigger() {
    buttonRef.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const profileScroller = document.querySelector<HTMLElement>(".profile-selection-layout");
    const initialScrollTop = profileScroller?.scrollTop ?? 0;

    document.body.classList.add("mobile-select-scroll-lock");
    profileScroller?.classList.add("is-scroll-locked");

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        focusTrigger();
      }
    }

    function handleTouchMove(event: TouchEvent) {
      const target = event.target;

      if (target instanceof Element && target.closest(".mobile-select-options")) {
        return;
      }

      event.preventDefault();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.body.classList.remove("mobile-select-scroll-lock");
      profileScroller?.classList.remove("is-scroll-locked");
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", handleTouchMove);
      window.requestAnimationFrame(() => {
        if (profileScroller) {
          profileScroller.scrollTop = initialScrollTop;
        }
      });
    };
  }, [isOpen]);

  function closeSheet() {
    setIsOpen(false);
    focusTrigger();
  }

  function handleSelect(nextValue: MobileSelectValue) {
    onChange(nextValue);
    closeSheet();
  }

  function handleOptionsTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? 0;
  }

  function handleOptionsTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const optionsElement = optionsRef.current;
    const currentTouchY = event.touches[0]?.clientY ?? touchStartYRef.current;
    const touchDeltaY = currentTouchY - touchStartYRef.current;

    if (!optionsElement) {
      return;
    }

    const isAtTop = optionsElement.scrollTop <= 0;
    const isAtBottom =
      Math.ceil(optionsElement.scrollTop + optionsElement.clientHeight) >= optionsElement.scrollHeight;

    if ((isAtTop && touchDeltaY > 0) || (isAtBottom && touchDeltaY < 0)) {
      event.preventDefault();
    }

    event.stopPropagation();
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
            <div
              ref={optionsRef}
              className="mobile-select-options"
              role="listbox"
              aria-label={resolvedLabel}
              onTouchStart={handleOptionsTouchStart}
              onTouchMove={handleOptionsTouchMove}
            >
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
