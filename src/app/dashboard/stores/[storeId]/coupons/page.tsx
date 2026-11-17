"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Tag,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

const emptyForm = {
  code: "",
  type: "percent" as "percent" | "fixed",
  value: "10",
  minSubtotal: "0",
  maxUses: "0",
  expiresAt: "",
  active: true,
};

export default function CouponsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function load() {
    const [couponsRes, storeRes] = await Promise.all([
      fetch(`/api/stores/${storeId}/coupons`),
      fetch(`/api/stores/${storeId}`),
    ]);
    if (couponsRes.ok) {
      const data = await couponsRes.json();
      setCoupons(data.coupons || []);
    }
    if (storeRes.ok) {
      const data = await storeRes.json();
      setCurrency(data.store?.currency || "EGP");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function createCoupon(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch(`/api/stores/${storeId}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minSubtotal: Number(form.minSubtotal) || 0,
          maxUses: Number(form.maxUses) || 0,
          active: form.active,
          expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "مش قادرين نضيف الكوبون");
        return;
      }
      setForm(emptyForm);
      setSaved("تم إضافة الكوبون بنجاح.");
      await load();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    setBusyId(coupon.id);
    setError("");
    try {
      const response = await fetch(`/api/stores/${storeId}/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "مش قادرين نعدّل الكوبون");
        return;
      }
      setCoupons((current) =>
        current.map((item) => (item.id === coupon.id ? { ...item, active: !item.active } : item))
      );
    } finally {
      setBusyId(null);
    }
  }

  async function removeCoupon(coupon: Coupon) {
    if (!confirm(`حذف كوبون ${coupon.code}؟`)) return;
    setBusyId(coupon.id);
    setError("");
    try {
      const response = await fetch(`/api/stores/${storeId}/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("مش قادرين نحذف الكوبون");
        return;
      }
      setCoupons((current) => current.filter((item) => item.id !== coupon.id));
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = coupons.filter((coupon) => coupon.active).length;
  const totalUses = coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0);

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel="لوحة المتجر"
        eyebrow="أدوات التسويق"
        title="كوبونات الخصم"
        subtitle="اعمل أكواد خصم بنسبة أو مبلغ ثابت، وحدد الحد الأدنى وعدد الاستخدامات."
        icon={<Ticket className="h-6 w-6" />}
        action={
          <Link href={`/dashboard/stores/${storeId}`} className={secondaryBtn}>
            رجوع للوحة
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <div className={`${cardClass} p-4`}>
          <div className="text-[11px] font-bold text-muted">إجمالي الكوبونات</div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{coupons.length}</div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="text-[11px] font-bold text-muted">الكوبونات المفعّلة</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
        </div>
        <div className={`${cardClass} col-span-2 p-4 sm:col-span-1`}>
          <div className="text-[11px] font-bold text-muted">مرات الاستخدام</div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{totalUses}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className={`${cardClass} p-6 lg:col-span-5`}>
          <h2 className="flex items-center gap-2 font-extrabold text-foreground">
            <Plus className="h-4 w-4 text-primary" />
            كوبون جديد
          </h2>
          <form onSubmit={createCoupon} className="mt-4 space-y-4">
            <div>
              <label className={labelClass}>كود الكوبون</label>
              <input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                required
                placeholder="SUMMER10"
                className={`${inputClass} font-mono uppercase`}
                dir="ltr"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>نوع الخصم</label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value as "percent" | "fixed" })
                  }
                  className={inputClass}
                >
                  <option value="percent">نسبة مئوية %</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>القيمة</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.value}
                  onChange={(event) => setForm({ ...form, value: event.target.value })}
                  required
                  className={inputClass}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>أقل مبلغ للطلب</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minSubtotal}
                  onChange={(event) => setForm({ ...form, minSubtotal: event.target.value })}
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className={labelClass}>أقصى عدد استخدام</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxUses}
                  onChange={(event) => setForm({ ...form, maxUses: event.target.value })}
                  className={inputClass}
                  dir="ltr"
                />
                <p className="mt-1 text-[10px] text-muted">0 = غير محدود</p>
              </div>
            </div>
            <div>
              <label className={labelClass}>تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
                className={inputClass}
                dir="ltr"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-amber-600"
              />
              الكوبون مفعّل من أول لحظة
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {saved}
              </div>
            )}

            <button type="submit" disabled={saving} className={`${primaryBtn} w-full justify-center`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "بنحفظ..." : "إضافة الكوبون"}
            </button>
          </form>
        </section>

        <section className={`${cardClass} overflow-hidden lg:col-span-7`}>
          <div className="border-b border-border p-5">
            <h2 className="flex items-center gap-2 font-extrabold text-foreground">
              <Tag className="h-4 w-4 text-primary" />
              كل الكوبونات
            </h2>
            <p className="mt-1 text-[11px] text-muted">العملاء بيستخدمون الكود في صفحة إتمام الطلب.</p>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-muted">
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              بنحمّل الكوبونات...
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Ticket className="h-7 w-7" />
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-foreground">مفيش كوبونات لسه</h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                اعمل أول كوبون من الفورم وجرّبه في المتجر.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {coupons.map((coupon) => {
                const expired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
                const exhausted = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
                const usable = coupon.active && !expired && !exhausted;
                return (
                  <div key={coupon.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                        usable
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-surface text-muted"
                      }`}
                    >
                      <Ticket className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-foreground" dir="ltr">
                          {coupon.code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            usable
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-surface text-muted"
                          }`}
                        >
                          {usable ? "شغّال" : expired ? "منتهي" : exhausted ? "خلص" : "موقوف"}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        {coupon.type === "percent"
                          ? `خصم ${coupon.value}%`
                          : `خصم ${formatMoney(coupon.value, currency)}`}
                        {coupon.minSubtotal > 0
                          ? ` · أقل طلب ${formatMoney(coupon.minSubtotal, currency)}`
                          : ""}
                        {` · استخدام ${coupon.usedCount}${coupon.maxUses > 0 ? `/${coupon.maxUses}` : ""}`}
                        {coupon.expiresAt ? ` · ينتهي ${formatDate(coupon.expiresAt)}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleCoupon(coupon)}
                        disabled={busyId === coupon.id}
                        className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                      >
                        {coupon.active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCoupon(coupon)}
                        disabled={busyId === coupon.id}
                        aria-label="حذف"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-600 transition-colors hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                      >
                        {busyId === coupon.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
