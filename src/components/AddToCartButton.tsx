"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";

export default function AddToCartButton({
  product,
  storeSlug,
  base,
}: {
  product: any;
  storeSlug: string;
  base?: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const prefix = base ?? `/${storeSlug}`;

  function addToCart() {
    const key = `cart:${storeSlug}`;
    const raw = localStorage.getItem(key);
    const cart: { productId: string; name: string; price: number; quantity: number }[] = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex((c) => c.productId === product.id);
    if (idx >= 0) cart[idx].quantity += qty;
    else cart.push({ productId: product.id, name: product.name, price: product.price, quantity: qty });
    localStorage.setItem(key, JSON.stringify(cart));
    router.push(`${prefix}/cart`);
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="flex items-center justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:w-36">
        <button
          type="button"
          onClick={() => setQty(Math.max(1, qty - 1))}
          aria-label="تقليل الكمية"
          className="grid h-11 w-11 place-items-center text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-sm font-extrabold text-foreground">{qty}</span>
        <button
          type="button"
          onClick={() => setQty(qty + 1)}
          aria-label="زيادة الكمية"
          className="grid h-11 w-11 place-items-center text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={addToCart}
        disabled={product.stock <= 0}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <ShoppingCart className="h-4 w-4" />
        {product.stock <= 0 ? "نفذ المخزون" : "ضيف للسلة"}
      </button>
    </div>
  );
}
