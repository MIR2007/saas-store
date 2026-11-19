"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  Unplug,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  BOSTA_BUSINESS_URL,
  type BostaConfig,
  type BostaPickupLocation,
} from "@/lib/bosta";
import { BOSTA_MAX_COD, BOSTA_PACKAGE_TYPES } from "@/lib/bosta-status";
import { cardClass, dangerBtn, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

type BostaPayload = {
  connected: boolean;
  enabled: boolean;
  maskedKey: string;
  config: BostaConfig;
  webhookUrl: string;
};

export default function StoreCarriersPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BostaPayload | null>(null);
  const [locations, setLocations] = useState<BostaPickupLocation[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const [pickupLocationId, setPickupLocationId] = useState("");
  const [packageType, setPackageType] = useState("SMALL");
  const [packageWeight, setPackageWeight] = useState(1);
  const [codEnabled, setCodEnabled] = useState(true);
  const [defaultNotes, setDefaultNotes] = useState("");

  useEffect(() => {
    fetch(`/api/stores/${storeId}/shipping/bosta`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.error) {
          setError(payload.error);
          return;
        }
        setData(payload);
        setPickupLocationId(payload.config?.pickupLocationId || "");
        setPackageType(payload.config?.packageType || "SMALL");
        setPackageWeight(Number(payload.config?.packageWeight) || 1);
        setCodEnabled(payload.config?.codEnabled !== false);
        setDefaultNotes(payload.config?.defaultNotes || "");
      })
      .catch(() => setError("مش قادرين نحمّل إعدادات الشحن."))
      .finally(() => setLoading(false));
  }, [storeId]);

  function applyPayload(payload: Partial<BostaPayload> & { config?: BostaConfig }) {
    setData((previous) =>
      previous
        ? {
            ...previous,
            ...payload,
            config: payload.config || previous.config,
          }
        : (payload as BostaPayload)
    );
    if (payload.config) {
      setPickupLocationId(payload.config.pickupLocationId || "");
      setPackageType(payload.config.packageType || "SMALL");
      setPackageWeight(Number(payload.config.packageWeight) || 1);
      setCodEnabled(payload.config.codEnabled !== false);
      setDefaultNotes(payload.config.defaultNotes || "");
    }
  }

  async function connectAccount() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/stores/${storeId}/shipping/bosta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "مش قادرين نربط الحساب.");
        return;
      }
      setLocations(payload.locations || []);
      applyPayload({
        connected: true,
        enabled: true,
        maskedKey: payload.maskedKey,
        config: payload.config,
      });
      setApiKey("");
      setShowKeyForm(false);
      setSuccess(payload.warning || "تم ربط حساب بوسطة بنجاح.");
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/stores/${storeId}/shipping/bosta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          pickupLocationId: pickupLocationId || undefined,
          packageType,
          packageWeight: Number(packageWeight) || 1,
          codEnabled,
          defaultNotes,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "مش قادرين نحفظ الإعدادات.");
        return;
      }
      if (payload.locations) setLocations(payload.locations);
      applyPayload({
        connected: true,
        enabled: true,
        maskedKey: payload.maskedKey,
        config: payload.config,
      });
      setApiKey("");
      setShowKeyForm(false);
      setSuccess(payload.warning || "تم حفظ إعدادات بوسطة.");
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSaving(false);
    }
  }

  async function refreshLocations() {
    setTesting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/stores/${storeId}/shipping/bosta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOnly: true }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "مش قادرين نتأكد من الاتصال.");
        return;
      }
      const nextLocations: BostaPickupLocation[] = payload.locations || [];
      setLocations(nextLocations);
      if (!nextLocations.some((location) => location.id === pickupLocationId)) {
        setPickupLocationId(nextLocations[0]?.id || "");
      }
      setSuccess(
        nextLocations.length
          ? `الاتصال شغال — لقينا ${nextLocations.length} عنوان استلام.`
          : "الاتصال شغال، لكن مفيش عنوان استلام في حساب بوسطة."
      );
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setTesting(false);
    }
  }

  async function disconnect() {
    if (!confirm("متأكد؟ هنفصل حساب بوسطة، والشحنات الحالية مش هتتأثر.")) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/stores/${storeId}/shipping/bosta`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error || "مش قادرين نفصل الحساب.");
        return;
      }
      setData((previous) =>
        previous
          ? {
              ...previous,
              connected: false,
              enabled: false,
              maskedKey: "",
              config: {
                ...previous.config,
                pickupLocationId: "",
                pickupLocationName: "",
              },
            }
          : previous
      );
      setLocations([]);
      setPickupLocationId("");
      setSuccess("تم فصل حساب بوسطة.");
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSaving(false);
    }
  }

  async function copyWebhook() {
    if (!data?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(data.webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("انسخ الرابط يدويًا من الحقل.");
    }
  }

  if (loading) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  const connected = Boolean(data?.connected);

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}/settings`}
        backLabel="إعدادات المتجر"
        eyebrow="الشحن"
        title="شركات الشحن"
        subtitle="اربط حساب بوسطة بتاعك، واعمل شحنات لطلباتك وتابع حالتها تلقائيًا."
        icon={<Truck className="h-6 w-6" />}
        action={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ${
              connected
                ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                : "bg-surface text-muted ring-border"
            }`}
          >
            {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Unplug className="h-3.5 w-3.5" />}
            {connected ? "بوسطة متصلة" : "بوسطة غير متصلة"}
          </span>
        }
      />

      {(error || success) && (
        <div
          className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
            error
              ? "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400"
              : "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {error || success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          {!connected ? (
            <section className={`${cardClass} p-6`}>
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-primary">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-extrabold text-foreground">اربط حساب بوسطة</h2>
                  <p className="text-xs text-muted">هتستخدم مفتاح API الخاص بحسابك على بوسطة.</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-surface/60 p-4">
                <p className="text-xs font-bold text-foreground">إزاي تجيب مفتاح API؟</p>
                <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-muted">
                  <li>1. افتح لوحة أعمال بوسطة وسجّل دخول.</li>
                  <li>2. من الإعدادات اختار API Integration.</li>
                  <li>3. اطلب رمز OTP وأكده، وبعدها اضغط Create API key.</li>
                  <li>4. انسخ المفتاح والصقه هنا.</li>
                </ol>
                <a
                  href={BOSTA_BUSINESS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  فتح لوحة بوسطة
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <label className={`${labelClass} mt-5`}>مفتاح API</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="الصق مفتاح API من لوحة بوسطة"
                  dir="ltr"
                  className={`${inputClass} pe-11 text-left font-mono`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((value) => !value)}
                  className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                  aria-label={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <button
                onClick={connectAccount}
                disabled={saving || !apiKey.trim()}
                className={`${primaryBtn} mt-4 w-full sm:w-auto`}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "بنراجع المفتاح..." : "تحقق وربط الحساب"}
              </button>
              <p className="mt-3 text-[10px] leading-relaxed text-muted">
                المفتاح بيتخزن في قاعدة بيانات متجرك، ومش بيتبعت للمتصفح نهائيًا. بيستخدم بس لإنشاء الشحنات ومتابعة حالتها.
              </p>
            </section>
          ) : (
            <>
              <section className={`${cardClass} p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-extrabold text-foreground">حساب بوسطة متصل</h2>
                      <p className="text-xs text-muted" dir="ltr">
                        {data?.maskedKey}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowKeyForm((value) => !value)}
                    className={secondaryBtn}
                  >
                    <RefreshCw className="h-4 w-4" />
                    تغيير المفتاح
                  </button>
                </div>

                {showKeyForm && (
                  <div className="mt-5 rounded-xl border border-border bg-surface/60 p-4">
                    <label className={labelClass}>مفتاح API الجديد</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        placeholder="الصق المفتاح الجديد"
                        dir="ltr"
                        className={`${inputClass} pe-11 text-left font-mono`}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((value) => !value)}
                        className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                        aria-label={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] text-muted">
                      اتركه فاضي لو مش عايز تغيّر المفتاح الحالي.
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={refreshLocations} disabled={testing} className={secondaryBtn}>
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {testing ? "بنفحص الاتصال..." : "فحص الاتصال وتحديث الفروع"}
                  </button>
                  <button onClick={disconnect} disabled={saving} className={dangerBtn}>
                    <Unplug className="h-4 w-4" />
                    فصل الحساب
                  </button>
                </div>
              </section>

              <section className={`${cardClass} p-6`}>
                <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                  <Package className="h-5 w-5 text-primary" />
                  إعدادات الشحنة الافتراضية
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  الإعدادات دي بتتعبّى تلقائيًا لما تنشئ شحنة من صفحة الطلب.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>عنوان الاستلام من المتجر</label>
                    {locations.length > 0 ? (
                      <select
                        value={pickupLocationId}
                        onChange={(event) => setPickupLocationId(event.target.value)}
                        className={inputClass}
                      >
                        <option value="">اختار عنوان الاستلام…</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                            {location.address ? ` — ${location.address}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-muted">
                        <MapPin className="h-4 w-4 text-primary" />
                        {pickupLocationId
                          ? "العنوان محفوظ — اضغط فحص الاتصال لتحديث القائمة."
                          : "اضغط فحص الاتصال عشان نجيب عناوين الاستلام من بوسطة."}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>نوع الباكدج</label>
                    <select
                      value={packageType}
                      onChange={(event) => setPackageType(event.target.value)}
                      className={inputClass}
                    >
                      {BOSTA_PACKAGE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>الوزن الافتراضي (كجم)</label>
                    <input
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.1}
                      value={packageWeight}
                      onChange={(event) => setPackageWeight(Number(event.target.value))}
                      className={inputClass}
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>ملاحظات افتراضية للشحنة</label>
                    <textarea
                      value={defaultNotes}
                      onChange={(event) => setDefaultNotes(event.target.value)}
                      rows={2}
                      maxLength={300}
                      placeholder="مثال: الاتصال قبل التوصيل"
                      className={inputClass}
                    />
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(event) => setCodEnabled(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-amber-600"
                  />
                  <span>
                    <span className="block text-sm font-bold text-foreground">تحصيل المبلغ عند الاستلام (COD)</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                      بوسطة هتحصّل إجمالي الطلب من العميل. الحد الأقصى {BOSTA_MAX_COD.toLocaleString("en-US")} جنيه.
                    </span>
                  </span>
                </label>

                <button onClick={saveSettings} disabled={saving} className={`${primaryBtn} mt-5`}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? "بنحفظ..." : "حفظ الإعدادات"}
                </button>
              </section>
            </>
          )}
        </div>

        <div className="space-y-5 lg:col-span-4">
          <section className={`${cardClass} p-6`}>
            <h2 className="flex items-center gap-2 font-extrabold text-foreground">
              <Truck className="h-5 w-5 text-primary" />
              Webhook التتبع
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              الرابط ده بيتسجل تلقائيًا مع كل شحنة جديدة، وبوسطة بتبعت عليه أي تحديث في الحالة.
              مش محتاج تضبطه في لوحة بوسطة.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                readOnly
                value={data?.webhookUrl || ""}
                dir="ltr"
                className={`${inputClass} flex-1 text-left font-mono text-[10px]`}
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                onClick={copyWebhook}
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-border bg-card text-muted transition-colors hover:text-primary"
                aria-label="نسخ رابط Webhook"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 rounded-xl border border-border bg-surface/60 px-3 py-2 text-[10px] leading-relaxed text-muted">
              بنتحقق من كل تحديث عن طريق الرجوع لبوسطة نفسها، عشان محدش يقدر يزوّر حالة شحنة.
            </p>
          </section>

          <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <h3 className="mt-2 text-base font-extrabold">نصايح سريعة</h3>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/75">
              <li>• لازم يكون في عنوان استلام (Pickup Location) في حساب بوسطة.</li>
              <li>• رقم العميل لازم يكون موبايل مصري صحيح.</li>
              <li>• العنوان لازم يكون أكتر من 5 حروف عشان بوسطة تقبله.</li>
              <li>• تقدر تلغي الشحنة من صفحة الطلب قبل التسليم.</li>
            </ul>
            <a
              href="https://docs.bosta.co/docs/category/how-to"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline"
            >
              دليل بوسطة
              <ExternalLink className="h-3 w-3" />
            </a>
          </section>

          <Link href={`/dashboard/stores/${storeId}/settings`} className={`${secondaryBtn} w-full justify-center`}>
            رجوع لإعدادات المتجر
          </Link>
        </div>
      </div>
    </div>
  );
}
