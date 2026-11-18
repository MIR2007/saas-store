"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { isValidEgyptMobile } from "@/lib/phone";
import { inputClass, labelClass, primaryBtn } from "@/lib/ui";

export default function PhoneGate({ name }: { name: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!isValidEgyptMobile(phone)) {
      setError("اكتب رقم موبايل مصري صحيح (مثال: 01012345678).");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "مش قادرين نحفظ الرقم، جرّب تاني.");
        return;
      }
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 p-7 text-white">
          <div className="absolute -end-10 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur">
            <Phone className="h-6 w-6" />
          </span>
          <h1 className="relative mt-4 text-2xl font-extrabold">خطوة واحدة قبل ما تبدأ</h1>
          <p className="relative mt-1 text-sm leading-relaxed text-white/85">
            أهلًا {name}، محتاجين رقم موبايلك عشان نقدر نتواصل معاك بخصوص الطلبات والاشتراك.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-7">
          <label className={labelClass}>
            رقم الموبايل / واتساب <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            autoFocus
            placeholder="01012345678"
            className={inputClass}
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
          />
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
            الرقم هيظهر للأدمن فقط ومش هيتم نشره في المتجر.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} className={`${primaryBtn} mt-5 w-full justify-center`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {saving ? "بنحفظ..." : "حفظ الرقم والبدء"}
          </button>
        </form>
      </div>
    </div>
  );
}
