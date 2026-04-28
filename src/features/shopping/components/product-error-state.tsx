interface ProductErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ProductErrorState({ message, onRetry }: ProductErrorStateProps) {
  return (
    <section className="shopping-state-card is-error" role="alert">
      <strong>상품 검색을 완료하지 못했어요</strong>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        다시 시도
      </button>
    </section>
  );
}
