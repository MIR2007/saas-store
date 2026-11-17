import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"]),
  method: z.enum(["instapay", "vodafone"]),
  reference: z.string().min(3).max(120),
  phone: z.string().max(30).optional(),
});

async function ownsStore(storeId: string, userId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId } });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/subscription">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const requests = await prisma.subscriptionRequest.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json({
    plan: store.plan,
    planStatus: store.planStatus,
    planRenewsAt: store.planRenewsAt,
    requests,
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/subscription">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const { plan, method, reference, phone } = parsed.data;

    const pending = await prisma.subscriptionRequest.findFirst({
      where: { storeId, status: "pending" },
      select: { id: true },
    });
    if (pending) {
      return NextResponse.json(
        { error: "عندك طلب اشتراك مستني المراجعة. تواصل مع الدعم لو محتاج تعدّله." },
        { status: 409 }
      );
    }

    const request = await prisma.subscriptionRequest.create({
      data: {
        storeId,
        plan,
        method,
        reference,
        phone: phone || store.phone || "",
        amount: SUBSCRIPTION_PLANS[plan].amount,
        status: "pending",
      },
    });

    return NextResponse.json({ request });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
