import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function isAdmin() {
  const store = await cookies();
  return store.get("bp_admin")?.value === "1";
}

const schema = z.object({
  storeId: z.string().min(1),
  action: z.enum(["activate", "stop", "trial", "set-date", "note"]),
  plan: z.enum(["monthly", "yearly"]).optional(),
  months: z.number().int().min(1).max(24).optional(),
  renewsAt: z.string().min(1).optional(),
  note: z.string().max(2000).optional(),
});

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  // Keep the same day when possible (e.g. Jan 31 -> Feb 28).
  if (next.getDate() < day) next.setDate(0);
  return next;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      plan: true,
      planStatus: true,
      planRenewsAt: true,
      subscriptionNote: true,
      createdAt: true,
      user: { select: { name: true, email: true, phone: true } },
      subscriptionRequests: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          plan: true,
          method: true,
          reference: true,
          phone: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
      _count: { select: { subscriptionRequests: { where: { status: "pending" } } } },
    },
  });

  return NextResponse.json({ stores });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { storeId, action, plan, months, renewsAt, note } = parsed.data;
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });

    const now = new Date();
    let data: {
      plan?: string;
      planStatus?: string;
      planRenewsAt?: Date | null;
      subscriptionNote?: string;
    };

    if (action === "note") {
      data = { subscriptionNote: (note || "").slice(0, 2000) };
    } else if (action === "stop") {
      data = { planStatus: "expired", planRenewsAt: now };
    } else if (action === "trial") {
      data = {
        plan: "trial",
        planStatus: "active",
        planRenewsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      };
    } else if (action === "set-date") {
      if (!renewsAt) {
        return NextResponse.json({ error: "اختار تاريخ التجديد" }, { status: 400 });
      }
      const date = renewsAt.includes("T")
        ? new Date(renewsAt)
        : new Date(`${renewsAt}T23:59:59`);
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "تاريخ غير صالح" }, { status: 400 });
      }
      data = {
        planStatus: date.getTime() > now.getTime() ? "active" : "expired",
        planRenewsAt: date,
      };
    } else {
      const selected = plan || "monthly";
      const period = months ?? (selected === "yearly" ? 12 : 1);
      const base =
        store.planRenewsAt && store.planRenewsAt.getTime() > now.getTime()
          ? store.planRenewsAt
          : now;
      data = {
        plan: period >= 12 ? "yearly" : "monthly",
        planStatus: "active",
        planRenewsAt: addMonths(base, period),
      };
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data,
      select: {
        id: true,
        name: true,
        plan: true,
        planStatus: true,
        planRenewsAt: true,
        subscriptionNote: true,
      },
    });

    if (action === "activate" || (action === "set-date" && data.planStatus === "active")) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionRequest"
        SET status = 'approved'
        WHERE "storeId" = ${storeId} AND status = 'pending'
      `.catch(() => undefined);
    }

    return NextResponse.json({ store: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
