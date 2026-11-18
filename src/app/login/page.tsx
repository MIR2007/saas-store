"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";
import Logo from "@/components/Logo";
import GoogleButton from "@/components/GoogleButton";
import GoogleAuthError from "@/components/GoogleAuthError";
import { inputClass, labelClass } from "@/lib/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const googleHref = `/api/auth/google${
    next && next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""
  }`;
  const { t } = useLang();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نسجّل دخولك");
        return;
      }
      const dest = next && next !== "/dashboard" ? next : data.redirect || next;
      router.push(dest);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-10">
      <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -start-24 h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />
      <div className="bg-grid grid-mask absolute inset-0 opacity-60" />

      <div className="relative w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold text-muted hover:text-foreground">
            ← رجوع للموقع
          </Link>
          <LanguageToggle />
        </div>

        <div className="rounded-3xl border border-border bg-card/95 p-7 shadow-2xl shadow-black/5 backdrop-blur sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <Logo size="lg" href="#" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">{t.auth.login}</h1>
            <p className="mt-1 text-sm text-muted">{t.auth.welcome}</p>
          </div>

          <div className="mt-6">
            <GoogleButton href={googleHref} label="الدخول بحساب جوجل" />
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] font-bold text-muted">
            <span className="h-px flex-1 bg-border" />
            أو
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleAuthError />

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className={labelClass}>{t.auth.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputClass}
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass}>{t.auth.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={inputClass}
                dir="ltr"
              />
            </div>
            <div className="text-end">
              <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
            {error && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.common.loading : t.auth.submit}
              {!loading && <ArrowUpRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t.auth.noAccount}{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              {t.auth.signupFree}
            </Link>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            بياناتك محمية
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            7 أيام تجربة مجانية
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">بنحمّل...</div>}>
      <LoginForm />
    </Suspense>
  );
}
