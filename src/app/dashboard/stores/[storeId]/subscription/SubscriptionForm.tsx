"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Send, Wallet } from "lucide-react";
import {
  PAYMENT_METHODS,
  PAYMENT_NUMBER,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/plans";
import { formatMoney } from "@/lib/format";
import { inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export default function SubscriptionForm({
  storeId,
  defaultPhone,
  hasPending,
}: {
  storeId: string;
  defaultPhone: string;
  hasPending: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<SubscriptionPlanId>("yearly");
  const [method, setMethod] = useState<"instapay" | "vodafone">("instapay");
  const [phone, setPhone] = useState(defaultPhone);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, method, reference, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نسجّل طلب الاشتراك");
        return;
      }
      setDone(true);
      setReference("");
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3 sm:p-6">
        <h2 className="font-extrabold text-foreground">اختار الخطة</h2>
        <p className="mt-1 text-xs text-muted">الأسعار بالجنيه المصري، والاشتراك بيبدأ بعد تأكيد التحويل.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanId[]).map((id) => {
            const item = SUBSCRIPTION_PLANS[id];
            const active = plan === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPlan(id)}
                className={`relative overflow-hidden rounded-2xl border p-4 text-start transition-all ${
                  active
                    ? "border-primary bg-primary/[0.06] ring-2 ring-primary/25"
                    : "border-border bg-surface/50 hover:border-primary/40"
                }`}
              >
                {id === "yearly" && (
                  <span className="absolute end-3 top-3 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    الأوفر
                  </span>
                )}
                <div className="text-sm font-extrabold text-foreground">{item.label}</div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-2xl font-black text-foreground">{formatMoney(item.perMonth, "EGP")}</span>
                  <span className="pb-0.5 text-[11px] font-semibold text-muted">/ شهر</span>
                </div>
                <div className="mt-1 text-[11px] text-muted">{item.note}</div>
                <div className="mt-3 rounded-lg bg-card px-3 py-2 text-[11px] font-bold text-foreground ring-1 ring-border">
                  الإجمالي: {formatMoney(item.amount, "EGP")} / {id === "monthly" ? "شهر" : "سنة"}
                </div>
                {active && (
                  <span className="absolute start-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-border pt-5">
          <div>
            <label className={labelClass}>طريقة التحويل</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id)}
                  className={`rounded-xl border px-4 py-3 text-start transition-colors ${
                    method === item.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-surface"
                  }`}
                >
                  <div className="text-sm font-extrabold">{item.name}</div>
                  <div className="mt-0.5 text-[10px] text-muted">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>رقم الموبايل اللي حوّلت منه</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className={inputClass}
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className={labelClass}>رقم عملية التحويل / المرجع</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: 123456789"
                className={inputClass}
                required
                minLength={3}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
          {done && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Check className="h-4 w-4" />
              وصلنا طلبك! هنراجع التحويل ونفعّل الاشتراك في أسرع وقت.
            </div>
          )}

          <button type="submit" disabled={loading || hasPending} className={primaryBtn}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {hasPending ? "عندك طلب قيد المراجعة" : loading ? "بنرسل..." : "إرسال طلب الاشتراك"}
          </button>
          {hasPending && (
            <p className="text-[11px] text-muted">
              طلبك السابق مستني المراجعة. لو حوّلت مبلغ إضافي أو محتاج تعديل، كلّم الدعم.
            </p>
          )}
        </form>
      </section>

      <aside className="space-y-4 lg:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg shadow-amber-500/20 sm:p-6">
          <Wallet className="h-6 w-6 text-white/85" />
          <h3 className="mt-3 text-lg font-extrabold">حوّل على الرقم ده</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/85">
            إنستاباي أو فودافون كاش — نفس الرقم، وبعد التحويل سجّل الطلب من الفورم.
          </p>
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-white/15 px-4 py-3 ring-1 ring-white/25 backdrop-blur">
            <span className="font-mono text-xl font-black tracking-wider" dir="ltr">
              {PAYMENT_NUMBER}
            </span>
            <button
              type="button"
              onClick={copyNumber}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-extrabold text-amber-700"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "اتنسخ" : "نسخ"}
            </button>
          </div>
          <ol className="mt-4 space-y-2 text-[11px] leading-relaxed text-white/90">
            <li>1. حوّل قيمة الخطة من إنستاباي أو فودافون كاش.</li>
            <li>2. احتفظ برقم العملية من رسالة التحويل.</li>
            <li>3. اكتب الرقم في الفورم واضغط إرسال.</li>
            <li>4. هنفعّل الاشتراك ونبلّغك خلال 24 ساعة.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-foreground">إيه اللي بيشمله الاشتراك؟</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted">
            {[
              "منتجات وطلبات غير محدودة",
              "سب دومين مجاني + ربط دومين خاص",
              "رفع صور ولوجو وأقسام",
              "تصدير المنتجات JSON و Excel",
              "دعم فني على واتساب",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => router.refresh()}
          className={`${secondaryBtn} w-full`}
        >
          تحديث حالة الاشتراك
        </button>
      </aside>
    </div>
  );
}
