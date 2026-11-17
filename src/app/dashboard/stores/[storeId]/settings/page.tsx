"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Globe2,
  ImagePlus,
  Loader2,
  Palette,
  Phone,
  Settings,
  Store,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { CURRENCIES, currencySymbol } from "@/lib/format";
import { EGYPT_GOVERNORATES } from "@/lib/egypt";
import { OTHER_REGIONS_KEY, shippingRatesWithDefaults } from "@/lib/shipping";
import { cardClass, dangerBtn, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";
import { storePublicUrl } from "@/lib/domains";

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
  const [logo, setLogo] = useState("");
  const [phone, setPhone] = useState("");
  const [themeColor, setThemeColor] = useState("#d97706");
  const [currency, setCurrency] = useState("EGP");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [shippingRates, setShippingRates] = useState<Record<string, number>>({});
  const [bulkShipping, setBulkShipping] = useState("");
  const [active, setActive] = useState(true);
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((r) => r.json())
      .then((d) => {
        const s = d.store;
        if (s) {
          setName(s.name);
          setSlug(s.slug);
          setDescription(s.description || "");
          setLogo(s.logo || "");
          setPhone(s.phone || "");
          setThemeColor(s.themeColor || "#d97706");
          setCurrency(s.currency || "EGP");
          setFreeShippingThreshold(Number(s.freeShippingThreshold) || 0);
          setShippingRates(shippingRatesWithDefaults(s.shippingRates));
          setActive(s.active);
          setCustomDomain(s.customDomainStatus === "active" ? s.customDomain : null);
        }
        setLoaded(true);
      });
  }, [storeId]);

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      if (logo) body.append("previousUrl", logo);
      const res = await fetch("/api/upload/image", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل رفع اللوجو");
        return;
      }
      setLogo(data.url);
    } catch {
      setError("فشل رفع اللوجو، جرّب تاني.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          themeColor,
          currency,
          active,
          logo,
          phone,
          freeShippingThreshold: Number(freeShippingThreshold) || 0,
          shippingRates,
        }),
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
          <a href={storePublicUrl(slug, customDomain)} target="_blank" rel="noreferrer" className={secondaryBtn}>
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
              <label className={labelClass}>لوجو المتجر</label>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-border bg-surface/60 p-4">
                <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-card text-2xl font-black text-primary ring-1 ring-border">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="لوجو المتجر" className="h-full w-full object-cover" />
                  ) : (
                    name.trim().charAt(0) || "B"
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground">ارفع لوجو يظهر في هيدر المتجر والفوتر</p>
                  <p className="mt-1 text-[11px] text-muted">PNG أو JPG أو WebP — أقصى حجم 5 ميجا. يفضّل صورة مربعة.</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => logoInput.current?.click()}
                      disabled={uploadingLogo}
                      className={secondaryBtn}
                    >
                      {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      {uploadingLogo ? "بنرفع..." : logo ? "تغيير اللوجو" : "رفع لوجو"}
                    </button>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo("")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        إزالة
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>رقم واتساب المتجر</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className={`${inputClass} ps-10`}
                  dir="ltr"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                بيظهر للعملاء في الفوتر وصفحة المنتج عشان يتواصلوا معاك.
              </p>
            </div>
            <div>
              <label className={labelClass}>رابط المتجر</label>
              <div className="flex items-center overflow-hidden rounded-xl border border-border bg-surface px-3 py-2.5" dir="ltr">
                <span className="text-xs font-bold text-foreground">{slug}.beepanal.store</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                ده رابط المتجر المجاني. تقدر توصل دومينك الخاص من إعدادات الدومين.
              </p>
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
          <div className="mb-2 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold text-foreground">الشحن حسب المحافظة</h2>
          </div>
          <p className="mb-5 text-[11px] leading-relaxed text-muted">
            حدّد مبلغ الشحن الثابت لكل محافظة. المبلغ بيتحسب مرة واحدة على الطلب كله، مش على كل منتج.
            سيبه 0 لو عايز شحن مجاني للمحافظة دي.
          </p>

          <div className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border bg-surface/60 p-3">
            <div className="min-w-36 flex-1">
              <label className={labelClass}>تطبيق مبلغ على كل المحافظات</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={bulkShipping}
                  onChange={(e) => setBulkShipping(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                  dir="ltr"
                />
                <span className="text-xs font-bold text-muted">{currencySymbol(currency)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const value = Number(bulkShipping) || 0;
                setShippingRates((prev) => {
                  const next: Record<string, number> = { ...prev };
                  for (const governorate of EGYPT_GOVERNORATES) next[governorate] = value;
                  return next;
                });
              }}
              className={secondaryBtn}
            >
              تطبيق على الكل
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EGYPT_GOVERNORATES.map((governorate) => (
              <label
                key={governorate}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2"
              >
                <span className="text-xs font-bold text-foreground">{governorate}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={shippingRates[governorate] ?? 0}
                    onChange={(e) =>
                      setShippingRates((prev) => ({
                        ...prev,
                        [governorate]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-20 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary"
                    dir="ltr"
                  />
                  <span className="w-8 text-[9px] font-semibold text-muted">{currencySymbol(currency)}</span>
                </span>
              </label>
            ))}
            <label className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2">
              <span className="text-xs font-bold text-foreground">دول أخرى</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={shippingRates[OTHER_REGIONS_KEY] ?? 0}
                  onChange={(e) =>
                    setShippingRates((prev) => ({
                      ...prev,
                      [OTHER_REGIONS_KEY]: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-20 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary"
                  dir="ltr"
                />
                <span className="w-8 text-[9px] font-semibold text-muted">{currencySymbol(currency)}</span>
              </span>
            </label>
          </div>
        </section>

        <section className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold text-foreground">الشحن المجاني</h2>
          </div>
          <label className={labelClass}>شحن مجاني للطلبات فوق مبلغ (اختياري)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(Number(e.target.value) || 0)}
            className={inputClass}
            dir="ltr"
          />
          <p className="mt-1.5 text-[11px] text-muted">
            سيبه 0 لو مش عايز تفعّله. بيتحسب على إجمالي المنتجات قبل الخصم.
          </p>
        </section>

        <section className={`${cardClass} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Globe2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-extrabold text-foreground">دومين المتجر</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {customDomain
                    ? `دومينك الخاص متفعّل: ${customDomain}`
                    : "اربط دومينك الخاص بسهولة، وهنظبط لك شهادات الأمان تلقائيًا."}
                </p>
              </div>
            </div>
            <Link href={`/dashboard/stores/${storeId}/settings/domain`} className={secondaryBtn}>
              إعدادات الدومين
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
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
