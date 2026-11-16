import Link from "next/link";

const MARK_SIZE = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const;

const WORD_SIZE = {
  sm: "text-[15px]",
  md: "text-lg",
  lg: "text-2xl",
} as const;

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Bee Panal" className={className}>
      <defs>
        <linearGradient id="bp-logo-gradient" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="bp-logo-shine" x1="10" y1="6" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="bp-bee-body">
          <rect x="16.5" y="17" width="15" height="21" rx="7.5" />
        </clipPath>
      </defs>

      {/* Honeycomb tile */}
      <path
        d="M24 2.8 42.8 13.4v21.2L24 45.2 5.2 34.6V13.4z"
        fill="url(#bp-logo-gradient)"
      />
      <path
        d="M24 5.6 40.2 15v18L24 42.4 7.8 33V15z"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="1.1"
      />
      <path
        d="M24 2.8 42.8 13.4v9.2c-5.8-2.4-12-5-18.8-5s-13 2.6-18.8 5v-9.2z"
        fill="url(#bp-logo-shine)"
      />

      {/* Wings */}
      <ellipse cx="13.4" cy="19.6" rx="5.2" ry="7.6" transform="rotate(-27 13.4 19.6)" fill="#ffffff" opacity="0.92" />
      <ellipse cx="34.6" cy="19.6" rx="5.2" ry="7.6" transform="rotate(27 34.6 19.6)" fill="#ffffff" opacity="0.92" />

      {/* Antennae */}
      <path d="M22.2 11.4c-1.1-1.7-2-2.6-3.1-3.3" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M25.8 11.4c1.1-1.7 2-2.6 3.1-3.3" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />

      {/* Head */}
      <circle cx="24" cy="14.6" r="4.5" fill="#ffffff" />
      <circle cx="22.35" cy="14.8" r="0.95" fill="#b45309" />
      <circle cx="25.65" cy="14.8" r="0.95" fill="#b45309" />

      {/* Body */}
      <rect x="16.5" y="17" width="15" height="21" rx="7.5" fill="#ffffff" />
      <g clipPath="url(#bp-bee-body)">
        <rect x="16" y="23.6" width="16.5" height="2.7" fill="#f59e0b" />
        <rect x="16" y="29.1" width="16.5" height="2.7" fill="#f59e0b" />
      </g>
      <path d="M16.5 24.95h15" stroke="#fbbf24" strokeWidth="0.8" strokeOpacity="0.8" />
    </svg>
  );
}

export default function Logo({
  size = "md",
  href = "/",
  light = false,
}: {
  size?: "sm" | "md" | "lg";
  href?: string;
  light?: boolean;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="Bee Panal">
      <span className={`${MARK_SIZE[size]} shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105`}>
        <LogoMark className="h-full w-full drop-shadow-sm" />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`${WORD_SIZE[size]} font-black tracking-tight ${
            light ? "text-white" : "text-foreground"
          }`}
        >
          Bee Panal
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
          بي بانال
          <span className="h-0.5 w-0.5 rounded-full bg-amber-500/60" />
          Stores
        </span>
      </span>
    </Link>
  );
}
