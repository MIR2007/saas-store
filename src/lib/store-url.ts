import { headers } from "next/headers";
import { normalizeHost } from "@/lib/domains";
import { STORE_HOST_HEADER } from "@/lib/domain-proxy";

/**
 * Returns the path prefix for links to a storefront.
 * On the store's own subdomain or custom domain the prefix is empty,
 * so links stay clean (`/cart` instead of `/slug/cart`).
 */
export async function getStoreBase(slug: string, customDomain?: string | null) {
  const h = await headers();
  // Set by src/proxy.ts; behind the free custom-domain proxy the Host header
  // is the platform origin, not the shopper's domain.
  const host = normalizeHost(h.get(STORE_HOST_HEADER) || h.get("host"));

  if (host === `${slug}.beepanal.store`) return "";
  if (customDomain && host === customDomain.toLowerCase()) return "";

  return `/${slug}`;
}
