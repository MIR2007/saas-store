import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

async function ownsCoupon(storeId: string, couponId: string, userId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId },
    select: { id: true },
  });
  if (!store) return null;
  return prisma.coupon.findFirst({ where: { id: couponId, storeId } });
}

const updateSchema = z.object({
  active: z.boolean().optional(),
  value: z.number().positive().optional(),
  minSubtotal: z.number().nonnegative().optional(),
  maxUses: z.number().int().nonnegative().optional(),
  expiresAt: z.string().nullable().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/stores/[storeId]/coupons/[couponId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, couponId } = await ctx.params;
  const coupon = await ownsCoupon(storeId, couponId, session.userId);
  if (!coupon) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
        ...(parsed.data.value !== undefined ? { value: parsed.data.value } : {}),
        ...(parsed.data.minSubtotal !== undefined ? { minSubtotal: parsed.data.minSubtotal } : {}),
        ...(parsed.data.maxUses !== undefined ? { maxUses: parsed.data.maxUses } : {}),
        ...(parsed.data.expiresAt !== undefined
          ? { expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null }
          : {}),
      },
    });

    return NextResponse.json({ coupon: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/coupons/[couponId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, couponId } = await ctx.params;
  const coupon = await ownsCoupon(storeId, couponId, session.userId);
  if (!coupon) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await prisma.coupon.delete({ where: { id: couponId } });
  return NextResponse.json({ ok: true });
}
