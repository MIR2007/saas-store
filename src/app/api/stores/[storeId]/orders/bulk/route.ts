import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { applyOrderStatus, ORDER_STATUS_VALUES } from "@/lib/order-status";
import { z } from "zod";

const schema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(ORDER_STATUS_VALUES),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/stores/[storeId]/orders/bulk">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { storeId } = await ctx.params;
  const store = await prisma.store.findFirst({ where: { id: storeId, userId: session.userId } });
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { orderIds, status } = parsed.data;
    const orders = await prisma.order.findMany({
      where: { storeId, id: { in: orderIds } },
      select: { id: true, status: true, total: true },
    });

    let updated = 0;
    let skipped = 0;
    const failed: string[] = [];

    // Sequential on purpose: the HTTP driver has no transactions, and each
    // order needs its own wallet movement with a compensating rollback.
    for (const order of orders) {
      if (order.status === status) {
        skipped += 1;
        continue;
      }
      try {
        const result = await applyOrderStatus({
          storeId,
          orderId: order.id,
          fromStatus: order.status,
          toStatus: status,
          total: order.total,
        });
        if (result.changed) updated += 1;
        else skipped += 1;
      } catch (error) {
        console.error(error);
        failed.push(order.id);
      }
    }

    const missing = orderIds.length - orders.length;
    return NextResponse.json({
      updated,
      skipped: skipped + missing,
      failed,
      requested: orderIds.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
