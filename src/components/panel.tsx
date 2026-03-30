import type { PropsWithChildren, ReactNode } from "react";

interface PanelProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export function Panel({ eyebrow, title, subtitle, footer, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {subtitle ? <span className="subtle">{subtitle}</span> : null}
      </div>
      {children}
      {footer ? <div className="panel-footer">{footer}</div> : null}
    </section>
  );
}
