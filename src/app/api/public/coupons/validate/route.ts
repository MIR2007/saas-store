import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCouponCode, validateCoupon } from "@/lib/coupons";
import { storeIsLive } from "@/lib/store-status";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  storeSlug: z.string().min(1),
  code: z.string().min(1).max(40),
  subtotal: z.number().nonnegative(),
});

export async function POST(req: Request) {
  const limit = await rateLimit("coupon-validate", clientIp(req), 30, 600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { slug: parsed.data.storeSlug },
      select: { id: true, active: true, planStatus: true, planRenewsAt: true },
    });
    if (!store || !storeIsLive(store)) {
      return NextResponse.json({ error: "المتجر غير متاح حاليًا" }, { status: 404 });
    }

    const code = normalizeCouponCode(parsed.data.code);
    const coupon = await prisma.coupon.findFirst({
      where: { storeId: store.id, code },
    });
    const result = validateCoupon(coupon, parsed.data.subtotal);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code,
      type: coupon!.type,
      value: coupon!.value,
      discount: result.discount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
