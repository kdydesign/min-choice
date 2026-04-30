import { useId, type ReactNode } from "react";

interface ProgressLayerDialogProps {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

function ProgressLayerSpinner() {
  return (
    <span className="progress-layer-dialog-spinner" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4a8 8 0 1 1-8 8"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ProgressLayerDialog({
  title,
  description,
  className,
  children
}: ProgressLayerDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      className={`progress-layer-dialog-overlay${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-live="polite"
      aria-busy="true"
    >
      <section className="progress-layer-dialog-popup">
        <h3 id={titleId} className="progress-layer-dialog-title">
          {title}
        </h3>
        {description ? (
          <p id={descriptionId} className="progress-layer-dialog-description">
            {description}
          </p>
        ) : null}
        {children ? (
          <div className="progress-layer-dialog-content">{children}</div>
        ) : (
          <ProgressLayerSpinner />
        )}
      </section>
    </div>
  );
}
