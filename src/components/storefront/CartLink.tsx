"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CartLink({ slug, base }: { slug: string; base?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(`cart:${slug}`);
    try {
      const cart = raw ? JSON.parse(raw) : [];
      setCount(Array.isArray(cart) ? cart.reduce((s, c) => s + (c.quantity || 0), 0) : 0);
    } catch {
      setCount(0);
    }
  }, [slug]);

  return (
    <Link
      href={`${base ?? `/${slug}`}/cart`}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">السلة</span>
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
