interface LoadingStateProps {
  title: string;
  description: string;
  lines?: number;
}

export function LoadingState({ title, description, lines = 3 }: LoadingStateProps) {
  return (
    <div className="loading-state-card" aria-live="polite" aria-busy="true">
      <div className="loading-state-copy">
        <strong>{title}</strong>
        <p className="subtle">{description}</p>
      </div>
      <div className="loading-state-skeleton" aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={`loading-line-${index}`}
            className={`loading-line ${index === 0 ? "wide" : index === lines - 1 ? "short" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
