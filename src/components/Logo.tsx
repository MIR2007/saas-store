import Link from "next/link";

export default function Logo({ size = "md", href = "/" }: { size?: "sm" | "md" | "lg"; href?: string }) {
  const s = size === "sm" ? "w-7 h-7 text-sm" : size === "lg" ? "w-12 h-12 text-2xl" : "w-9 h-9 text-lg";
  return (
    <Link href={href} className="flex items-center gap-2 group">
      <span className={`${s} rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold shadow-sm group-hover:shadow-md transition`}>
        <svg viewBox="0 0 24 24" className="w-2/3 h-2/3" fill="currentColor" aria-hidden>
          <path d="M12 2c-1 0-2 .5-2.5 1.3-.3.5-.3 1.1 0 1.6.4.7 1.2 1.1 2 1.1s1.6-.4 2-1.1c.3-.5.3-1.1 0-1.6C14 2.5 13 2 12 2zm-4.5 4C6 6 5 7 5 8.5S6 11 7.5 11h9C18 11 19 10 19 8.5S18 6 16.5 6h-9zM6 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM9 17c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1H9z" />
        </svg>
      </span>
      <span className="font-bold text-foreground">Bee Panal</span>
    </Link>
  );
}