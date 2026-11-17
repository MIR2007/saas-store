"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";

type OptionValue = { label: string; value: string; image?: string };
type ProductOption = { name: string; type: "color" | "image" | "button"; values: OptionValue[] };

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  images?: string | null;
  options?: string | null;
};

export default function AddToCartButton({
  product,
  storeSlug,
  base,
}: {
  product: CartProduct;
  storeSlug: string;
  base?: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const prefix = base ?? `/${storeSlug}`;

  const options = useMemo<ProductOption[]>(() => {
    try {
      const parsed = JSON.parse(product.options || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [product.options]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const option of options) {
      if (option.values[0]) initial[option.name] = option.values[0].label;
    }
    return initial;
  });

  const variant = options
    .map((option) => (selected[option.name] ? `${option.name}: ${selected[option.name]}` : ""))
    .filter(Boolean)
    .join(" · ");

  function addToCart() {
    const key = `cart:${storeSlug}`;
    const raw = localStorage.getItem(key);
    const cart: {
      productId: string;
      name: string;
      variant?: string;
      price: number;
      quantity: number;
      image?: string;
    }[] = raw ? JSON.parse(raw) : [];
    let image = "";
    try {
      image = JSON.parse(product.images || "[]")[0] || "";
    } catch {
      image = "";
    }
    const idx = cart.findIndex(
      (c) => c.productId === product.id && (c.variant || "") === variant
    );
    if (idx >= 0) cart[idx].quantity += qty;
    else
      cart.push({
        productId: product.id,
        name: product.name,
        variant,
        price: product.price,
        quantity: qty,
        image,
      });
    localStorage.setItem(key, JSON.stringify(cart));
    router.push(`${prefix}/cart`);
  }

  return (
    <div className="space-y-5">
      {options.map((option) => (
        <div key={option.name}>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="store-eyebrow text-[10px] font-bold uppercase text-muted">{option.name}</span>
            <span className="text-[11px] font-semibold text-foreground">{selected[option.name]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const active = selected[option.name] === value.label;
              if (option.type === "color") {
                return (
                  <button
                    key={value.label}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, [option.name]: value.label }))}
                    className={`flex items-center gap-2 border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-foreground hover:border-foreground/40"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10 shadow-inner"
                      style={{ backgroundColor: value.value || "#b08d57" }}
                    />
                    {value.label}
                  </button>
                );
              }
              if (option.type === "image") {
                return (
                  <button
                    key={value.label}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, [option.name]: value.label }))}
                    className={`overflow-hidden border text-start transition-colors ${
                      active ? "border-foreground" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <span className="block h-16 w-16 overflow-hidden bg-surface">
                      {value.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={value.image} alt={value.label} className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-[10px] text-muted">
                          صورة
                        </span>
                      )}
                    </span>
                    <span className="block px-2 py-1 text-[10px] font-bold text-foreground">{value.label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={value.label}
                  type="button"
                  onClick={() => setSelected((prev) => ({ ...prev, [option.name]: value.label }))}
                  className={`min-w-10 border px-3 py-2 text-[11px] font-semibold transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:border-foreground/40"
                  }`}
                >
                  {value.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex items-center justify-between border border-border bg-card sm:w-32">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            aria-label="تقليل الكمية"
            className="grid h-12 w-10 place-items-center text-muted transition-colors hover:text-foreground"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-bold text-foreground">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            aria-label="زيادة الكمية"
            className="grid h-12 w-10 place-items-center text-muted transition-colors hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={addToCart}
          disabled={product.stock <= 0}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--store-btn-radius)] bg-foreground px-6 py-3.5 text-[11px] font-bold tracking-[0.14em] text-background transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-foreground disabled:hover:text-background"
        >
          <ShoppingBag className="h-4 w-4" />
          {product.stock <= 0 ? "نفذ المخزون" : "ضيف للسلة"}
        </button>
      </div>
    </div>
  );
}
