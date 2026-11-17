"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Eye,
  Loader2,
  Share2,
  ShieldCheck,
  Video,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { parseTrackingConfig } from "@/lib/tracking";
import { cardClass, inputClass, labelClass, primaryBtn } from "@/lib/ui";

const META_RE = /^\d{10,20}$/;
const TIKTOK_RE = /^[A-Za-z0-9]{10,40}$/;

const TRACKED_EVENTS = [
  { name: "PageView", label: "زيارة صفحة", desc: "كل صفحة يفتحها العميل في المتجر" },
  { name: "ViewContent", label: "مشاهدة منتج", desc: "عند فتح صفحة تفاصيل منتج" },
  { name: "AddToCart", label: "إضافة للسلة", desc: "عند الضغط على «ضيف للسلة»" },
  { name: "InitiateCheckout", label: "بدء إتمام الطلب", desc: "عند فتح صفحة الشراء" },
  { name: "Purchase", label: "إتمام شراء", desc: "بعد تأكيد الطلب — TikTok: CompletePayment" },
];

function StatusBadge({ configured, enabled }: { configured: boolean; enabled: boolean }) {
  if (!configured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[10px] font-bold text-muted ring-1 ring-border">
        <span className="h-1.5 w-1.5 rounded-full bg-muted/60" />
        غير مربوط
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
        enabled
          ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
          : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-amber-500"}`} />
      {enabled ? "نشط" : "متوقف"}
    </span>
  );
}

function Toggle({
  enabled,
  disabled,
  onChange,
  label,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      dir="ltr"
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        enabled ? "bg-emerald-500" : "bg-border"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function PlatformCard({
  icon,
  title,
  subtitle,
  docsUrl,
  docsLabel,
  idValue,
  onIdChange,
  placeholder,
  inputMode,
  enabled,
  onToggle,
  helper,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  docsUrl: string;
  docsLabel: string;
  idValue: string;
  onIdChange: (value: string) => void;
  placeholder: string;
  inputMode?: "numeric" | "text";
  enabled: boolean;
  onToggle: () => void;
  helper: string;
}) {
  const configured = Boolean(idValue.trim());
  const inputId = `pixel-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-primary ring-1 ring-primary/20">
            {icon}
          </span>
          <div>
            <h2 className="text-base font-extrabold text-foreground">{title}</h2>
            <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>
          </div>
        </div>
        <StatusBadge configured={configured} enabled={enabled} />
      </div>

      <div className="mt-5">
        <label className={labelClass} htmlFor={inputId}>
          Pixel ID
        </label>
        <input
          id={inputId}
          value={idValue}
          onChange={(event) => onIdChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          className={`${inputClass} font-mono tracking-wide`}
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{helper}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 px-3.5 py-3">
        <div>
          <div className="text-xs font-bold text-foreground">تفعيل التتبع</div>
          <div className="mt-0.5 text-[10px] text-muted">
            {configured ? "يمكنك إيقافه مؤقتًا بدون حذف المعرّف." : "أضف المعرّف الأول."}
          </div>
        </div>
        <Toggle
          enabled={enabled && configured}
          disabled={!configured}
          onChange={onToggle}
          label={`تفعيل ${title}`}
        />
      </div>

      <Link
        href={docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary transition-colors hover:text-primary-dark"
      >
        {docsLabel}
        <ExternalLink className="h-3 w-3" />
      </Link>
    </section>
  );
}

export default function PixelSettingsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const router = useRouter();

  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [tiktokEnabled, setTiktokEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((response) => response.json())
      .then((data) => {
        const config = parseTrackingConfig(data.store?.trackingConfig);
        setMetaPixelId(config.metaPixelId);
        setMetaEnabled(config.metaEnabled);
        setTiktokPixelId(config.tiktokPixelId);
        setTiktokEnabled(config.tiktokEnabled);
      })
      .catch(() => setError("مش قادرين نحمّل إعدادات البيكسل، جرّب تحديث الصفحة."))
      .finally(() => setLoaded(true));
  }, [storeId]);

  function changeMetaId(value: string) {
    setMetaPixelId(value);
    if (value.trim()) setMetaEnabled(true);
    setSaved(false);
  }

  function changeTikTokId(value: string) {
    setTiktokPixelId(value);
    if (value.trim()) setTiktokEnabled(true);
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);

    const meta = metaPixelId.trim();
    const tiktok = tiktokPixelId.trim();
    if (meta && !META_RE.test(meta)) {
      setError("معرّف Meta Pixel لازم يكون أرقام فقط من 10 إلى 20 رقم.");
      return;
    }
    if (tiktok && !TIKTOK_RE.test(tiktok)) {
      setError("معرّف TikTok Pixel لازم يكون حروف وأرقام إنجليزية من 10 إلى 40 خانة.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingConfig: {
            metaPixelId: meta,
            metaEnabled: metaEnabled && Boolean(meta),
            tiktokPixelId: tiktok,
            tiktokEnabled: tiktokEnabled && Boolean(tiktok),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "مش قادرين نحفظ إعدادات البيكسل.");
        return;
      }
      setMetaPixelId(meta);
      setTiktokPixelId(tiktok);
      setMetaEnabled(metaEnabled && Boolean(meta));
      setTiktokEnabled(tiktokEnabled && Boolean(tiktok));
      setSaved(true);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-surface" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        title="إعدادات البيكسل"
        subtitle="اربط Meta Pixel وTikTok Pixel لمتابعة الزيارات والطلبات وحملات إعادة الاستهداف."
        eyebrow="أدوات التسويق"
        icon={<Eye className="h-5 w-5" />}
        backHref={`/dashboard/stores/${storeId}`}
        backLabel="لوحة المتجر"
      />

      <div className={`${cardClass} mb-5 p-5 sm:p-6`}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-foreground">تتبع تلقائي وجاهز من أول طلب</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              بنحمّل البيكسل على صفحات متجرك بس، وبيتوقف تلقائيًا لو المتجر مقفول. مش
              محتاج تضيف أي كود بنفسك.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {TRACKED_EVENTS.map((event) => (
            <div key={event.name} className="rounded-xl border border-border bg-surface/60 px-3 py-2.5">
              <div className="font-mono text-[10px] font-bold text-primary">{event.name}</div>
              <div className="mt-1 text-[11px] font-bold text-foreground">{event.label}</div>
              <div className="mt-0.5 text-[10px] leading-relaxed text-muted">{event.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-2">
          <PlatformCard
            icon={<Share2 className="h-5 w-5" />}
            title="Meta Pixel"
            subtitle="فيسبوك وإنستجرام"
            docsUrl="https://business.facebook.com/events_manager2/list/pixel"
            docsLabel="افتح Meta Events Manager"
            idValue={metaPixelId}
            onIdChange={changeMetaId}
            placeholder="123456789012345"
            inputMode="numeric"
            enabled={metaEnabled}
            onToggle={() => {
              setMetaEnabled((value) => !value);
              setSaved(false);
            }}
            helper="هتلاقي الـ Pixel ID في Events Manager ← Data Sources ← اختار البيكسل. مكوّن من أرقام فقط."
          />
          <PlatformCard
            icon={<Video className="h-5 w-5" />}
            title="TikTok Pixel"
            subtitle="إعلانات تيك توك"
            docsUrl="https://ads.tiktok.com/i18n/events_manager"
            docsLabel="افتح TikTok Events Manager"
            idValue={tiktokPixelId}
            onIdChange={changeTikTokId}
            placeholder="CXXXXXXXXXXXXXXX"
            inputMode="text"
            enabled={tiktokEnabled}
            onToggle={() => {
              setTiktokEnabled((value) => !value);
              setSaved(false);
            }}
            helper="هتلاقي الـ Pixel ID في TikTok Events Manager ← Assets ← Pixel. بيبدأ بحرف C وغالبًا 20 خانة."
          />
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className={`${cardClass} mt-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-[11px] leading-relaxed text-muted">
            الأحداث بتتبعت من متصفح العميل. تكامل Conversions API من السيرفر هيتضاف في
            تحديث قادم.
          </p>
          <div className="flex shrink-0 items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                تم الحفظ
              </span>
            )}
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
