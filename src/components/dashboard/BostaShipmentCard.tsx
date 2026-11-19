"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import type { BostaCity, BostaConfig, BostaDistrict } from "@/lib/bosta";
import {
  BOSTA_MAX_COD,
  BOSTA_PACKAGE_TYPES,
  bostaStateLabel,
  bostaStateTone,
  bostaTrackingUrl,
} from "@/lib/bosta-status";
import { formatDate, formatMoney } from "@/lib/format";
import { cardClass, dangerBtn, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export type BostaShipmentOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerRegion: string;
  customerAddress: string;
  notes: string;
  status: string;
  total: number;
  carrier: string;
  carrierRef: string;
  trackingNumber: string;
  carrierStatus: string;
  carrierUpdatedAt: string | null;
};

type FormState = {
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  firstLine: string;
  secondLine: string;
  codEnabled: boolean;
  cod: number;
  packageType: string;
  packageWeight: number;
  notes: string;
};

const EMPTY_FORM: FormState = {
  cityId: "",
  cityName: "",
  districtId: "",
  districtName: "",
  firstLine: "",
  secondLine: "",
  codEnabled: true,
  cod: 0,
  packageType: "SMALL",
  packageWeight: 1,
  notes: "",
};

export default function BostaShipmentCard({
  storeId,
  order,
  currency,
  enabled,
  onChanged,
}: {
  storeId: string;
  order: BostaShipmentOrder;
  currency: string;
  enabled: boolean;
  onChanged: () => void;
}) {
  const [config, setConfig] = useState<BostaConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [cities, setCities] = useState<BostaCity[]>([]);
  const [districts, setDistricts] = useState<BostaDistrict[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [busy, setBusy] = useState<"" | "create" | "refresh" | "cancel">("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    fetch(`/api/stores/${storeId}/shipping/bosta`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.config) setConfig(payload.config as BostaConfig);
      })
      .catch(() => undefined);
  }, [storeId, enabled]);

  async function loadCities() {
    setLoadingCities(true);
    setModalError("");
    try {
      const response = await fetch(`/api/stores/${storeId}/shipping/bosta/cities`);
      const payload = await response.json();
      if (!response.ok) {
        setModalError(payload.error || "مش قادرين نجيب مدن بوسطة.");
        return;
      }
      setCities(payload.cities || []);
    } catch {
      setModalError("مشكلة في الاتصال ببوسطة.");
    } finally {
      setLoadingCities(false);
    }
  }

  async function loadDistricts(cityId: string) {
    setLoadingDistricts(true);
    setDistricts([]);
    setModalError("");
    try {
      const response = await fetch(
        `/api/stores/${storeId}/shipping/bosta/districts?cityId=${encodeURIComponent(cityId)}`
      );
      const payload = await response.json();
      if (!response.ok) {
        setModalError(payload.error || "مش قادرين نجيب أحياء المدينة دي.");
        return;
      }
      setDistricts(payload.districts || []);
    } catch {
      setModalError("مشكلة في الاتصال ببوسطة.");
    } finally {
      setLoadingDistricts(false);
    }
  }

  function openModal() {
    setError("");
    setModalError("");
    setCities([]);
    setDistricts([]);
    setForm({
      ...EMPTY_FORM,
      firstLine: order.customerAddress || "",
      codEnabled: config?.codEnabled !== false,
      cod: Math.round(order.total),
      packageType: config?.packageType || "SMALL",
      packageWeight: Number(config?.packageWeight) || 1,
      notes: order.notes || config?.defaultNotes || "",
    });
    setOpen(true);
    loadCities();
  }

  async function createShipment() {
    if (!form.cityId || !form.cityName) {
      setModalError("اختار المدينة.");
      return;
    }
    if (!form.districtId) {
      setModalError("اختار الحي.");
      return;
    }
    if (form.firstLine.trim().length < 6) {
      setModalError("اكتب عنوان تفصيلي أكتر (أكتر من 5 حروف).");
      return;
    }
    if (form.codEnabled && (Number(form.cod) < 0 || Number(form.cod) > BOSTA_MAX_COD)) {
      setModalError(`مبلغ التحصيل لازم يكون بين 0 و ${BOSTA_MAX_COD.toLocaleString("en-US")} جنيه.`);
      return;
    }

    setBusy("create");
    setModalError("");
    try {
      const response = await fetch(`/api/stores/${storeId}/orders/${order.id}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: form.cityName,
          cityId: form.cityId,
          districtId: form.districtId,
          districtName: form.districtName,
          firstLine: form.firstLine.trim(),
          secondLine: form.secondLine.trim() || undefined,
          cod: form.codEnabled ? Number(form.cod) || 0 : 0,
          packageType: form.packageType,
          packageWeight: Number(form.packageWeight) || 1,
          notes: form.notes.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setModalError(payload.error || "مش قادرين ننشئ الشحنة.");
        return;
      }
      setOpen(false);
      onChanged();
    } catch {
      setModalError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy("");
    }
  }

  async function refreshShipment() {
    setBusy("refresh");
    setError("");
    try {
      const response = await fetch(`/api/stores/${storeId}/orders/${order.id}/shipment`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "مش قادرين نحدّث حالة الشحنة.");
        return;
      }
      onChanged();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy("");
    }
  }

  async function cancelShipment() {
    if (!confirm("متأكد إنك عايز تلغي شحنة بوسطة؟ الإجراء ده مش ممكن التراجع عنه.")) return;
    setBusy("cancel");
    setError("");
    try {
      const response = await fetch(`/api/stores/${storeId}/orders/${order.id}/shipment`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "مش قادرين نلغي الشحنة.");
        return;
      }
      onChanged();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy("");
    }
  }

  if (!enabled) {
    return (
      <section className={`${cardClass} p-6`}>
        <h2 className="flex items-center gap-2 font-extrabold text-foreground">
          <Truck className="h-5 w-5 text-primary" />
          شحن بوسطة
        </h2>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          اربط حساب بوسطة عشان تقدر تنشئ شحنة للطلب ده وتتابع حالتها تلقائيًا.
        </p>
        <Link
          href={`/dashboard/stores/${storeId}/settings/carriers`}
          className={`${secondaryBtn} mt-4 w-full`}
        >
          ربط حساب بوسطة
          <ExternalLink className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  if (order.trackingNumber) {
    return (
      <section className={`${cardClass} overflow-hidden`}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-400" />
              <span className="font-extrabold">شحنة بوسطة</span>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${bostaStateTone(
                order.carrierStatus
              )}`}
            >
              {bostaStateLabel(order.carrierStatus)}
            </span>
          </div>
          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] text-white/60">رقم التتبع</p>
            <p className="font-mono text-sm font-bold tracking-wide" dir="ltr">
              {order.trackingNumber}
            </p>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
          <a
            href={bostaTrackingUrl(order.trackingNumber)}
            target="_blank"
            rel="noreferrer"
            className={`${secondaryBtn} w-full`}
          >
            تتبع على بوسطة
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={refreshShipment}
              disabled={Boolean(busy)}
              className={secondaryBtn}
            >
              {busy === "refresh" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              تحديث الحالة
            </button>
            {order.status !== "delivered" ? (
              <button onClick={cancelShipment} disabled={Boolean(busy)} className={dangerBtn}>
                {busy === "cancel" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                إلغاء الشحنة
              </button>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                تم التسليم
              </span>
            )}
          </div>
          <p className="text-center text-[10px] text-muted">
            {order.carrierUpdatedAt
              ? `آخر تحديث من بوسطة: ${formatDate(order.carrierUpdatedAt)}`
              : "بيتم تحديث الحالة تلقائيًا من بوسطة."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={`${cardClass} p-6`}>
        <h2 className="flex items-center gap-2 font-extrabold text-foreground">
          <Truck className="h-5 w-5 text-primary" />
          شحن بوسطة
        </h2>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          اعمل شحنة لبوسطة من الطلب ده، وهناخد رقم التتبع ونحدّث الحالة تلقائيًا.
        </p>
        <div className="mt-3 rounded-xl border border-border bg-surface/70 px-3 py-2 text-[11px] text-muted">
          قيمة التحصيل المتوقعة:{" "}
          <span className="font-bold text-foreground">{formatMoney(order.total, currency)}</span>
        </div>
        <button onClick={openModal} className={`${primaryBtn} mt-4 w-full`}>
          <Package className="h-4 w-4" />
          إنشاء شحنة بوسطة
        </button>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">بوسطة</p>
                <h3 className="text-lg font-extrabold text-foreground">إنشاء شحنة جديدة</h3>
                <p className="mt-0.5 text-[11px] text-muted">
                  {order.customerName} · <span dir="ltr">{order.customerPhone}</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {modalError}
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>المدينة</label>
                <select
                  value={form.cityId}
                  onChange={(event) => {
                    const city = cities.find((item) => item.id === event.target.value);
                    setForm((previous) => ({
                      ...previous,
                      cityId: event.target.value,
                      cityName: city?.name || "",
                      districtId: "",
                      districtName: "",
                    }));
                    if (event.target.value) loadDistricts(event.target.value);
                    else setDistricts([]);
                  }}
                  className={inputClass}
                  disabled={loadingCities}
                >
                  <option value="">{loadingCities ? "بنحمّل المدن…" : "اختار المدينة…"}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>الحي / المنطقة</label>
                <select
                  value={form.districtId}
                  onChange={(event) => {
                    const district = districts.find((item) => item.id === event.target.value);
                    setForm((previous) => ({
                      ...previous,
                      districtId: event.target.value,
                      districtName: district?.name || "",
                    }));
                  }}
                  className={inputClass}
                  disabled={!form.cityId || loadingDistricts}
                >
                  <option value="">
                    {loadingDistricts ? "بنحمّل الأحياء…" : "اختار الحي…"}
                  </option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>العنوان التفصيلي</label>
                <input
                  value={form.firstLine}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, firstLine: event.target.value }))
                  }
                  placeholder="اسم الشارع، رقم العمارة، علامة مميزة"
                  className={inputClass}
                  maxLength={300}
                />
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                  <MapPin className="h-3 w-3" />
                  لازم يكون أكتر من 5 حروف.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>علامة مميزة / تفاصيل إضافية (اختياري)</label>
                <input
                  value={form.secondLine}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, secondLine: event.target.value }))
                  }
                  placeholder="مثال: بجوار مسجد النور"
                  className={inputClass}
                  maxLength={200}
                />
              </div>

              <div>
                <label className={labelClass}>نوع الباكدج</label>
                <select
                  value={form.packageType}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, packageType: event.target.value }))
                  }
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
                <label className={labelClass}>الوزن (كجم)</label>
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={form.packageWeight}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      packageWeight: Number(event.target.value),
                    }))
                  }
                  className={inputClass}
                  dir="ltr"
                />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-border bg-surface/60 p-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.codEnabled}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, codEnabled: event.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 accent-amber-600"
                  />
                  <span className="text-sm font-bold text-foreground">تحصيل المبلغ عند الاستلام</span>
                </label>
                {form.codEnabled && (
                  <div className="mt-3">
                    <label className="mb-1 block text-[10px] text-muted">المبلغ المطلوب تحصيله</label>
                    <input
                      type="number"
                      min={0}
                      value={form.cod}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, cod: Number(event.target.value) }))
                      }
                      className={inputClass}
                      dir="ltr"
                    />
                    <p className={`mt-1 text-[10px] ${Number(form.cod) > BOSTA_MAX_COD ? "font-bold text-rose-600 dark:text-rose-400" : "text-muted"}`}>
                      الحد الأقصى {BOSTA_MAX_COD.toLocaleString("en-US")} جنيه.
                      {Number(form.cod) > BOSTA_MAX_COD
                        ? " المبلغ أكبر من الحد — قلّل التحصيل أو اقفله وجرّب تاني."
                        : ""}
                    </p>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>ملاحظات للشحنة (اختياري)</label>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, notes: event.target.value }))
                  }
                  rows={2}
                  maxLength={500}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={createShipment}
                disabled={busy === "create"}
                className={`${primaryBtn} flex-1`}
              >
                {busy === "create" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                {busy === "create" ? "بننشئ الشحنة..." : "إنشاء الشحنة"}
              </button>
              <button onClick={() => setOpen(false)} className={secondaryBtn}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
