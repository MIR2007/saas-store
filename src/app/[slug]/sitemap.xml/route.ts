import { prisma } from "@/lib/prisma";
import { storeIsLive } from "@/lib/store-status";
import { storePublicUrl } from "@/lib/domains";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      active: true,
      planStatus: true,
      planRenewsAt: true,
      createdAt: true,
    },
  });

  if (!store || !storeIsLive(store)) {
    return new Response("Not found", { status: 404 });
  }

  const base = storePublicUrl(store.slug, store.customDomain, store.customDomainStatus);
  const products = await prisma.product.findMany({
    where: { storeId: store.id, active: true },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 45000,
  });

  const urls = [
    `<url><loc>${escapeXml(`${base}/`)}</loc><lastmod>${store.createdAt.toISOString()}</lastmod><changefreq>daily</changefreq><priority>1</priority></url>`,
    ...products.map(
      (product) =>
        `<url><loc>${escapeXml(`${base}/products/${product.id}`)}</loc><lastmod>${product.createdAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
