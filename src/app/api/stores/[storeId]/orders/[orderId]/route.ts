import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

async function ownsOrder(storeId: string, orderId: string, userId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, userId } });
  if (!store) return null;
  return prisma.order.findFirst({ where: { id: orderId, storeId }, include: { items: true } });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/orders/[orderId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, orderId } = await ctx.params;
  const order = await ownsOrder(storeId, orderId, session.userId);
  if (!order) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/stores/[storeId]/orders/[orderId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, orderId } = await ctx.params;
  const order = await ownsOrder(storeId, orderId, session.userId);
  if (!order) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    const updated = await prisma.order.update({ where: { id: orderId }, data: { status: parsed.data.status } });
    return NextResponse.json({ order: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}