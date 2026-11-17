import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { storeIsLive } from "@/lib/store-status";
import { storePublicUrl, PLATFORM_URL } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stores = await prisma.store.findMany({
    where: { active: true },
    select: {
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      active: true,
      planStatus: true,
      planRenewsAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 45000,
  });

  const pages: MetadataRoute.Sitemap = [
    {
      url: `${PLATFORM_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${PLATFORM_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${PLATFORM_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const storePages: MetadataRoute.Sitemap = stores
    .filter((store) => storeIsLive(store))
    .map((store) => ({
      url: `${storePublicUrl(store.slug, store.customDomain, store.customDomainStatus)}/`,
      lastModified: store.createdAt,
      changeFrequency: "daily",
      priority: 0.9,
    }));

  return [...pages, ...storePages];
}
