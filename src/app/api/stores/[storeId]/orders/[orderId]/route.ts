import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { applyOrderStatus, ORDER_STATUS_VALUES } from "@/lib/order-status";
import { z } from "zod";

const schema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
});

async function ownsOrder(storeId: string, orderId: string, userId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, userId } });
  if (!store) return null;
  return prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: { include: { product: { select: { images: true } } } } },
  });
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

    await applyOrderStatus({
      storeId,
      orderId,
      fromStatus: order.status,
      toStatus: parsed.data.status,
      total: order.total,
    });

    const updated = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { items: { include: { product: { select: { images: true } } } } },
    });
    return NextResponse.json({ order: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
