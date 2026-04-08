import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

interface ChildSelectionRequiredDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M16 13.1V21"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="10" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function ChildSelectionRequiredDialog({
  open,
  onClose,
  onConfirm
}: ChildSelectionRequiredDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="child-selection-required-overlay">
      <section
        className="child-selection-required-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="child-selection-required-content">
          <div className="child-selection-required-icon-shell" aria-hidden="true">
            <span className="child-selection-required-icon-circle">
              <InfoIcon />
            </span>
          </div>

          <div className="child-selection-required-copy">
            <h2 id={titleId}>아이를 선택해주세요</h2>
            <p id={descriptionId}>먼저 아이를 선택해주세요!</p>
          </div>

          <div className="child-selection-required-actions">
            <button
              type="button"
              className="child-selection-required-primary"
              onClick={onConfirm}
              ref={primaryButtonRef}
            >
              아이 선택하러 가기
            </button>
            <button
              type="button"
              className="child-selection-required-secondary"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
