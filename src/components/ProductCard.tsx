"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  images: string;
  stock: number;
};

export default function ProductCard({ product, storeSlug, currency }: { product: Product; storeSlug: string; currency: string }) {
  const router = useRouter();
  let images: string[] = [];
  try { images = JSON.parse(product.images || "[]"); } catch { images = []; }

  const onSale = product.comparePrice && product.comparePrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.comparePrice!) * 100) : 0;

  function addToCart() {
    const key = `cart:${storeSlug}`;
    const raw = localStorage.getItem(key);
    const cart: { productId: string; name: string; price: number; quantity: number }[] = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex((c) => c.productId === product.id);
    if (idx >= 0) cart[idx].quantity += 1;
    else cart.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
    localStorage.setItem(key, JSON.stringify(cart));
    router.push(`/${storeSlug}/cart`);
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
      <Link href={`/${storeSlug}/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-muted">🛍️</div>
          )}
          {onSale && (
            <span className="absolute start-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
              خصم {discount}%
            </span>
          )}
          {product.stock <= 0 && (
            <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-center text-[10px] font-bold text-white backdrop-blur-sm">
              نفذ المخزون
            </span>
          )}
        </div>
      </Link>
      <div className="p-3.5 sm:p-4">
        <Link href={`/${storeSlug}/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="text-base font-extrabold text-primary">{formatMoney(product.price, currency)}</span>
          {onSale && (
            <span className="text-[11px] text-muted line-through">{formatMoney(product.comparePrice!, currency)}</span>
          )}
        </div>
        <button
          onClick={addToCart}
          disabled={product.stock <= 0}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {product.stock <= 0 ? "نفذ المخزون" : "ضيف للسلة"}
        </button>
      </div>
    </div>
  );
}
