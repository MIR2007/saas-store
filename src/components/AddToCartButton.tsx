"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";

type OptionValue = { label: string; value: string; image?: string };
type ProductOption = { name: string; type: "color" | "image" | "button"; values: OptionValue[] };

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
      shipping?: number;
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
        shipping: product.shippingPrice || 0,
        image,
      });
    localStorage.setItem(key, JSON.stringify(cart));
    router.push(`${prefix}/cart`);
  }

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.name}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-extrabold text-foreground">{option.name}</span>
            <span className="text-[11px] text-muted">{selected[option.name]}</span>
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
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-black/10 shadow-inner"
                      style={{ backgroundColor: value.value || "#d97706" }}
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
                    className={`overflow-hidden rounded-xl border text-start transition-all ${
                      active
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
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
                  className={`min-w-10 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                      : "border-border bg-card text-foreground hover:border-primary/40"
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
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <ShoppingCart className="h-4 w-4" />
          {product.stock <= 0 ? "نفذ المخزون" : "ضيف للسلة"}
        </button>
      </div>
    </div>
  );
}
