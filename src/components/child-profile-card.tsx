import type { ReactNode } from "react";
import type { ChildProfile } from "../types/domain";

interface ChildProfileCardProps {
  child: ChildProfile;
  label?: string;
  helperText?: string;
  tone?: "warm" | "neutral";
  footer?: ReactNode;
}

export function ChildProfileCard({
  child,
  label = "선택된 아이",
  helperText,
  tone = "warm",
  footer
}: ChildProfileCardProps) {
  return (
    <div className={`child-profile-card child-profile-card-${tone}`}>
      <div className="child-profile-card-head">
        <div>
          <p className="eyebrow">{label}</p>
          <strong>{child.name}</strong>
        </div>
        <span className="pill">{child.ageMonths}개월</span>
      </div>

      <div className="child-profile-card-block">
        <span className="child-profile-card-label">알레르기</span>
        <div className="child-profile-card-tags">
          {child.allergies.length > 0 ? (
            child.allergies.map((allergy) => (
              <span key={allergy} className="inline-chip child-profile-card-allergy">
                {allergy}
              </span>
            ))
          ) : (
            <span className="inline-chip child-profile-card-safe">없음</span>
          )}
        </div>
      </div>

      {helperText ? <p className="subtle child-profile-card-helper">{helperText}</p> : null}
      {footer ? <div className="child-profile-card-footer">{footer}</div> : null}
    </div>
  );
}
