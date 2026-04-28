import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ShoppingResultHeaderProps {
  title: string;
  subtitle: string;
  variant: "meal" | "manual";
  children?: ReactNode;
}

export function ShoppingResultHeader({
  title,
  subtitle,
  variant,
  children
}: ShoppingResultHeaderProps) {
  const navigate = useNavigate();

  function handleBack() {
    navigate("/shopping", { replace: true });
  }

  return (
    <header className={`shopping-result-header shopping-result-header-${variant}`}>
      <div className="shopping-result-title-row">
        <button
          type="button"
          className="shopping-result-back-button"
          onClick={handleBack}
          aria-label="찾기 화면으로 돌아가기"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 6L9 12L15 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </header>
  );
}
