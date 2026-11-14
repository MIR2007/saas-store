"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.style.colorScheme = next ? "dark" : "light";
  }

  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-sm text-foreground transition-colors hover:bg-surface"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}