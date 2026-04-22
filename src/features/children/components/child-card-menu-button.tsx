import type { ComponentPropsWithoutRef } from "react";

interface ChildCardMenuButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type" | "aria-label"> {
  ariaLabel: string;
}

export function ChildCardMenuButton({
  ariaLabel,
  className,
  ...buttonProps
}: ChildCardMenuButtonProps) {
  return (
    <button
      type="button"
      className={className ? `child-card-menu-button ${className}` : "child-card-menu-button"}
      aria-label={ariaLabel}
      {...buttonProps}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    </button>
  );
}
