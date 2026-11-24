// Bee Panal free custom-domain proxy (Netlify Edge Function, runs on Deno).
//
// Netlify terminates TLS for every merchant domain attached to this site and
// this function forwards the request to the platform, adding the merchant host
// in a signed header that `src/proxy.ts` trusts.
//
// Netlify environment variables:
//   BP_ORIGIN        https://beepanal.store   (platform origin)
//   BP_PROXY_SECRET  same value as CUSTOM_DOMAIN_PROXY_SECRET on Cloudflare

// Keep these in sync with src/lib/domain-proxy.ts.
const FORWARDED_HOST_HEADER = "x-bp-forwarded-host";
const PROXY_SECRET_HEADER = "x-bp-proxy-secret";
const STORE_HOST_HEADER = "x-bp-store-host";
const HEALTH_PATH = "/.well-known/beepanal-proxy";

// Hop-by-hop and host-specific headers that must not be forwarded.
const DROP_REQUEST_HEADERS = [
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "content-length",
  FORWARDED_HOST_HEADER,
  PROXY_SECRET_HEADER,
  STORE_HOST_HEADER,
];

declare const Netlify: { env: { get(name: string): string | undefined } };

function env(name: string) {
  return (Netlify.env.get(name) || "").trim();
}

/** Point redirects that target the platform origin back at the merchant domain. */
function rewriteLocation(location: string, origin: URL, host: string) {
  try {
    const url = new URL(location, origin);
    if (url.host !== origin.host) return location;
    url.protocol = "https:";
    url.host = host;
    return url.toString();
  } catch {
    return location;
  }
}

/** Cookies set for the platform domain would be rejected on the merchant domain. */
function rewriteCookie(cookie: string) {
  return cookie.replace(/;\s*domain=[^;]*/gi, "");
}

const handler = async (request: Request) => {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  if (url.pathname === HEALTH_PATH) {
    return Response.json({ ok: true, host }, { headers: { "cache-control": "no-store" } });
  }

  // The *.netlify.app address itself is not a store.
  if (host.endsWith(".netlify.app")) {
    return new Response("Bee Panal custom domain proxy", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const secret = env("BP_PROXY_SECRET");
  const origin = new URL(env("BP_ORIGIN") || "https://beepanal.store");
  if (!secret) {
    return new Response("Proxy is not configured", { status: 503 });
  }

  const headers = new Headers(request.headers);
  for (const name of DROP_REQUEST_HEADERS) headers.delete(name);
  headers.set(FORWARDED_HOST_HEADER, host);
  headers.set(PROXY_SECRET_HEADER, secret);
  headers.set("x-forwarded-proto", "https");

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const target = new URL(url.pathname + url.search, origin);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    return new Response("المتجر مش متاح دلوقتي. جرّب تاني بعد شوية.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    if (name === "set-cookie" || name === "content-encoding" || name === "content-length") return;
    responseHeaders.set(name, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", rewriteCookie(cookie));
  }
  const location = upstream.headers.get("location");
  if (location) responseHeaders.set("location", rewriteLocation(location, origin, host));

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};

export default handler;

export const config = { path: "/*" };
