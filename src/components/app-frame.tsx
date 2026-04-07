import type { PropsWithChildren, ReactNode } from "react";
import { BrandLogo } from "./brand-logo";
import { CommonBottomMenu } from "./common-bottom-menu";
import { useAuth } from "../features/auth/hooks/use-auth";
import { PwaStatusBanner } from "../features/pwa/components/pwa-status-banner";

interface AppFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  context?: ReactNode;
  showIntro?: boolean;
  showTopbar?: boolean;
}

export function AppFrame({
  title,
  subtitle,
  context,
  showIntro = true,
  showTopbar = true,
  children
}: AppFrameProps) {
  const { identityLabel, providerLabel } = useAuth();

  return (
    <div className="app-shell">
      <PwaStatusBanner />

      {showTopbar ? (
        <header className="app-topbar">
          <div className="app-topbar-row">
            <div className="brand-lockup">
              <BrandLogo compact />
            </div>

            <div className="auth-summary">
              <span className="inline-chip">{providerLabel}</span>
              <span className="subtle">{identityLabel}</span>
            </div>
          </div>
        </header>
      ) : null}

      <main className="screen-stack">
        {showIntro ? (
          <section className="screen-intro">
            <div>
              <p className="eyebrow">Bebe Choice</p>
              <h1>{title}</h1>
              {subtitle ? <p className="subtle">{subtitle}</p> : null}
            </div>
            {context ? <div className="screen-context">{context}</div> : null}
          </section>
        ) : null}

        {children}
      </main>

      <CommonBottomMenu />
    </div>
  );
}
