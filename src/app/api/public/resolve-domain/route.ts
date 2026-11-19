import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolves a merchant custom domain to its store slug.
 * Called by the edge proxy, which must stay free of database dependencies so
 * it can be bundled as a lightweight middleware function.
 */
export async function GET(req: Request) {
  const host = (new URL(req.url).searchParams.get("host") || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

  if (!host || host.length > 253 || !host.includes(".")) {
    return NextResponse.json({ slug: null }, { status: 400 });
  }

  try {
    // `www.example.com` works when `example.com` is connected, and vice versa.
    const candidates = host.startsWith("www.") ? [host, host.slice(4)] : [host];

    // Only fully activated domains may serve a storefront. A saved-but-pending
    // domain must never hijack traffic before ownership and SSL are ready.
    const store = await prisma.store.findFirst({
      where: { customDomain: { in: candidates }, customDomainStatus: "active" },
      select: { slug: true },
    });
    return NextResponse.json(
      { slug: store?.slug || null },
      { headers: { "cache-control": "public, max-age=30, s-maxage=30" } }
    );
  } catch (error) {
    console.error("domain lookup failed", error);
    return NextResponse.json({ slug: null }, { status: 500 });
  }
}
