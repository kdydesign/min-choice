function HistoryCalendarIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="14" y="16" width="36" height="34" rx="7" stroke="currentColor" strokeWidth="3.5" />
      <path d="M14 27h36" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 12v8M40 12v8" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function MealHistoryEmptyView() {
  return (
    <section className="history-empty-view" aria-labelledby="history-empty-title">
      <div className="history-empty-icon" aria-hidden="true">
        <HistoryCalendarIcon />
      </div>
      <div className="history-empty-copy">
        <h2 id="history-empty-title">식단 이력이 없습니다</h2>
        <p>오늘 식단 탭에서 식단을 생성하면</p>
        <p>여기에 이력이 저장됩니다</p>
      </div>
    </section>
  );
}
