import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  action,
  backHref,
  backLabel,
}: {
  title: ReactNode;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-7">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-primary"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          {backLabel ?? "رجوع"}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {icon && (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-primary ring-1 ring-primary/20">
              {icon}
            </span>
          )}
          <div>
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
            )}
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
