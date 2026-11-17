import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: RouteContext<"/api/public/stores/[slug]/view">) {
  const { slug } = await ctx.params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, active: true },
  });
  if (!store || !store.active) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  await prisma.store.update({
    where: { id: store.id },
    data: { views: { increment: 1 } },
  });
  return NextResponse.json({ ok: true });
}
