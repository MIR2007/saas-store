"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { formatMoney } from "@/lib/format";

type CartItem = {
  productId: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  shipping?: number;
  image?: string;
};

export default function CartPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [storeName, setStoreName] = useState("");
  const [base, setBase] = useState(`/${slug}`);

  useEffect(() => {
    const key = `cart:${slug}`;
    const raw = localStorage.getItem(key);
    setCart(raw ? JSON.parse(raw) : []);
    fetch(`/api/public/stores/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.store) {
          setCurrency(d.store.currency || "EGP");
          setStoreName(d.store.name);
          const host = window.location.hostname.toLowerCase();
          const isOwnHost =
            host === `${slug}.beepanal.store` ||
            (d.store.customDomain && host === String(d.store.customDomain).toLowerCase());
          setBase(isOwnHost ? "" : `/${slug}`);
        }
      });
  }, [slug]);

  function save(next: CartItem[]) {
    setCart(next);
    localStorage.setItem(`cart:${slug}`, JSON.stringify(next));
  }

  function updateQty(index: number, q: number) {
    save(cart.map((c, i) => (i === index ? { ...c, quantity: Math.max(1, q) } : c)));
  }

  function remove(index: number) {
    save(cart.filter((_, i) => i !== index));
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const shippingTotal = cart.reduce((s, c) => s + (c.shipping || 0) * c.quantity, 0);
  const total = subtotal + shippingTotal;
  const count = cart.reduce((s, c) => s + c.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-primary ring-1 ring-primary/20">
            <ShoppingBag className="h-9 w-9" />
          </span>
          <h1 className="mt-5 text-xl font-extrabold text-foreground">سلتك فاضية</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            لسه مضفتش حاجة. اتفرج على منتجات المتجر واختار اللي يعجبك.
          </p>
          <Link
            href={`${base}` || "/"}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-black/10 transition-colors hover:bg-primary-dark"
          >
            ارجع للمتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href={`${base}` || "/"} className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <span className="text-muted">←</span>
            {storeName || "المتجر"}
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">سلة التسوق</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">سلة التسوق</h1>
            <p className="mt-0.5 text-xs text-muted">عندك {count} قطعة في السلة.</p>
          </div>
          <Link href={`${base}` || "/"} className="text-xs font-bold text-primary hover:underline">
            كمّل تسوق
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {cart.map((c, index) => (
              <div key={`${c.productId}-${index}`} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-muted">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">{c.name}</div>
                    {c.variant && (
                      <div className="mt-0.5 truncate text-[11px] font-semibold text-primary">{c.variant}</div>
                    )}
                    <div className="mt-0.5 text-xs text-muted">{formatMoney(c.price, currency)} للقطعة</div>
                  </div>
                  <button
                    onClick={() => remove(index)}
                    aria-label="حذف من السلة"
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center overflow-hidden rounded-lg border border-border bg-surface">
                    <button
                      onClick={() => updateQty(index, c.quantity - 1)}
                      aria-label="تقليل"
                      className="grid h-8 w-8 place-items-center text-muted hover:bg-card hover:text-foreground"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-foreground">{c.quantity}</span>
                    <button
                      onClick={() => updateQty(index, c.quantity + 1)}
                      aria-label="زيادة"
                      className="grid h-8 w-8 place-items-center text-muted hover:bg-card hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {formatMoney(c.price * c.quantity, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-extrabold text-foreground">ملخص الطلب</h2>
            <div className="mt-4 space-y-2 text-sm">
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
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm font-bold text-foreground">المجموع</span>
              <span className="text-2xl font-extrabold text-foreground">{formatMoney(total, currency)}</span>
            </div>
            <button
              onClick={() => router.push(`${base}/checkout`)}
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-white shadow-md shadow-black/10 transition-colors hover:bg-primary-dark"
            >
              إتمام الطلب
            </button>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-[11px] text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                الدفع عند الاستلام متاح
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                شحن لكل محافظات مصر
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
