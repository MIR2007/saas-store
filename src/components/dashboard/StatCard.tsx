import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  amber: "from-amber-500/15 to-orange-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  emerald: "from-emerald-500/15 to-teal-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  sky: "from-sky-500/15 to-blue-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  violet: "from-violet-500/15 to-purple-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  rose: "from-rose-500/15 to-pink-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
};

export type StatTone = keyof typeof tones;

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "amber",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div className="absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground lg:text-[26px]">
            {value}
          </p>
          {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
        </div>
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ring-1", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
