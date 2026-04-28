import { type FormEvent, useEffect, useState } from "react";
import { AppIcon } from "../../../components/icons/app-icon";

interface ProductSearchBarProps {
  value: string;
  disabled?: boolean;
  variant?: "landing" | "result";
  placeholder?: string;
  helperText?: string;
  onSubmit: (query: string) => void;
}

export function ProductSearchBar({
  value,
  disabled = false,
  variant = "landing",
  placeholder = "예: 소고기 이유식",
  helperText,
  onSubmit
}: ProductSearchBarProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(draft);
  }

  return (
    <form className={`product-search-bar product-search-bar-${variant}`} onSubmit={handleSubmit}>
      <label htmlFor={`product-search-input-${variant}`}>상품 검색어</label>
      <div className="product-search-input-row">
        <input
          id={`product-search-input-${variant}`}
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="상품 검색어"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label="상품 검색"
        >
          <AppIcon name="navShopping" size={20} />
        </button>
      </div>
      {helperText ? <p>{helperText}</p> : null}
    </form>
  );
}
