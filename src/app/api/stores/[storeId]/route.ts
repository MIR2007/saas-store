import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseThemeConfig } from "@/lib/themes";
import { z } from "zod";

async function ownsStore(storeId: string, userId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, userId } });
  return store;
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  themeColor: z.string().optional(),
  theme: z.string().optional(),
  currency: z.string().optional(),
  active: z.boolean().optional(),
  logo: z.string().optional(),
  phone: z.string().max(30).optional(),
  freeShippingThreshold: z.number().nonnegative().optional(),
  shippingRates: z.record(z.string().max(60), z.number().nonnegative()).optional(),
  themeConfig: z.record(z.string(), z.any()).optional(),
});

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ store });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/stores/[storeId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

    const { shippingRates, themeConfig, ...storeData } = parsed.data;
    const data: Record<string, unknown> = { ...storeData };
    if (shippingRates) {
      const serialized = JSON.stringify(shippingRates);
      if (serialized.length > 12000) {
        return NextResponse.json({ error: "بيانات الشحن كبيرة جدًا" }, { status: 400 });
      }
      data.shippingRates = serialized;
    }
    if (themeConfig) {
      const serialized = JSON.stringify(parseThemeConfig(JSON.stringify(themeConfig)));
      if (serialized.length > 24000) {
        return NextResponse.json({ error: "إعدادات التصميم كبيرة جدًا" }, { status: 400 });
      }
      data.themeConfig = serialized;
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: data as never,
    });
    return NextResponse.json({ store: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/stores/[storeId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  await prisma.store.delete({ where: { id: storeId } });
  return NextResponse.json({ ok: true });
}