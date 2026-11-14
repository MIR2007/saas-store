"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Locale, getDict } from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof getDict>;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    const initial: Locale = saved === "en" ? "en" : "ar";
    setLocaleState(initial);
    apply(initial);
  }, []);

  function apply(l: Locale) {
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("lang", l);
    apply(l);
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: getDict(locale) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}