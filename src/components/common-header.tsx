import { AppIcon } from "./icons/app-icon";

interface CommonHeaderProps {
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function CommonHeader({
  title = "베베 초이스",
  onBack,
  showBackButton = true
}: CommonHeaderProps) {
  return (
    <header className="common-mobile-header" aria-label="공통 상단 헤더">
      <div className="common-mobile-header-inner">
        {showBackButton ? (
          <button
            type="button"
            className="common-mobile-header-back"
            onClick={onBack}
            disabled={!onBack}
            aria-label="이전 화면으로"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14.5 6.5L9 12L14.5 17.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <div className="common-mobile-header-back-placeholder" aria-hidden="true" />
        )}

        <div className="common-mobile-header-brand" aria-label={title}>
          <span className="common-mobile-header-avatar" aria-hidden="true">
            <AppIcon name="header" size={24} />
          </span>
          <strong className="common-mobile-header-title">{title}</strong>
        </div>

        <div className="common-mobile-header-back-placeholder" aria-hidden="true" />
      </div>
    </header>
  );
}
