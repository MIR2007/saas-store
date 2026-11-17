"use client";

import { useEffect, useRef } from "react";
import { pixelContents, trackPixel } from "@/lib/pixel-client";

export default function TrackViewContent({
  productId,
  name,
  price,
  currency,
  category,
}: {
  productId: string;
  name: string;
  price: number;
  currency: string;
  category?: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPixel("ViewContent", {
      content_ids: [productId],
      content_name: name,
      content_type: "product",
      content_category: category || undefined,
      contents: pixelContents([{ id: productId, name, price, quantity: 1 }]),
      value: price,
      currency,
    });
  }, [productId, name, price, currency, category]);

  return null;
}
