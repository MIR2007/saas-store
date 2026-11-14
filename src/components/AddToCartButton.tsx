"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ product, storeSlug }: { product: any; storeSlug: string }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  function addToCart() {
    const key = `cart:${storeSlug}`;
    const raw = localStorage.getItem(key);
    const cart: { productId: string; name: string; price: number; quantity: number }[] = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex((c) => c.productId === product.id);
    if (idx >= 0) cart[idx].quantity += qty;
    else cart.push({ productId: product.id, name: product.name, price: product.price, quantity: qty });
    localStorage.setItem(key, JSON.stringify(cart));
    router.push(`/${storeSlug}/cart`);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border border-border rounded-lg">
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-surface">-</button>
        <span className="px-4 py-2">{qty}</span>
        <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-surface">+</button>
      </div>
      <button
        onClick={addToCart}
        disabled={product.stock <= 0}
        className="flex-1 bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
      >
        {product.stock <= 0 ? "نفذ المخزون" : "أضف إلى السلة"}
      </button>
    </div>
  );
}