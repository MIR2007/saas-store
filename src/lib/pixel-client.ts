"use client";

export type PixelItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type PixelPayload = Record<string, unknown>;

type PixelCall = {
  event: string;
  payload: PixelPayload;
  eventId?: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track?: (...args: unknown[]) => void;
      page?: () => void;
    };
    __bpMetaQueue?: PixelCall[];
    __bpTikTokQueue?: PixelCall[];
    __bpTikTokPageQueue?: number;
  }
}

// TikTok names the purchase event differently from Meta.
const TIKTOK_EVENTS: Record<string, string> = {
  Purchase: "CompletePayment",
};

/** Builds a `contents` array accepted by both Meta and TikTok. */
export function pixelContents(items: PixelItem[]) {
  return items.map((item) => ({
    id: item.id,
    content_id: item.id,
    content_name: item.name,
    content_type: "product",
    quantity: item.quantity,
    item_price: item.price,
    price: item.price,
  }));
}

function dispatchMeta(call: PixelCall) {
  try {
    window.fbq?.(
      "track",
      call.event,
      call.payload,
      call.eventId ? { eventID: call.eventId } : undefined
    );
  } catch {
    // Pixels must never break the storefront.
  }
}

function dispatchTikTok(call: PixelCall) {
  try {
    const event = TIKTOK_EVENTS[call.event] ?? call.event;
    window.ttq?.track?.(
      event,
      call.payload,
      call.eventId ? { event_id: call.eventId } : undefined
    );
  } catch {
    // Pixels must never break the storefront.
  }
}

/**
 * Sends an event to every configured pixel. If the snippets have not loaded
 * yet, the event is queued and flushed when they are ready.
 */
export function trackPixel(event: string, payload: PixelPayload = {}, eventId?: string) {
  if (typeof window === "undefined") return;
  const call: PixelCall = { event, payload, eventId };

  if (typeof window.fbq === "function") dispatchMeta(call);
  else (window.__bpMetaQueue ||= []).push(call);

  if (typeof window.ttq?.track === "function") dispatchTikTok(call);
  else (window.__bpTikTokQueue ||= []).push(call);
}

/** Page views need a special call for TikTok (`ttq.page()`). */
export function trackPageView() {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    try {
      window.fbq("track", "PageView");
    } catch {
      // Ignore pixel errors.
    }
  } else {
    (window.__bpMetaQueue ||= []).push({ event: "PageView", payload: {} });
  }

  if (typeof window.ttq?.page === "function") {
    try {
      window.ttq.page();
    } catch {
      // Ignore pixel errors.
    }
  } else {
    window.__bpTikTokPageQueue = (window.__bpTikTokPageQueue || 0) + 1;
  }
}

/** Flushes queued events once the pixel stubs exist. */
export function flushPixelQueues() {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    const calls = window.__bpMetaQueue || [];
    window.__bpMetaQueue = [];
    for (const call of calls) dispatchMeta(call);
  }

  if (typeof window.ttq?.track === "function") {
    const calls = window.__bpTikTokQueue || [];
    window.__bpTikTokQueue = [];
    for (const call of calls) dispatchTikTok(call);
  }

  if (typeof window.ttq?.page === "function") {
    const pages = window.__bpTikTokPageQueue || 0;
    window.__bpTikTokPageQueue = 0;
    for (let i = 0; i < pages; i += 1) {
      try {
        window.ttq.page();
      } catch {
        // Ignore pixel errors.
      }
    }
  }
}

/**
 * Fires an event at most once per browser tab. Used for `Purchase` so a page
 * refresh does not report the same order twice.
 */
export function trackPixelOnce(
  key: string,
  event: string,
  payload: PixelPayload = {},
  eventId?: string
) {
  if (typeof window === "undefined") return;
  const storageKey = `bp:pixel:${key}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // If storage is unavailable, still report the event.
  }
  trackPixel(event, payload, eventId);
}
