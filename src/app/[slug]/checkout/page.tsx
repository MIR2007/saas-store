"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Banknote, Check, MapPin, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { COUNTRIES, countryByName, EGYPT_PAYMENT_METHODS } from "@/lib/egypt";
import { inputClass, labelClass } from "@/lib/ui";

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

  useEffect(() => {
    const raw = localStorage.getItem(`cart:${slug}`);
    setCart(raw ? JSON.parse(raw) : []);
    fetch(`/api/public/stores/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setCurrency(d.store?.currency || "EGP");
        setStoreName(d.store?.name || "");
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
  const shippingTotal = cart.reduce((s, c) => s + (c.shipping || 0) * c.quantity, 0);
  const total = subtotal + shippingTotal;
  const count = cart.reduce((s, c) => s + c.quantity, 0);
  const regions = countryByName(country).regions;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
              <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>عدد القطع</span>
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>الشحن</span>
                  <span className="font-semibold text-foreground">
                    {shippingTotal > 0 ? formatMoney(shippingTotal, currency) : "مجاني"}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>المنتجات</span>
                  <span className="font-semibold text-foreground">{formatMoney(subtotal, currency)}</span>
                </div>
              </div>
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
