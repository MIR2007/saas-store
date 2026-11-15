"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, Palette, Settings, Store, Trash2, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { CURRENCIES } from "@/lib/format";
import { cardClass, dangerBtn, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

const PRESET_COLORS = [
  { value: "#d97706", label: "عسلي" },
  { value: "#ea580c", label: "برتقالي" },
  { value: "#059669", label: "أخضر" },
  { value: "#0284c7", label: "سماوي" },
  { value: "#7c3aed", label: "بنفسجي" },
  { value: "#e11d48", label: "وردي" },
];

export default function StoreSettingsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("#d97706");
  const [currency, setCurrency] = useState("EGP");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((r) => r.json())
      .then((d) => {
        const s = d.store;
        if (s) {
          setName(s.name);
          setSlug(s.slug);
          setDescription(s.description || "");
          setThemeColor(s.themeColor || "#d97706");
          setCurrency(s.currency || "EGP");
          setActive(s.active);
        }
        setLoaded(true);
      });
  }, [storeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, themeColor, currency, active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نحفظ التغييرات");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("متأكد؟ حذف المتجر هيمسح كل منتجاته وطلباته نهائيًا.")) return;
    await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
    router.push("/dashboard/stores");
    router.refresh();
  }

  if (!loaded) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel="لوحة المتجر"
        eyebrow="الإعدادات"
        title="إعدادات المتجر"
        subtitle="اسم المتجر، الشكل، العملة، وحالة الظهور — كل حاجة تحت إيدك."
        icon={<Settings className="h-6 w-6" />}
        action={
          <a href={`/${slug}`} target="_blank" rel="noreferrer" className={secondaryBtn}>
            عرض المتجر
            <ExternalLink className="h-4 w-4" />
          </a>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        <section className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold text-foreground">بيانات المتجر</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>اسم المتجر</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>رابط المتجر</label>
              <div className="flex items-center overflow-hidden rounded-xl border border-border bg-surface px-3 py-2.5" dir="ltr">
                <span className="text-xs font-semibold text-muted">beepanal.store/</span>
                <span className="text-xs font-bold text-foreground">{slug}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted">الرابط ثابت ومينفعش يتغير بعد إنشاء المتجر.</p>
            </div>
            <div>
              <label className={labelClass}>وصف المتجر</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="اكتب عن متجرك في سطرين…"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold text-foreground">شكل المتجر</h2>
          </div>
          <label className={labelClass}>لون المتجر الأساسي</label>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setThemeColor(color.value)}
                title={color.label}
                aria-label={color.label}
                className={`grid h-10 w-10 place-items-center rounded-xl ring-offset-2 ring-offset-card transition-transform hover:scale-105 ${
                  themeColor.toLowerCase() === color.value ? "ring-2 ring-foreground/40" : "ring-1 ring-border"
                }`}
                style={{ backgroundColor: color.value }}
              >
                {themeColor.toLowerCase() === color.value && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="لون مخصص"
              />
              <input
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-24 bg-transparent font-mono text-xs text-foreground outline-none"
                dir="ltr"
              />
            </div>
          </div>
        </section>

        <section className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold text-foreground">العملة</h2>
          </div>
          <label className={labelClass}>عملة أسعار المنتجات</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.symbol}) — {c.code}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-muted">
            كل الأسعار في المتجر هتظهر بالعملة دي. الجنيه المصري هو الافتراضي.
          </p>
        </section>

        <section className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-foreground">المتجر شغال</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                لو قفلته، المتجر هيختفي من العملاء ومحدش هيقدر يطلب منه.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                active ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
                  active ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            تم حفظ التغييرات بنجاح.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? "بنحفظ..." : "حفظ التغييرات"}
            {!loading && <Check className="h-4 w-4" />}
          </button>
          <Link href={`/dashboard/stores/${storeId}`} className={secondaryBtn}>
            رجوع للمتجر
          </Link>
        </div>
      </form>

      <section className="mt-8 max-w-3xl rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-6">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
          <Trash2 className="h-5 w-5" />
          <h2 className="font-extrabold">منطقة الخطر</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          حذف المتجر بيمسح كل المنتجات والتصنيفات والطلبات المرتبطة بيه، ومش هينفع ترجعهم تاني.
        </p>
        <button type="button" onClick={handleDelete} className={`${dangerBtn} mt-4`}>
          <Trash2 className="h-4 w-4" />
          حذف المتجر نهائيًا
        </button>
      </section>
    </div>
  );
}
