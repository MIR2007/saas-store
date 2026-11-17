import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    req.headers.get("cf-connecting-ip") ||
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
    "unknown"
  );
}

/**
 * Small fixed-window limiter backed by the uploads KV namespace. KV writes are
 * eventually consistent, so this is a practical abuse guard rather than an
 * exact quota. If KV is unavailable (local dev/build), requests pass through.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const { env } = getCloudflareContext();
    const kv = env.UPLOADS_KV;
    if (!kv) return { ok: true };

    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / windowSeconds);
    const key = `rl:${bucket}:${identifier}:${window}`;
    const current = Number(await kv.get(key)) || 0;
    if (current >= limit) {
      return { ok: false, retryAfter: windowSeconds - (now % windowSeconds) };
    }
    await kv.put(key, String(current + 1), { expirationTtl: windowSeconds + 60 });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function rateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({ error: "محاولات كثيرة جدًا. جرّب تاني بعد شوية." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.max(1, retryAfter)),
      },
    }
  );
}
