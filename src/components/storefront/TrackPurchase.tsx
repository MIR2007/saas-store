"use client";

import { useEffect } from "react";
import { pixelContents, trackPixelOnce, type PixelItem } from "@/lib/pixel-client";

export default function TrackPurchase({
  orderId,
  enabled = true,
  value,
  currency,
  items,
}: {
  orderId: string;
  enabled?: boolean;
  value: number;
  currency: string;
  items: PixelItem[];
}) {
  useEffect(() => {
    if (!enabled) return;
    trackPixelOnce(
      `purchase:${orderId}`,
      "Purchase",
      {
        content_ids: items.map((item) => item.id),
        content_type: "product",
        contents: pixelContents(items),
        value,
        currency,
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        order_id: orderId,
      },
      orderId
    );
    // Remove the one-time flag so a shared/bookmarked order link does not
    // report a purchase in another browser.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("success")) {
        url.searchParams.delete("success");
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      // Ignore URL cleanup errors.
    }
  }, [orderId, enabled, value, currency, items]);

  return null;
}
