import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const schema = z.object({
  storeSlug: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

    const { storeSlug, customerName, customerPhone, customerAddress, notes, items } = parsed.data;

    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (!store || !store.active) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });

    // Load products
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id, active: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) return NextResponse.json({ error: "منتج غير موجود" }, { status: 400 });
      if (p.stock < item.quantity) {
        return NextResponse.json({ error: `المخزون غير كافٍ: ${p.name}` }, { status: 400 });
      }
    }

    // Compute total
    let total = 0;
    const orderItems = items.map((item) => {
      const p = productMap.get(item.productId)!;
      total += p.price * item.quantity;
      return { productId: p.id, name: p.name, price: p.price, quantity: item.quantity };
    });

    // Create order + decrement stock in transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          storeId: store.id,
          customerName,
          customerPhone,
          customerAddress: customerAddress || "",
          notes: notes || "",
          total,
          items: { create: orderItems },
        },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return created;
    });

    return NextResponse.json({ order: { id: order.id, total: order.total } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}