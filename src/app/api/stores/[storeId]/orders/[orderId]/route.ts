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

    const nextStatus = parsed.data.status;
    if (nextStatus === order.status) {
      return NextResponse.json({ order });
    }

    // Conditional update so two concurrent requests can't credit the wallet twice.
    const changed = await prisma.$executeRaw`
      UPDATE "Order"
      SET status = ${nextStatus}
      WHERE id = ${orderId} AND "storeId" = ${storeId} AND status = ${order.status}
    `;
    if (changed === 0) {
      const current = await prisma.order.findFirst({
        where: { id: orderId, storeId },
        include: { items: { include: { product: { select: { images: true } } } } },
      });
      return NextResponse.json({ order: current });
    }

    const shortId = orderId.slice(-8).toUpperCase();
    const credit = order.status !== "delivered" && nextStatus === "delivered";
    const debit = order.status === "delivered" && nextStatus !== "delivered";

    if (credit || debit) {
      const amount = order.total;
      const delta = credit ? amount : -amount;
      const type = credit ? "credit" : "debit";
      const description = credit
        ? `مبيعات الطلب #${shortId}`
        : `إلغاء تسليم الطلب #${shortId}`;

      await prisma.$executeRaw`
        UPDATE "Store"
        SET "walletBalance" = "walletBalance" + ${delta}
        WHERE id = ${storeId}
      `;

      try {
        await prisma.walletTransaction.create({
          data: { storeId, orderId, type, amount, description },
        });
      } catch (error) {
        // Put the balance back and restore the previous order status.
        await prisma.$executeRaw`
          UPDATE "Store"
          SET "walletBalance" = "walletBalance" - ${delta}
          WHERE id = ${storeId}
        `.catch(() => undefined);
        await prisma.$executeRaw`
          UPDATE "Order" SET status = ${order.status}
          WHERE id = ${orderId} AND "storeId" = ${storeId}
        `.catch(() => undefined);
        throw error;
      }
    }

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
