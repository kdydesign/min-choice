import { useEffect, useRef, useState } from "react";
import { AppIcon } from "../../../components/icons/app-icon";
import type { ChildProfile } from "../../../types/domain";
import { getProfileBackgroundColor } from "../lib/profile-tone";
import { ChildCardMenuButton } from "./child-card-menu-button";

interface ChildSelectionCardProps {
  child: ChildProfile;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChildSelectionCard({
  child,
  selected,
  onSelect,
  onEdit,
  onDelete
}: ChildSelectionCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (!isMenuOpen) {
      return;
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isMenuOpen]);

  return (
    <article
      className={`profile-selection-card ${selected ? "selected" : ""}`}
      style={{ backgroundColor: getProfileBackgroundColor(child.id || child.name) }}
    >
      <div className="profile-selection-card-head">
        <div className="profile-selection-card-identity">
          <div className="profile-selection-card-avatar" aria-hidden="true">
            <AppIcon name="childProfile" size={24} />
          </div>
          <div>
            <h3>{child.name}</h3>
            <p>{child.ageMonths}개월</p>
          </div>
        </div>

        <div ref={menuRef} className="child-card-menu-wrap">
          <ChildCardMenuButton
            onClick={() => setIsMenuOpen((current) => !current)}
            ariaLabel={`${child.name} 카드 메뉴 열기`}
            aria-expanded={isMenuOpen}
          />

          {isMenuOpen ? (
            <div className="profile-selection-card-menu-popover">
              <button
                type="button"
                className="profile-selection-card-delete"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
              >
                <span className="profile-selection-card-delete-icon" aria-hidden="true">
                  <AppIcon name="delete" size={18} />
                </span>
                <span>삭제</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="profile-selection-tag-row">
        {(child.allergies.length > 0 ? child.allergies : ["안먹는거 없음"]).map((tag) => (
          <span key={`${child.id}-${tag}`} className="profile-selection-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="profile-selection-actions">
        <button
          type="button"
          className={`profile-selection-button soft ${selected ? "selected" : ""}`}
          onClick={onSelect}
          aria-pressed={selected}
        >
          선택
        </button>
        <button type="button" className="profile-selection-button solid" onClick={onEdit}>
          수정
        </button>
      </div>
    </article>
  );
}
