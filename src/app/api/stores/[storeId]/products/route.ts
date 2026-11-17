import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  comparePrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  options: z.string().optional(),
  shippingPrice: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

async function ownsStore(storeId: string, userId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId } });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/products">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const products = await prisma.product.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/products">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    const data = parsed.data;
    const product = await prisma.product.create({
      data: {
        storeId,
        name: data.name,
        description: data.description || "",
        price: data.price,
        comparePrice: data.comparePrice,
        stock: data.stock ?? 0,
        categoryId: data.categoryId || null,
        images: JSON.stringify(data.images || []),
        options: data.options || "[]",
        shippingPrice: data.shippingPrice ?? 0,
        active: data.active ?? true,
      },
    });
    return NextResponse.json({ product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}