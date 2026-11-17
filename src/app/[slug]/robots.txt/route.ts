import { prisma } from "@/lib/prisma";
import { storeIsLive } from "@/lib/store-status";
import { storePublicUrl } from "@/lib/domains";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      active: true,
      planStatus: true,
      planRenewsAt: true,
    },
  });

  if (!store) return new Response("Not found", { status: 404 });

  const base = storePublicUrl(store.slug, store.customDomain, store.customDomainStatus);
  const live = storeIsLive(store);

  const body = live
    ? [
        "User-Agent: *",
        "Allow: /",
        "Disallow: /cart",
        "Disallow: /checkout",
        "Disallow: /order/",
        "Disallow: /api/",
        "",
        `Host: ${base}`,
        `Sitemap: ${base}/sitemap.xml`,
        "",
      ].join("\n")
    : ["User-Agent: *", "Disallow: /", ""].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
