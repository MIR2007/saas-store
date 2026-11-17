import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeIsLive } from "@/lib/store-status";
import { parseShippingRates } from "@/lib/shipping";
import { parseThemeConfig } from "@/lib/themes";

export async function GET(_req: Request, ctx: RouteContext<"/api/public/stores/[slug]">) {
  const { slug } = await ctx.params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      themeColor: true,
      theme: true,
      currency: true,
      active: true,
      planStatus: true,
      planRenewsAt: true,
      freeShippingThreshold: true,
      shippingRates: true,
      themeConfig: true,
      customDomain: true,
    },
  });
  if (!store) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });

  const {
    planStatus,
    planRenewsAt,
    active,
    shippingRates,
    themeConfig,
    ...publicStore
  } = store;
  return NextResponse.json({
    store: {
      ...publicStore,
      shippingRates: parseShippingRates(shippingRates),
      themeConfig: parseThemeConfig(themeConfig),
      active,
      live: storeIsLive({ active, planStatus, planRenewsAt }),
    },
  });
}
