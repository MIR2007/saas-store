"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition">
      <Link href={`/${storeSlug}/products/${product.id}`}>
        <div className="aspect-square bg-surface">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-4xl">🛍️</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/${storeSlug}/products/${product.id}`}>
          <h3 className="font-medium text-foreground line-clamp-2">{product.name}</h3>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-bold text-primary">{product.price.toLocaleString()} {currency}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-muted line-through">{product.comparePrice.toLocaleString()}</span>
          )}
        </div>
        <button
          onClick={addToCart}
          disabled={product.stock <= 0}
          className="mt-3 w-full bg-primary text-white text-sm font-medium py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stock <= 0 ? "نفذ المخزون" : "أضف إلى السلة"}
        </button>
      </div>
    </div>
  );
}