import { headers } from "next/headers";
import { normalizeHost } from "@/lib/domains";

/**
 * Returns the path prefix for links to a storefront.
 * On the store's own subdomain or custom domain the prefix is empty,
 * so links stay clean (`/cart` instead of `/slug/cart`).
 */
export async function getStoreBase(slug: string, customDomain?: string | null) {
  const h = await headers();
  const host = normalizeHost(h.get("host"));

  if (host === `${slug}.beepanal.store`) return "";
  if (customDomain && host === customDomain.toLowerCase()) return "";

  return `/${slug}`;
}
