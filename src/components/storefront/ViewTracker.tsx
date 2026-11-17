"use client";

import { useEffect } from "react";

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `store-view:${slug}:${new Date().toISOString().slice(0, 10)}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage may be unavailable
    }
    fetch(`/api/public/stores/${slug}/view`, { method: "POST" }).catch(() => undefined);
  }, [slug]);

  return null;
}
