"use client";

import { useLang } from "@/components/LanguageProvider";

export default function LanguageToggle() {
  const { locale, setLocale } = useLang();
  return (
    <button
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className="text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition"
      aria-label="Switch language"
    >
      {locale === "ar" ? "EN" : "AR"}
    </button>
  );
}