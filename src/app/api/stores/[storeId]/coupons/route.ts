import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizeCouponCode } from "@/lib/coupons";
import { z } from "zod";

async function ownsStore(storeId: string, userId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId }, select: { id: true } });
}

const createSchema = z.object({
  code: z.string().min(2).max(40),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minSubtotal: z.number().nonnegative().optional(),
  maxUses: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().optional().nullable(),
});

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/coupons">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  if (!(await ownsStore(storeId, session.userId))) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const coupons = await prisma.coupon.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ coupons });
}

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/coupons">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  if (!(await ownsStore(storeId, session.userId))) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات الكوبون غير صالحة" }, { status: 400 });
    }

    const code = normalizeCouponCode(parsed.data.code);
    if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
      return NextResponse.json(
        { error: "الكود يسمح بالحروف الإنجليزية والأرقام والشرطة فقط" },
        { status: 400 }
      );
    }
    if (parsed.data.type === "percent" && parsed.data.value > 100) {
      return NextResponse.json({ error: "نسبة الخصم لا تزيد عن 100%" }, { status: 400 });
    }

    const existing = await prisma.coupon.findFirst({
      where: { storeId, code },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "الكود مستخدم بالفعل في المتجر" }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        storeId,
        code,
        type: parsed.data.type,
        value: parsed.data.value,
        minSubtotal: parsed.data.minSubtotal ?? 0,
        maxUses: parsed.data.maxUses ?? 0,
        active: parsed.data.active ?? true,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
