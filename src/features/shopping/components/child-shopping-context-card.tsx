import { AppIcon } from "../../../components/icons/app-icon";
import type { ChildProfile } from "../../../types/domain";

interface ChildShoppingContextCardProps {
  child: ChildProfile | null;
}

export function ChildShoppingContextCard({ child }: ChildShoppingContextCardProps) {
  if (!child) {
    return (
      <section className="shopping-child-card">
        <div className="shopping-child-head">
          <div className="shopping-child-icon" aria-hidden="true">
            <AppIcon name="childProfile" size={22} />
          </div>
          <div className="shopping-child-copy">
            <strong>선택된 아이가 없어요</strong>
            <p>검색어를 직접 입력해서 기성제품을 찾아볼 수 있어요.</p>
          </div>
        </div>
        <div className="shopping-child-notice">
          <AppIcon name="tip" size={16} />
          <span>아이를 선택하면 등록된 알레르기 키워드를 상품명 기준으로 먼저 걸러볼게요</span>
        </div>
      </section>
    );
  }

  return (
    <section className="shopping-child-card">
      <div className="shopping-child-head">
        <div className="shopping-child-icon" aria-hidden="true">
          <AppIcon name="childProfile" size={22} />
        </div>
        <div className="shopping-child-copy">
          <strong>
            {child.name} · {child.ageMonths}개월
          </strong>
          <p>
            알레르기:{" "}
            {child.allergies.length > 0 ? child.allergies.join(", ") : "등록된 알레르기 없음"}
          </p>
        </div>
      </div>
      <div className="shopping-child-notice">
        <AppIcon name="tip" size={16} />
        <span>등록된 알레르기 재료는 상품명 기준으로 먼저 걸러볼게요</span>
      </div>
    </section>
  );
}
