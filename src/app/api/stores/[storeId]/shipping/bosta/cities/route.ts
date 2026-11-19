import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { bostaListCities } from "@/lib/bosta";

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/shipping/bosta/cities">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session.userId },
    select: { bostaApiKey: true, bostaEnabled: true },
  });
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!store.bostaEnabled || !store.bostaApiKey) {
    return NextResponse.json({ error: "اربط حساب بوسطة الأول." }, { status: 400 });
  }

  const result = await bostaListCities(store.bostaApiKey);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ cities: result.data });
}
