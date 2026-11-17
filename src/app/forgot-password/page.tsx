"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, MessageCircle, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";
import { PAYMENT_NUMBER } from "@/lib/plans";

function supportLink() {
  const number = `20${PAYMENT_NUMBER.replace(/^0/, "")}`;
  const text = encodeURIComponent("محتاج مساعدة في استعادة كلمة المرور على Bee Panal");
  return `https://wa.me/${number}?text=${text}`;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "مش قادرين نرسل رابط الاستعادة");
        return;
      }
      setSent(true);
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

      <div className="relative w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/login" className="text-xs font-bold text-muted hover:text-foreground">
            ← رجوع لتسجيل الدخول
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card/95 p-7 shadow-2xl shadow-black/5 backdrop-blur sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <Logo size="lg" href="#" />
            </div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-foreground">استعادة كلمة المرور</h1>
            <p className="mt-1 text-sm text-muted">
              اكتب بريدك الإلكتروني وهنبعتلك رابط لإعادة تعيين كلمة المرور.
            </p>
          </div>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold leading-relaxed text-emerald-700 dark:text-emerald-300">
                لو البريد ده موجود عندنا، رابط الاستعادة اتبعت عليه. الرابط صالح لمدة ساعة.
              </div>
              <p className="text-center text-xs leading-relaxed text-muted">
                ملقيتش الرسالة؟ راجع Spam أو تواصل مع الدعم على واتساب.
              </p>
              <a href={supportLink()} target="_blank" rel="noreferrer" className={`${secondaryBtn} w-full justify-center`}>
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                تواصل مع الدعم
              </a>
              <Link href="/login" className={`${primaryBtn} w-full justify-center`}>
                رجوع لتسجيل الدخول
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className={labelClass}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
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
                {loading ? "بنبعت..." : "إرسال رابط الاستعادة"}
              </button>

              <div className="flex items-start gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                لو مش متأكد من بريدك، تواصل مع الدعم وهنساعدك نستعيد الحساب بأمان.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
