interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={`brand-logo ${compact ? "compact" : ""}`} aria-label="Bebe Choice">
      <div className="brand-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" role="presentation">
          <defs>
            <linearGradient id="bebeChoiceGradient" x1="12" y1="14" x2="84" y2="84">
              <stop offset="0%" stopColor="#ffd7ca" />
              <stop offset="50%" stopColor="#ffb7a0" />
              <stop offset="100%" stopColor="#ffe08d" />
            </linearGradient>
          </defs>
          <rect x="10" y="10" width="76" height="76" rx="28" fill="url(#bebeChoiceGradient)" />
          <circle cx="35" cy="42" r="6" fill="#fff8f3" />
          <circle cx="61" cy="42" r="6" fill="#fff8f3" />
          <path
            d="M30 60C34.5 66 41 69 48 69C55 69 61.5 66 66 60"
            stroke="#fff8f3"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M26 28C29 22 35 18 42 18"
            stroke="#fff8f3"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M70 28C67 22 61 18 54 18"
            stroke="#fff8f3"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="brand-logo-copy">
        <span className="brand-logo-overline">Baby Meal Planner</span>
        <strong>베베 초이스</strong>
        <span>Bebe Choice</span>
      </div>
    </div>
  );
}
