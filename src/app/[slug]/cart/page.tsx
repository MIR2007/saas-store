"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type CartItem = { productId: string; name: string; price: number; quantity: number };

export default function CartPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("IQD");
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    const key = `cart:${slug}`;
    const raw = localStorage.getItem(key);
    setCart(raw ? JSON.parse(raw) : []);
    fetch(`/api/public/stores/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.store) {
          setCurrency(d.store.currency || "IQD");
          setStoreName(d.store.name);
        }
      });
  }, [slug]);

  function save(next: CartItem[]) {
    setCart(next);
    localStorage.setItem(`cart:${slug}`, JSON.stringify(next));
  }

  function updateQty(productId: string, q: number) {
    save(cart.map((c) => (c.productId === productId ? { ...c, quantity: Math.max(1, q) } : c)));
  }

  function remove(productId: string) {
    save(cart.filter((c) => c.productId !== productId));
  }

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-muted mb-4">سلتك فارغة</p>
          <Link href={`/${slug}`} className="bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${slug}`} className="font-bold text-foreground">{storeName || "المتجر"}</Link>
          <span className="text-sm text-muted">السلة</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">سلة التسوق</h1>
        <div className="bg-white border border-border rounded-2xl divide-y divide-border">
          {cart.map((c) => (
            <div key={c.productId} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium text-foreground">{c.name}</div>
                <div className="text-sm text-muted">{c.price.toLocaleString()} {currency}</div>
              </div>
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => updateQty(c.productId, c.quantity - 1)} className="px-3 py-1 hover:bg-surface">-</button>
                <span className="px-3 py-1">{c.quantity}</span>
                <button onClick={() => updateQty(c.productId, c.quantity + 1)} className="px-3 py-1 hover:bg-surface">+</button>
              </div>
              <div className="font-bold text-foreground w-24 text-left">{(c.price * c.quantity).toLocaleString()}</div>
              <button onClick={() => remove(c.productId)} className="text-red-600 text-sm hover:underline">حذف</button>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-white border border-border rounded-2xl p-6">
          <div className="flex justify-between text-lg font-bold text-foreground mb-4">
            <span>المجموع</span>
            <span>{total.toLocaleString()} {currency}</span>
          </div>
          <button
            onClick={() => router.push(`/${slug}/checkout`)}
            className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary-dark transition"
          >
            إتمام الطلب
          </button>
        </div>
      </main>
    </div>
  );
}