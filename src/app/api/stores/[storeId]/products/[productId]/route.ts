import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  comparePrice: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  options: z.string().optional(),
  shippingPrice: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

async function ownsProduct(storeId: string, productId: string, userId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, userId } });
  if (!store) return null;
  return prisma.product.findFirst({ where: { id: productId, storeId } });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/products/[productId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, productId } = await ctx.params;
  const product = await ownsProduct(storeId, productId, session.userId);
  if (!product) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/stores/[storeId]/products/[productId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, productId } = await ctx.params;
  const product = await ownsProduct(storeId, productId, session.userId);
  if (!product) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    const data = parsed.data;
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...("name" in data ? { name: data.name! } : {}),
        ...("description" in data ? { description: data.description || "" } : {}),
        ...("price" in data ? { price: data.price! } : {}),
        ...("comparePrice" in data ? { comparePrice: data.comparePrice } : {}),
        ...("stock" in data ? { stock: data.stock! } : {}),
        ...("categoryId" in data ? { categoryId: data.categoryId } : {}),
        ...("active" in data ? { active: data.active! } : {}),
        ...("images" in data ? { images: JSON.stringify(data.images || []) } : {}),
        ...("options" in data ? { options: data.options || "[]" } : {}),
        ...("shippingPrice" in data ? { shippingPrice: data.shippingPrice ?? 0 } : {}),
      },
    });
    return NextResponse.json({ product: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/products/[productId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, productId } = await ctx.params;
  const product = await ownsProduct(storeId, productId, session.userId);
  if (!product) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  await prisma.product.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}