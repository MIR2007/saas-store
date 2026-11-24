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
    // Store subdomains are handled by extractSubdomain before this check. Any
    // other *.beepanal.store host (customers, app, unknown nested hosts) belongs
    // to the platform, not to a merchant custom domain.
    h.endsWith(`.${PLATFORM_DOMAIN}`) ||
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

const MULTI_PART_SUFFIXES = [
  "com.eg",
  "net.eg",
  "org.eg",
  "gov.eg",
  "edu.eg",
  "com.sa",
  "com.ae",
  "co.uk",
  "org.uk",
  "com.br",
  "com.tr",
];

/**
 * Best-effort apex detection. Used only to show friendlier DNS instructions,
 * never for security decisions.
 */
export function isApexDomain(domain: string) {
  const parts = normalizeHost(domain).split(".").filter(Boolean);
  if (parts.length <= 2) return true;
  const suffix = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.includes(suffix)) return parts.length <= 3;
  return false;
}

/** The registrable root of a host, e.g. "shop.brand.com.eg" -> "brand.com.eg". */
export function rootDomain(domain: string) {
  const parts = normalizeHost(domain).split(".").filter(Boolean);
  const suffix = parts.slice(-2).join(".");
  const keep = MULTI_PART_SUFFIXES.includes(suffix) ? 3 : 2;
  return parts.slice(-keep).join(".");
}

/**
 * The "Host / Name" a merchant types in their registrar's DNS panel: "@" for
 * the root itself, otherwise the part before the root ("www", "shop",
 * "_beepanal-verify.shop").
 */
export function relativeDnsName(name: string, domain: string) {
  const host = normalizeHost(name);
  const root = rootDomain(domain);
  if (host === root) return "@";
  return host.endsWith(`.${root}`) ? host.slice(0, -(root.length + 1)) : host;
}

/** TXT record that proves the merchant controls the domain. */
export function domainVerificationHost(domain: string) {
  return `_beepanal-verify.${normalizeHost(domain)}`;
}

export type DomainDnsState = {
  ownership?: boolean;
  routing?: boolean;
  checkedAt?: string;
  txtName?: string;
  cnameTarget?: string;
  cnameFound?: string | null;
  aRecords?: string[];
  error?: string;
};

export type DomainCloudflareRecord = {
  type?: string;
  domain?: string;
  value?: string;
  reason?: string;
};

export type DomainState = {
  cloudflare?: DomainCloudflareRecord[];
  dns?: DomainDnsState;
  verifiedAt?: string | null;
};

/**
 * `domainVerification` used to store a plain Cloudflare record array. Keep
 * reading that shape so existing stores do not lose their instructions.
 */
export function parseDomainState(raw?: string | null): DomainState {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return { cloudflare: parsed as DomainCloudflareRecord[] };
    if (!parsed || typeof parsed !== "object") return {};
    const source = parsed as Record<string, unknown>;
    return {
      cloudflare: Array.isArray(source.cloudflare)
        ? (source.cloudflare as DomainCloudflareRecord[])
        : [],
      dns:
        source.dns && typeof source.dns === "object" && !Array.isArray(source.dns)
          ? (source.dns as DomainDnsState)
          : undefined,
      verifiedAt: typeof source.verifiedAt === "string" ? source.verifiedAt : null,
    };
  } catch {
    return {};
  }
}

export function serializeDomainState(state: DomainState) {
  return JSON.stringify(state);
}
