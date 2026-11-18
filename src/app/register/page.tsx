"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";
import Logo from "@/components/Logo";
import GoogleButton from "@/components/GoogleButton";
import GoogleAuthError from "@/components/GoogleAuthError";
import { isValidEgyptMobile } from "@/lib/phone";
import { inputClass, labelClass } from "@/lib/ui";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "MERCHANT">("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (role === "MERCHANT" && !isValidEgyptMobile(phone)) {
      setError("اكتب رقم موبايل مصري صحيح للتاجر (مثال: 01012345678).");
      return;
    }
    if (phone && !isValidEgyptMobile(phone)) {
      setError("رقم الموبايل غير صحيح (مثال: 01012345678).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نعمل حسابك");
        return;
      }
      router.push(data.redirect || (role === "MERCHANT" ? "/dashboard" : "/"));
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
            <h1 className="text-2xl font-extrabold text-foreground">{t.auth.register}</h1>
            <p className="mt-1 text-sm text-muted">{t.auth.start}</p>
          </div>

          <div className="mt-5 grid gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3 text-[11px] font-semibold text-foreground sm:grid-cols-3">
            {["من غير بطاقة بنكية", "متجر جاهز فورًا", "دعم مصري"].map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                {b}
              </span>
            ))}
          </div>

          <div className="mt-5">
            <GoogleButton
              href="/api/auth/google?intent=merchant"
              label="التسجيل كتاجر بحساب جوجل"
            />
            <p className="mt-1.5 text-center text-[10px] leading-relaxed text-muted">
              هيتم إنشاء متجر تجريبي فورًا، وبعدها تضيف رقم الموبايل من لوحة التحكم.
            </p>
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] font-bold text-muted">
            <span className="h-px flex-1 bg-border" />
            أو سجّل بالبريد
            <span className="h-px flex-1 bg-border" />
          </div>

          <Suspense fallback={null}>
            <GoogleAuthError />
          </Suspense>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className={labelClass}>{t.auth.name}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="اسمك الكريم"
                className={inputClass}
              />
            </div>
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
              <label className={labelClass}>
                رقم الموبايل / واتساب
                {role === "MERCHANT" && <span className="ms-1 text-rose-500">*</span>}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={role === "MERCHANT"}
                placeholder="01012345678"
                className={inputClass}
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
              />
              <p className="mt-1 text-[11px] text-muted">
                {role === "MERCHANT"
                  ? "مطلوب للتواصل بخصوص الطلبات والاشتراك."
                  : "اختياري، بنستخدمه للتواصل لو احتجت."}
              </p>
            </div>
            <div>
              <label className={labelClass}>{t.auth.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6 أحرف على الأقل"
                className={inputClass}
                dir="ltr"
              />
            </div>

            <div>
              <label className={labelClass}>نوع الحساب</label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("CUSTOMER")}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    role === "CUSTOMER"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:bg-surface"
                  }`}
                >
                  عميل (يشتري)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("MERCHANT")}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    role === "MERCHANT"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:bg-surface"
                  }`}
                >
                  تاجر (يبيع)
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                التاجر يقدر يفتح متجر ويضيف منتجات ويدير طلباته من لوحة التحكم.
              </p>
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
              {loading ? t.common.loading : t.auth.submitReg}
              {!loading && <ArrowUpRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              {t.auth.login}
            </Link>
          </p>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          بالاشتراك بتوافق على شروط الاستخدام وسياسة الخصوصية.
        </p>
      </div>
    </div>
  );
}
