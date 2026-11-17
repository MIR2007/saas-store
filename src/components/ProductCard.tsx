"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  images: string;
  stock: number;
  options?: string;
};

export default function ProductCard({
  product,
  storeSlug,
  base,
  currency,
  cardStyle = "minimal",
  align = "center",
}: {
  product: Product;
  storeSlug: string;
  base?: string;
  currency: string;
  cardStyle?: "minimal" | "bordered" | "elevated";
  align?: "center" | "start";
}) {
  const router = useRouter();
  const prefix = base ?? `/${storeSlug}`;
  let images: string[] = [];
  try {
    images = JSON.parse(product.images || "[]");
  } catch {
    images = [];
  }

  const onSale = product.comparePrice && product.comparePrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.comparePrice!) * 100) : 0;

  function addToCart() {
    try {
      const parsed = JSON.parse(product.options || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        router.push(`${prefix}/products/${product.id}`);
        return;
      }
    } catch {
      // ignore invalid options JSON
    }
    const key = `cart:${storeSlug}`;
    const raw = localStorage.getItem(key);
    const cart: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }[] = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex((c) => c.productId === product.id && c.name === product.name);
    if (idx >= 0) cart[idx].quantity += 1;
    else
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: images[0] || "",
      });
    localStorage.setItem(key, JSON.stringify(cart));
    router.push(`${prefix}/cart`);
  }

  const shell =
    cardStyle === "bordered"
      ? "border border-border bg-card p-2"
      : cardStyle === "elevated"
        ? "border border-border bg-card p-2 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.45)]"
        : "bg-transparent";

  return (
    <article className={`group flex flex-col transition-transform duration-300 hover:-translate-y-1 ${shell}`}>
      <Link href={`${prefix}/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface">
          {images[0] ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              {images[1] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[1]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-muted">🛍️</div>
          )}

          {onSale && (
            <span className="absolute start-2.5 top-2.5 bg-[#111111] px-2 py-1 text-[9px] font-bold tracking-[0.08em] text-white">
              خصم {discount}%
            </span>
          )}
          {product.stock <= 0 && (
            <span className="absolute inset-x-0 bottom-0 bg-black/65 py-1.5 text-center text-[10px] font-bold text-white backdrop-blur-sm">
              نفذ المخزون
            </span>
          )}
        </div>
      </Link>

      <div
        className={`flex flex-1 flex-col px-1 pt-3.5 ${
          align === "center" ? "items-center text-center" : "items-start text-start"
        }`}
      >
        <Link href={`${prefix}/products/${product.id}`}>
          <h3 className="store-heading line-clamp-2 min-h-[2.4rem] text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-sm">
            {product.name}
          </h3>
        </Link>

        <span className={`store-hairline my-2.5 ${align === "center" ? "mx-auto" : ""}`} />

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[13px] font-bold tracking-wide text-foreground sm:text-sm">
            {formatMoney(product.price, currency)}
          </span>
          {onSale && (
            <span className="text-[11px] text-muted line-through">
              {formatMoney(product.comparePrice!, currency)}
            </span>
          )}
        </div>

        <button
          onClick={addToCart}
          disabled={product.stock <= 0}
          className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-[var(--store-btn-radius)] border border-foreground/25 bg-transparent py-2.5 text-[10px] font-bold tracking-[0.1em] text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {product.stock <= 0 ? "نفذ المخزون" : "ضيف للسلة"}
        </button>
      </div>
    </article>
  );
}
