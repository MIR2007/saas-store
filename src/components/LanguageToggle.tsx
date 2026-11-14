"use client";

import { useLang } from "@/components/LanguageProvider";

export default function LanguageToggle() {
  const { locale, setLocale } = useLang();
  return (
    <button
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className="grid h-9 min-w-9 place-items-center rounded-lg border border-border bg-card px-2.5 text-xs font-bold text-foreground transition-colors hover:bg-surface"
      aria-label="Switch language"
    >
      {locale === "ar" ? "EN" : "AR"}
    </button>
  );
}