import type { ReactNode } from "react";

interface ErrorStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div className="error-state-card" role="alert">
      <div className="error-state-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action ? <div className="error-state-action">{action}</div> : null}
    </div>
  );
}
