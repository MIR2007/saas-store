"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ label = "طباعة" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-neutral-700"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
