import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
});

async function ownsStore(storeId: string, userId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId } });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/categories">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/categories">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    const cat = await prisma.category.create({
      data: { storeId, name: parsed.data.name, slug: slugify(parsed.data.name) || "category" },
    });
    return NextResponse.json({ category: cat });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/stores/[storeId]/categories">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!id || !name) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

    const category = await prisma.category.findFirst({ where: { id, storeId } });
    if (!category) return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug: slugify(name) || "category" },
    });
    return NextResponse.json({ category: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/stores/[storeId]/categories">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرف القسم مطلوب" }, { status: 400 });

  const category = await prisma.category.findFirst({ where: { id, storeId } });
  if (!category) return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}