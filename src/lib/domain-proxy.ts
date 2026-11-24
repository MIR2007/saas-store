/**
 * Free custom-domain mode: a small Netlify edge proxy (see `/custom-domain-proxy`)
 * terminates TLS for merchant domains and forwards every request to the
 * platform with the original host in a signed header.
 *
 * This is used only while Cloudflare for SaaS is unavailable. When Cloudflare
 * for SaaS is enabled it takes priority and this module stays idle.
 *
 * Environment:
 *  - CUSTOM_DOMAIN_PROXY_TARGET   e.g. "bp-domains.netlify.app" (enables the mode)
 *  - CUSTOM_DOMAIN_PROXY_SECRET   shared secret, same value on Netlify (BP_PROXY_SECRET)
 *  - CUSTOM_DOMAIN_PROXY_APEX_IP  A record for apex domains (Netlify load balancer)
 *  - NETLIFY_API_TOKEN / NETLIFY_SITE_ID  attach domains to the Netlify site automatically
 */

import { normalizeHost } from "@/lib/domains";
import { CUSTOM_DOMAIN_CNAME } from "@/lib/cloudflare-domains";

/** Header names shared with the Netlify edge function. Keep in sync. */
export const FORWARDED_HOST_HEADER = "x-bp-forwarded-host";
export const PROXY_SECRET_HEADER = "x-bp-proxy-secret";
/** Set by `src/proxy.ts` on storefront requests so server components know the public host. */
export const STORE_HOST_HEADER = "x-bp-store-host";
/** Served by the edge function itself; used to confirm DNS + TLS + proxy all work. */
export const PROXY_HEALTH_PATH = "/.well-known/beepanal-proxy";

const NETLIFY_API = "https://api.netlify.com/api/v1";

function env(name: string) {
  return (process.env[name] || "").trim();
}

export function proxyTarget() {
  return normalizeHost(env("CUSTOM_DOMAIN_PROXY_TARGET"));
}

export function proxyModeEnabled() {
  return Boolean(proxyTarget() && env("CUSTOM_DOMAIN_PROXY_SECRET"));
}

export function proxyApexIp() {
  return env("CUSTOM_DOMAIN_PROXY_APEX_IP");
}

/**
 * Where merchants must point their domain: the edge proxy in free mode,
 * otherwise the Cloudflare for SaaS fallback origin.
 */
export function routingTarget() {
  return proxyModeEnabled() ? proxyTarget() : CUSTOM_DOMAIN_CNAME;
}

/**
 * DNS record the merchant adds for routing. In proxy mode every host (apex,
 * www, or a subdomain) uses an A record on Netlify's load balancer IP:
 * registrars refuse a CNAME on the root, and the addresses `*.netlify.app`
 * resolves to were unreachable from Egyptian networks in testing, while the
 * load balancer IP worked. `apex` is kept for the Cloudflare for SaaS mode.
 */
export function routingRecord(domain: string, _apex?: boolean) {
  const ip = proxyApexIp();
  if (proxyModeEnabled() && ip) {
    return { type: "A", name: domain, value: ip };
  }
  return { type: "CNAME", name: domain, value: routingTarget() };
}

export function domainMode(): "proxy" | "cloudflare" {
  return proxyModeEnabled() ? "proxy" : "cloudflare";
}

function netlifyConfigured() {
  return Boolean(env("NETLIFY_API_TOKEN") && env("NETLIFY_SITE_ID"));
}

/** Constant-time string comparison for the shared secret. */
function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Returns the merchant host forwarded by the edge proxy, or null when the
 * request did not come through the proxy (missing or wrong secret).
 */
export function trustedForwardedHost(headers: Headers): string | null {
  const secret = env("CUSTOM_DOMAIN_PROXY_SECRET");
  if (!secret) return null;
  const provided = headers.get(PROXY_SECRET_HEADER) || "";
  if (!safeEqual(provided, secret)) return null;
  const host = normalizeHost(headers.get(FORWARDED_HOST_HEADER));
  return host || null;
}

type NetlifySite = { domain_aliases?: string[]; custom_domain?: string | null };

async function netlify<T>(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${NETLIFY_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env("NETLIFY_API_TOKEN")}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 502, data: null as T | null };
  }
}

/** The domain plus its www twin. */
function hostsFor(domain: string) {
  const host = normalizeHost(domain).replace(/^www\./, "");
  return [host, `www.${host}`];
}

/**
 * Netlify issues one certificate for every alias on the site, so a host whose
 * DNS does not point at the proxy could block certificates for other stores.
 * Callers pass only hosts already verified to route to the proxy.
 */

async function updateAliases(change: (aliases: Set<string>) => void) {
  const siteId = encodeURIComponent(env("NETLIFY_SITE_ID"));
  const site = await netlify<NetlifySite>(`/sites/${siteId}`);
  if (!site.ok || !site.data) return { ok: false, status: site.status };

  const aliases = new Set((site.data.domain_aliases || []).map((item) => normalizeHost(item)));
  const before = aliases.size;
  const snapshot = JSON.stringify([...aliases].sort());
  change(aliases);
  if (aliases.size === before && JSON.stringify([...aliases].sort()) === snapshot) {
    return { ok: true, status: 200 };
  }

  const updated = await netlify<NetlifySite>(`/sites/${siteId}`, {
    method: "PATCH",
    body: JSON.stringify({ domain_aliases: [...aliases] }),
  });
  return { ok: updated.ok, status: updated.status };
}

/**
 * Adds the merchant domain to the Netlify site and asks Netlify to provision
 * the Let's Encrypt certificate. Safe to call repeatedly.
 */
export async function attachProxyDomain(hosts: string[]) {
  if (!netlifyConfigured()) return { ok: false, status: 503 };
  const result = await updateAliases((aliases) => {
    for (const host of hosts) aliases.add(normalizeHost(host));
  });
  if (result.ok) {
    // Certificate provisioning is asynchronous; failures here are retried on the next check.
    await netlify<unknown>(`/sites/${encodeURIComponent(env("NETLIFY_SITE_ID"))}/ssl`, {
      method: "POST",
    });
  }
  return result;
}

export async function detachProxyDomain(domain: string) {
  if (!netlifyConfigured()) return { ok: false, status: 503 };
  return updateAliases((aliases) => {
    for (const host of hostsFor(domain)) aliases.delete(host);
  });
}

/**
 * True only when `https://<domain>` answers through the edge proxy with a valid
 * certificate. This is the single signal used to mark a domain active.
 */
export async function probeProxyDomain(domain: string) {
  const host = normalizeHost(domain);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://${host}${PROXY_HEALTH_PATH}`, {
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean; host?: string };
    return data.ok === true && normalizeHost(data.host) === host;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
