import type { PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { BrandLogo } from "./brand-logo";
import { useAuth } from "../features/auth/hooks/use-auth";
import { PwaStatusBanner } from "../features/pwa/components/pwa-status-banner";

interface AppFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  context?: ReactNode;
}

export function AppFrame({ title, subtitle, context, children }: AppFrameProps) {
  const { identityLabel, providerLabel } = useAuth();

  return (
    <div className="app-shell">
      <PwaStatusBanner />

      <header className="app-topbar">
        <div className="brand-lockup">
          <BrandLogo compact />
        </div>

        <div className="topbar-actions">
          <div className="auth-summary">
            <span className="inline-chip">{providerLabel}</span>
            <span className="subtle">{identityLabel}</span>
          </div>
        </div>
      </header>

      <main className="screen-stack">
        <section className="screen-intro">
          <div>
            <p className="eyebrow">Bebe Choice</p>
            <h1>{title}</h1>
            {subtitle ? <p className="subtle">{subtitle}</p> : null}
          </div>
          {context ? <div className="screen-context">{context}</div> : null}
        </section>

        {children}
      </main>

      <nav className="bottom-nav" aria-label="주요 탐색">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          오늘 식단
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          최근 식단
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          아이 프로필
        </NavLink>
      </nav>
    </div>
  );
}
