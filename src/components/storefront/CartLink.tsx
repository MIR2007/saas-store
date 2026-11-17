"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function CartLink({ slug, base }: { slug: string; base?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(`cart:${slug}`);
    try {
      const cart = raw ? JSON.parse(raw) : [];
      // The cart lives in localStorage, so it can only be read after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(Array.isArray(cart) ? cart.reduce((s, c) => s + (c.quantity || 0), 0) : 0);
    } catch {
      setCount(0);
    }
  }, [slug]);

  return (
    <Link
      href={`${base ?? `/${slug}`}/cart`}
      aria-label="سلة المشتريات"
      className="relative grid h-10 w-10 place-items-center text-foreground transition-colors hover:text-primary"
    >
      <ShoppingBag className="h-[19px] w-[19px]" />
      {count > 0 && (
        <span className="absolute -end-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-primary px-1 text-[9px] font-extrabold leading-none text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
