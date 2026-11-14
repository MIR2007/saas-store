import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/api/public/stores/[slug]/products">) {
  const { slug } = await ctx.params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.active) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });

  const url = new URL(_req.url);
  const category = url.searchParams.get("category");

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      active: true,
      ...(category ? { categoryId: category } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  const categories = await prisma.category.findMany({ where: { storeId: store.id } });
  return NextResponse.json({ products, categories, store: { id: store.id, name: store.name, slug: store.slug, themeColor: store.themeColor, currency: store.currency } });
}