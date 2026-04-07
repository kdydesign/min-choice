import type { ReactNode } from "react";

interface AuthActionButtonProps {
  variant: "google" | "anonymous";
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
}

export function AuthActionButton({
  variant,
  icon,
  label,
  disabled = false,
  busy = false,
  onClick
}: AuthActionButtonProps) {
  return (
    <button
      type="button"
      className={`auth-action-button ${variant === "google" ? "google" : "anonymous"}`}
      disabled={disabled}
      aria-busy={busy}
      onClick={onClick}
    >
      <span className="auth-action-button-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="auth-action-button-label">{label}</span>
    </button>
  );
}
