import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/api/public/stores/[slug]">) {
  const { slug } = await ctx.params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, logo: true, themeColor: true, currency: true, active: true },
  });
  if (!store || !store.active) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
  return NextResponse.json({ store });
}