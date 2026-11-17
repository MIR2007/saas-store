"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import Logo from "@/components/Logo";
import { inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "رابط الاستعادة غير صالح أو انتهت صلاحيته.");
        return;
      }
      setDone(true);
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          رابط الاستعادة غير صالح. اطلب رابط جديد من صفحة استعادة كلمة المرور.
        </div>
        <Link href="/forgot-password" className={`${primaryBtn} w-full justify-center`}>
          طلب رابط جديد
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          تم تغيير كلمة المرور بنجاح. تقدر تسجّل الدخول بكلمة المرور الجديدة.
        </div>
        <Link href="/login" className={`${primaryBtn} w-full justify-center`}>
          تسجيل الدخول
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className={labelClass}>كلمة المرور الجديدة</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          placeholder="••••••••"
          className={inputClass}
          dir="ltr"
        />
      </div>
      <div>
        <label className={labelClass}>تأكيد كلمة المرور</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={6}
          placeholder="••••••••"
          className={inputClass}
          dir="ltr"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className={`${primaryBtn} w-full justify-center`}>
        {loading ? "بنحفظ..." : "حفظ كلمة المرور الجديدة"}
      </button>

      <Link href="/login" className={`${secondaryBtn} w-full justify-center`}>
        رجوع لتسجيل الدخول
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-10">
      <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -start-24 h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/95 p-7 shadow-2xl shadow-black/5 backdrop-blur sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <Logo size="lg" href="#" />
            </div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-foreground">كلمة مرور جديدة</h1>
            <p className="mt-1 text-sm text-muted">اختار كلمة مرور قوية لحسابك على Bee Panal.</p>
          </div>

          <Suspense fallback={<div className="mt-6 text-center text-sm text-muted">بنحمّل...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
