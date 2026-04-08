import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

interface SessionCheckingOverlayProps {
  title?: string;
  description?: string;
}

function SpinnerIcon() {
  return (
    <span className="session-checking-spinner" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeOpacity="0.24" strokeWidth="4" />
        <path
          d="M16 3.5A12.5 12.5 0 0 1 28.5 16"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function SessionCheckingOverlay({
  title = "로그인 세션 확인중...",
  description = "잠시만 기다려주세요"
}: SessionCheckingOverlayProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="session-checking-overlay"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <section className="session-checking-popup">
        <div className="session-checking-popup-inner">
          <div className="session-checking-icon-shell">
            <span className="session-checking-icon-circle">
              <SpinnerIcon />
            </span>
          </div>

          <div className="session-checking-copy">
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
