"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { inputClass, labelClass } from "@/lib/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("كلمة المرور غلط، جرّب تاني.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -start-24 h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />
      <div className="bg-grid grid-mask absolute inset-0 opacity-60" />

      <div className="relative w-full max-w-sm">
        <div className="mb-4 text-center">
          <Link href="/" className="text-xs font-bold text-muted hover:text-foreground">
            ← رجوع للموقع
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-card/95 p-7 shadow-2xl shadow-black/5 backdrop-blur">
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-xl font-extrabold text-background">
              A
            </span>
            <h1 className="mt-3 text-xl font-extrabold text-foreground">لوحة تحكم المطور</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              دخول محمي لصاحب المنصة
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={labelClass}>كلمة المرور</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`${inputClass} ps-10`}
                  dir="ltr"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-foreground py-3 text-sm font-extrabold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "بندخل..." : "دخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
