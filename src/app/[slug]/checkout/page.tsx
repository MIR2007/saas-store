"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Banknote, Check, MapPin, ShieldCheck, ShoppingBag, Tag, Truck, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { COUNTRIES, countryByName, EGYPT_PAYMENT_METHODS } from "@/lib/egypt";
import { inputClass, labelClass, secondaryBtn } from "@/lib/ui";

type CartItem = {
  productId: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  shipping?: number;
  image?: string;
};

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [storeName, setStoreName] = useState("");
  const [base, setBase] = useState(`/${slug}`);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("مصر");
  const [region, setRegion] = useState("القاهرة");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("cod");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: string;
    value: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(`cart:${slug}`);
    setCart(raw ? JSON.parse(raw) : []);
    fetch(`/api/public/stores/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setCurrency(d.store?.currency || "EGP");
        setStoreName(d.store?.name || "");
        setFreeShippingThreshold(Number(d.store?.freeShippingThreshold) || 0);
        setLive(d.store?.live !== false);
        if (d.store) {
          const host = window.location.hostname.toLowerCase();
          const isOwnHost =
            host === `${slug}.beepanal.store` ||
            (d.store.customDomain && host === String(d.store.customDomain).toLowerCase());
          setBase(isOwnHost ? "" : `/${slug}`);
        }
      });
  }, [slug]);

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const baseShipping = cart.reduce((s, c) => s + (c.shipping || 0) * c.quantity, 0);
  const freeShipping =
    freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const shippingTotal = freeShipping ? 0 : baseShipping;
  const discount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal + shippingTotal - discount);
  const count = cart.reduce((s, c) => s + c.quantity, 0);
  const regions = countryByName(country).regions;
  const remainingForFreeShipping =
    freeShippingThreshold > 0 && subtotal < freeShippingThreshold
      ? freeShippingThreshold - subtotal
      : 0;

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const response = await fetch("/api/public/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug: slug, code, subtotal }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAppliedCoupon(null);
        setCouponError(data.error || "كود الخصم غير صالح.");
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discount: data.discount,
        type: data.type,
        value: data.value,
      });
      setCouponCode(data.code);
    } catch {
      setCouponError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setCouponLoading(false);
    }
  }

  function clearCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!live) {
      setError("المتجر غير متاح حاليًا.");
      return;
    }
    if (cart.length === 0) {
      setError("السلة فاضية، ضيف منتجات الأول.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: slug,
          customerName: name,
          customerPhone: phone,
          customerCountry: country,
          customerRegion: region,
          customerAddress: address,
          notes,
          couponCode: appliedCoupon?.code || undefined,
          items: cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            variant: c.variant || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نأكد الطلب، جرّب تاني.");
        return;
      }
      localStorage.removeItem(`cart:${slug}`);
      router.push(`${base}/order/${data.order.id}`);
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  if (!live) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/10 text-amber-600">
            <ShoppingBag className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-foreground">المتجر غير متاح حاليًا</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            المتجر مش بيستقبل طلبات دلوقتي. جرّب تاني بعد شوية.
          </p>
          <Link
            href={`${base}` || "/"}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white"
          >
            رجوع للمتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href={`${base}/cart`} className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-foreground">
            <span>←</span>
            العودة للسلة
          </Link>
          <span className="text-sm font-extrabold text-foreground">{storeName || "إتمام الطلب"}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-foreground">إتمام الطلب</h1>
          <p className="mt-0.5 text-xs text-muted">املأ بيانات التوصيل وإحنا هنجهّز طلبك في أسرع وقت.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                بيانات التوصيل
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>الاسم بالكامل</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="مثال: أحمد محمد"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>رقم الموبايل</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    inputMode="tel"
                    placeholder="01xxxxxxxxx"
                    className={inputClass}
                    dir="ltr"
                  />
                  <p className="mt-1 text-[10px] text-muted">هنكلمك عليه لتأكيد الطلب.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>الدولة</label>
                    <select
                      value={country}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCountry(next);
                        setRegion(countryByName(next).regions[0] || "");
                      }}
                      className={inputClass}
                    >
                      {COUNTRIES.map((item) => (
                        <option key={item.code} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>المحافظة / المنطقة</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
                      {regions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>العنوان بالتفصيل</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={2}
                    placeholder="الشارع، رقم العمارة، الدور، علامة مميزة…"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    ملاحظات <span className="font-normal text-muted">(اختياري)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="أي تفاصيل تحب تضيفها للتاجر…"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Banknote className="h-4 w-4 text-primary" />
                طريقة الدفع
              </h2>
              <div className="space-y-2">
                {EGYPT_PAYMENT_METHODS.map((method) => {
                  const disabled = "soon" in method && method.soon;
                  const active = payment === method.id && !disabled;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setPayment(method.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface/60 hover:border-primary/30"
                      } ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                          active ? "border-primary bg-primary text-white" : "border-border bg-card"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-foreground">{method.name}</div>
                        <div className="text-[10px] text-muted">{method.desc}</div>
                      </div>
                      {disabled && (
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] font-bold text-muted">قريبًا</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <ShoppingBag className="h-4 w-4 text-primary" />
                ملخص الطلب
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {cart.map((c) => (
                  <li key={c.productId} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">{c.name}</div>
                      {c.variant && <div className="truncate text-[10px] font-semibold text-primary">{c.variant}</div>}
                      <div className="text-[10px] text-muted">الكمية: {c.quantity}</div>
                    </div>
                    <span className="shrink-0 font-bold text-foreground">{formatMoney(c.price * c.quantity, currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-xl border border-dashed border-border bg-surface/60 p-3">
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  كود الخصم
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-2">
                    <div className="min-w-0 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <span dir="ltr" className="font-mono">{appliedCoupon.code}</span>
                      <span className="mx-1">—</span>
                      خصم {formatMoney(appliedCoupon.discount, currency)}
                    </div>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      aria-label="إزالة الكوبون"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                      placeholder="SUMMER10"
                      className={`${inputClass} py-2 font-mono uppercase`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className={`${secondaryBtn} shrink-0 px-3 py-2 text-[11px]`}
                    >
                      {couponLoading ? "..." : "تطبيق"}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">{couponError}</p>
                )}
              </div>

              <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>عدد القطع</span>
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>المنتجات</span>
                  <span className="font-semibold text-foreground">{formatMoney(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>الشحن</span>
                  <span className="font-semibold text-foreground">
                    {shippingTotal > 0 ? formatMoney(shippingTotal, currency) : "مجاني"}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>الخصم</span>
                    <span>- {formatMoney(discount, currency)}</span>
                  </div>
                )}
              </div>

              {remainingForFreeShipping > 0 && (
                <div className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  باقي {formatMoney(remainingForFreeShipping, currency)} وتاخد شحن مجاني.
                </div>
              )}
              {freeShipping && baseShipping > 0 && (
                <div className="mt-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  تم تفعيل الشحن المجاني 🎉
                </div>
              )}

              <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                <span className="text-sm font-bold text-foreground">الإجمالي</span>
                <span className="text-xl font-extrabold text-foreground">{formatMoney(total, currency)}</span>
              </div>

              {error && (
                <div className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-white shadow-md shadow-black/10 transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "بنأكد الطلب..." : "تأكيد الطلب"}
              </button>

              <div className="mt-4 space-y-2 border-t border-border pt-3 text-[11px] text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  بياناتك في أمان ومش بنشاركها.
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  التوصيل خلال 2-5 أيام عمل.
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
