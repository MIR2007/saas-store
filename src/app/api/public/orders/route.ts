import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  variant: z.string().max(200).optional(),
});

const schema = z.object({
  storeSlug: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerCountry: z.string().max(60).optional(),
  customerRegion: z.string().max(60).optional(),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

    const {
      storeSlug,
      customerName,
      customerPhone,
      customerCountry,
      customerRegion,
      customerAddress,
      notes,
      items,
    } = parsed.data;

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
    let subtotal = 0;
    let shipping = 0;
    const orderItems = items.map((item) => {
      const p = productMap.get(item.productId)!;
      subtotal += p.price * item.quantity;
      shipping += (p.shippingPrice || 0) * item.quantity;
      const name = item.variant ? `${p.name} (${item.variant})` : p.name;
      return { productId: p.id, name, price: p.price, quantity: item.quantity };
    });
    const total = subtotal + shipping;

    // Create the order first, then its items and stock updates. Neon's HTTP
    // driver does not support interactive transactions (nested writes included),
    // so we compensate manually if a later step fails.
    const orderId = crypto.randomUUID();
    const order = await prisma.order.create({
      data: {
        id: orderId,
        storeId: store.id,
        customerName,
        customerPhone,
        customerCountry: customerCountry || "مصر",
        customerRegion: customerRegion || "",
        customerAddress: customerAddress || "",
        notes: notes || "",
        shipping,
        total,
      },
    });

    try {
      for (const item of orderItems) {
        await prisma.orderItem.create({ data: { orderId, ...item } });
      }
    } catch (error) {
      await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined);
      throw error;
    }

    const decremented: typeof items = [];
    try {
      for (const item of items) {
        const affected = await prisma.$executeRaw`
          UPDATE "Product"
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.productId}
            AND "storeId" = ${store.id}
            AND active = true
            AND stock >= ${item.quantity}
        `;
        if (affected === 0) {
          throw new Error("OUT_OF_STOCK");
        }
        decremented.push(item);
      }
    } catch {
      // Roll back the stock changes that already succeeded and remove the order.
      await Promise.all(
        decremented.map((item) =>
          prisma
            .$executeRaw`UPDATE "Product" SET stock = stock + ${item.quantity} WHERE id = ${item.productId}`
            .catch(() => undefined)
        )
      );
      await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined);
      return NextResponse.json(
        { error: "المخزون غير كافٍ، حدّث السلة وجرّب تاني." },
        { status: 409 }
      );
    }

    return NextResponse.json({ order: { id: order.id, total: order.total } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}