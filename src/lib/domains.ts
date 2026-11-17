export const PLATFORM_DOMAIN = "beepanal.store";
export const PLATFORM_HOST = PLATFORM_DOMAIN;
export const PLATFORM_URL = `https://${PLATFORM_DOMAIN}`;

export function normalizeHost(raw: string | null | undefined) {
  return (raw || "").split(":")[0].trim().toLowerCase().replace(/\.$/, "");
}

export function isPlatformHost(host: string) {
  const h = normalizeHost(host);
  return (
    h === PLATFORM_DOMAIN ||
    h === `www.${PLATFORM_DOMAIN}` ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h.endsWith(".vercel.app") ||
    h.endsWith(".vercel.sh") ||
    h.endsWith(".workers.dev") ||
    h.endsWith(".pages.dev")
  );
}

export function subdomainFor(slug: string) {
  return `${slug}.${PLATFORM_DOMAIN}`;
}

export function storePublicUrl(
  slug: string,
  customDomain?: string | null,
  customDomainStatus?: string | null
) {
  // Pending domains are not serving traffic yet (Cloudflare for SaaS is not
  // enabled), so canonical/OG/sitemap URLs must stay on the free subdomain.
  if (customDomain && (!customDomainStatus || customDomainStatus === "active")) {
    return `https://${customDomain}`;
  }
  return `https://${subdomainFor(slug)}`;
}

export function extractSubdomain(host: string): string | null {
  const h = normalizeHost(host);
  if (!h.endsWith(`.${PLATFORM_DOMAIN}`)) return null;
  const sub = h.slice(0, -(PLATFORM_DOMAIN.length + 1));
  if (!sub || sub.includes(".")) return null;
  if (sub === "www" || sub === "app" || sub === "admin" || sub === "api" || sub === "customers") return null;
  return sub;
}

export function isValidDomain(value: string) {
  const domain = value.trim().toLowerCase();
  if (domain.length < 4 || domain.length > 253) return false;
  if (!/^(?!-)([a-z0-9-]{1,63})(\.(?!-)[a-z0-9-]{1,63})+$/.test(domain)) return false;
  if (!domain.includes(".")) return false;
  if (domain.endsWith(`.${PLATFORM_DOMAIN}`) || domain === PLATFORM_DOMAIN) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) return false;
  return true;
}

export function cleanDomainInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/\.$/, "");
}
