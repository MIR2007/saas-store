import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

/**
 * Serves uploaded product images from R2 when available, otherwise from the
 * UPLOADS_KV namespace. Uploads are stored under `products/{userId}/...` and
 * referenced as `/api/uploads/products/...` so they work on the platform
 * domain and on every merchant subdomain / custom domain.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[...key]">) {
  const { key } = await ctx.params;
  const objectKey = key.join("/");
  if (!objectKey) return new Response("Not found", { status: 404 });

  const { env } = getCloudflareContext();
  const cacheHeaders = { "cache-control": "public, max-age=31536000, immutable" };

  const bucket = env.UPLOADS;
  if (bucket) {
    const object = await bucket.get(objectKey);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers(cacheHeaders);
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { headers });
  }

  const kv = env.UPLOADS_KV;
  if (kv) {
    const object = await kv.getWithMetadata<{ contentType?: string }>(objectKey, "arrayBuffer");
    if (!object.value) return new Response("Not found", { status: 404 });
    return new Response(object.value, {
      headers: {
        ...cacheHeaders,
        "content-type": object.metadata?.contentType || "application/octet-stream",
      },
    });
  }

  return new Response("Uploads are not configured", { status: 503 });
}
