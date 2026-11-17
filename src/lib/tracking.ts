/**
 * Per-store advertising pixels. The IDs are public by nature (they appear in
 * the storefront source), but we still validate their shape before injecting
 * them into inline scripts so a merchant cannot inject arbitrary JavaScript.
 */
export type TrackingConfig = {
  metaPixelId: string;
  metaEnabled: boolean;
  tiktokPixelId: string;
  tiktokEnabled: boolean;
};

const META_PIXEL_RE = /^\d{10,20}$/;
const TIKTOK_PIXEL_RE = /^[A-Za-z0-9]{10,40}$/;

export function isValidMetaPixelId(value: unknown): boolean {
  return META_PIXEL_RE.test(String(value ?? "").trim());
}

export function isValidTikTokPixelId(value: unknown): boolean {
  return TIKTOK_PIXEL_RE.test(String(value ?? "").trim());
}

export function normalizeMetaPixelId(value: unknown): string {
  const id = String(value ?? "").trim();
  return META_PIXEL_RE.test(id) ? id : "";
}

export function normalizeTikTokPixelId(value: unknown): string {
  const id = String(value ?? "").trim();
  return TIKTOK_PIXEL_RE.test(id) ? id : "";
}

export function parseTrackingConfig(raw?: string | null): TrackingConfig {
  let parsed: Record<string, unknown> = {};
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      parsed = value as Record<string, unknown>;
    }
  } catch {
    parsed = {};
  }

  const metaPixelId = normalizeMetaPixelId(parsed.metaPixelId);
  const tiktokPixelId = normalizeTikTokPixelId(parsed.tiktokPixelId);

  return {
    metaPixelId,
    // An ID is enough to enable a pixel; a merchant can keep the ID saved but
    // switch tracking off temporarily.
    metaEnabled: Boolean(metaPixelId) && parsed.metaEnabled !== false,
    tiktokPixelId,
    tiktokEnabled: Boolean(tiktokPixelId) && parsed.tiktokEnabled !== false,
  };
}

export function serializeTrackingConfig(config: TrackingConfig): string {
  return JSON.stringify({
    metaPixelId: normalizeMetaPixelId(config.metaPixelId),
    metaEnabled: Boolean(config.metaPixelId) && config.metaEnabled !== false,
    tiktokPixelId: normalizeTikTokPixelId(config.tiktokPixelId),
    tiktokEnabled: Boolean(config.tiktokPixelId) && config.tiktokEnabled !== false,
  });
}

export function trackingConfigIsEmpty(config: TrackingConfig): boolean {
  return !config.metaPixelId && !config.tiktokPixelId;
}
