import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCouponCode, validateCoupon } from "@/lib/coupons";
import { storeIsLive } from "@/lib/store-status";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
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
  couponCode: z.string().max(40).optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const limit = await rateLimit("create-order", clientIp(req), 20, 600);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

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
      couponCode,
      items,
    } = parsed.data;

    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (!store || !storeIsLive(store)) {
      return NextResponse.json({ error: "المتجر غير متاح حاليًا" }, { status: 404 });
    }

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

    // Compute subtotal and shipping (store-level free shipping threshold).
    let subtotal = 0;
    let shipping = 0;
    const orderItems = items.map((item) => {
      const p = productMap.get(item.productId)!;
      subtotal += p.price * item.quantity;
      shipping += (p.shippingPrice || 0) * item.quantity;
      const name = item.variant ? `${p.name} (${item.variant})` : p.name;
      return { productId: p.id, name, price: p.price, quantity: item.quantity };
    });
    subtotal = Math.round(subtotal * 100) / 100;

    if (store.freeShippingThreshold > 0 && subtotal >= store.freeShippingThreshold) {
      shipping = 0;
    }
    shipping = Math.round(shipping * 100) / 100;

    // Validate coupon (the client-side preview is re-checked here).
    let coupon: Awaited<ReturnType<typeof prisma.coupon.findFirst>> = null;
    let discount = 0;
    const normalizedCode = couponCode ? normalizeCouponCode(couponCode) : "";
    if (normalizedCode) {
      coupon = await prisma.coupon.findFirst({
        where: { storeId: store.id, code: normalizedCode },
      });
      const result = validateCoupon(coupon, subtotal);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      discount = result.discount;
    }

    const total = Math.round((subtotal + shipping - discount) * 100) / 100;

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
        subtotal,
        discount,
        couponCode: normalizedCode,
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

    // Claim a coupon use atomically. If another order took the last use while
    // this one was being created, roll everything back.
    if (coupon && discount > 0) {
      const claimed = await prisma.$executeRaw`
        UPDATE "Coupon"
        SET "usedCount" = "usedCount" + 1
        WHERE id = ${coupon.id}
          AND active = true
          AND ("maxUses" = 0 OR "usedCount" < "maxUses")
          AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
      `;
      if (claimed === 0) {
        await Promise.all(
          decremented.map((item) =>
            prisma
              .$executeRaw`UPDATE "Product" SET stock = stock + ${item.quantity} WHERE id = ${item.productId}`
              .catch(() => undefined)
          )
        );
        await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined);
        return NextResponse.json(
          { error: "كود الخصم لم يعد متاحًا. جرّب من غير الكود." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({
      order: { id: order.id, subtotal, discount, shipping, total },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
