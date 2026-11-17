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
    const store = await prisma.store.findFirst({
      where: { customDomain: host },
      select: { slug: true },
    });
    return NextResponse.json(
      { slug: store?.slug || null },
      { headers: { "cache-control": "public, max-age=60, s-maxage=60" } }
    );
  } catch (error) {
    console.error("domain lookup failed", error);
    return NextResponse.json({ slug: null }, { status: 500 });
  }
}
