import { PRODUCT_SEARCH_NOTICES } from "../types";
import { AppIcon } from "../../../components/icons/app-icon";

export function ShoppingDisclaimer() {
  return (
    <section className="shopping-disclaimer" aria-label="상품 검색 고지">
      <span className="shopping-disclaimer-icon" aria-hidden="true">
        <AppIcon name="allergy" size={16} />
      </span>
      <div>
        {PRODUCT_SEARCH_NOTICES.map((notice) => (
          <p key={notice}>{notice}</p>
        ))}
      </div>
    </section>
  );
}
