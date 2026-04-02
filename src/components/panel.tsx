import type { PropsWithChildren, ReactNode } from "react";

interface PanelProps extends PropsWithChildren {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  className?: string;
  hideHeader?: boolean;
}

export function Panel({
  id,
  eyebrow,
  title,
  subtitle,
  footer,
  className,
  hideHeader = false,
  children
}: PanelProps) {
  return (
    <section id={id} className={className ? `panel ${className}` : "panel"}>
      {!hideHeader ? (
        <div className="panel-header">
          <div className="panel-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          {subtitle ? <p className="panel-subtitle subtle">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
      {footer ? <div className="panel-footer">{footer}</div> : null}
    </section>
  );
}
