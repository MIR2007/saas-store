import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PLATFORM_URL } from "@/lib/domains";
import {
  bostaCreateDelivery,
  bostaGetDelivery,
  bostaTerminateDelivery,
  parseBostaConfig,
} from "@/lib/bosta";
import {
  BOSTA_MAX_COD,
  bostaOrderStatus,
  isBostaPackageType,
} from "@/lib/bosta-status";
import { applyOrderStatus } from "@/lib/order-status";
import { isValidEgyptMobile } from "@/lib/phone";
import { z } from "zod";

const createSchema = z.object({
  city: z.string().trim().min(2).max(100),
  cityId: z.string().trim().max(100).optional(),
  districtId: z.string().trim().max(100).optional(),
  districtName: z.string().trim().max(150).optional(),
  firstLine: z.string().trim().min(6).max(300),
  secondLine: z.string().trim().max(200).optional(),
  cod: z.number().nonnegative().optional(),
  packageType: z.string().trim().max(40).optional(),
  packageWeight: z.number().positive().max(100).optional(),
  notes: z.string().max(500).optional(),
});

async function loadOrder(storeId: string, orderId: string, userId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, userId } });
  if (!store) return { store: null, order: null };
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: true },
  });
  return { store, order };
}

function statusCodeFor(resultStatus: number) {
  return resultStatus >= 400 && resultStatus < 500 ? 400 : 502;
}

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/stores/[storeId]/orders/[orderId]/shipment">
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, orderId } = await ctx.params;
  const { store, order } = await loadOrder(storeId, orderId, session.userId);
  if (!store || !order) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  if (!store.bostaEnabled || !store.bostaApiKey) {
    return NextResponse.json(
      { error: "اربط حساب بوسطة من إعدادات شركات الشحن الأول." },
      { status: 400 }
    );
  }
  if (order.trackingNumber) {
    return NextResponse.json(
      { error: "الطلب ده متبعت بالفعل على بوسطة." },
      { status: 409 }
    );
  }
  if (order.status === "delivered" || order.status === "cancelled") {
    return NextResponse.json(
      { error: "الطلب مغلق، مينفعش ننشئ له شحنة جديدة." },
      { status: 400 }
    );
  }
  if (!isValidEgyptMobile(order.customerPhone)) {
    return NextResponse.json(
      { error: "رقم تليفون العميل غير صالح — لازم يكون رقم موبايل مصري." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "راجع بيانات الشحنة: المدينة والحي والعنوان مطلوبين." },
      { status: 400 }
    );
  }
  if (!parsed.data.districtId && !parsed.data.districtName) {
    return NextResponse.json({ error: "اختار الحي من قائمة بوسطة." }, { status: 400 });
  }

  const config = parseBostaConfig(store.bostaConfig);
  const packageType = isBostaPackageType(parsed.data.packageType)
    ? parsed.data.packageType
    : config.packageType;
  const packageWeight = parsed.data.packageWeight ?? config.packageWeight;
  const cod = parsed.data.cod === undefined
    ? config.codEnabled
      ? Math.round(order.total)
      : 0
    : Math.max(0, Math.round(parsed.data.cod));

  if (cod > BOSTA_MAX_COD) {
    return NextResponse.json(
      { error: `مبلغ التحصيل أكبر من ${BOSTA_MAX_COD.toLocaleString("en-US")} جنيه، وبوسطة مش بتقبل أكتر من كده.` },
      { status: 400 }
    );
  }

  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const description =
    order.items
      .map((item) => `${item.name} × ${item.quantity}`)
      .join("، ")
      .slice(0, 200) || "طلب من Bee Panal";

  const created = await bostaCreateDelivery({
    apiKey: store.bostaApiKey,
    orderId: order.id,
    webhookUrl: `${PLATFORM_URL}/api/public/webhooks/bosta/${store.id}`,
    receiverName: order.customerName,
    receiverPhone: order.customerPhone,
    city: parsed.data.city,
    cityId: parsed.data.cityId,
    districtId: parsed.data.districtId,
    districtName: parsed.data.districtName,
    firstLine: parsed.data.firstLine,
    secondLine: parsed.data.secondLine,
    cod,
    packageType,
    packageWeight,
    itemsCount: Math.max(1, itemsCount),
    description,
    notes: parsed.data.notes || order.notes || config.defaultNotes,
    pickupLocationId: config.pickupLocationId,
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: statusCodeFor(created.status) });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      carrier: "bosta",
      carrierRef: created.data.id,
      trackingNumber: created.data.trackingNumber,
      carrierStatus: created.data.state.value,
      carrierUpdatedAt: new Date(),
    },
  });

  const mapped = bostaOrderStatus(created.data.state.value, order.status);
  if (mapped) {
    await applyOrderStatus({
      storeId,
      orderId: order.id,
      fromStatus: order.status,
      toStatus: mapped,
      total: order.total,
    });
  }

  return NextResponse.json({
    ok: true,
    trackingNumber: created.data.trackingNumber,
    state: created.data.state.value,
    stateCode: created.data.state.code,
  });
}

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/stores/[storeId]/orders/[orderId]/shipment">
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, orderId } = await ctx.params;
  const { store, order } = await loadOrder(storeId, orderId, session.userId);
  if (!store || !order) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!store.bostaApiKey || !order.trackingNumber) {
    return NextResponse.json({ error: "مفيش شحنة بوسطة مرتبطة بالطلب ده." }, { status: 404 });
  }

  const delivery = await bostaGetDelivery(store.bostaApiKey, order.trackingNumber);
  if (!delivery.ok) {
    return NextResponse.json({ error: delivery.error }, { status: statusCodeFor(delivery.status) });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      carrierRef: delivery.data.id || order.carrierRef,
      trackingNumber: delivery.data.trackingNumber || order.trackingNumber,
      carrierStatus: delivery.data.state.value,
      carrierUpdatedAt: new Date(),
    },
  });

  const mapped = bostaOrderStatus(delivery.data.state.value, order.status);
  if (mapped) {
    await applyOrderStatus({
      storeId,
      orderId: order.id,
      fromStatus: order.status,
      toStatus: mapped,
      total: order.total,
    });
  }

  return NextResponse.json({
    ok: true,
    trackingNumber: delivery.data.trackingNumber,
    state: delivery.data.state.value,
    stateCode: delivery.data.state.code,
    orderStatus: mapped || order.status,
  });
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/stores/[storeId]/orders/[orderId]/shipment">
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId, orderId } = await ctx.params;
  const { store, order } = await loadOrder(storeId, orderId, session.userId);
  if (!store || !order) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!store.bostaApiKey || !order.carrierRef) {
    return NextResponse.json({ error: "مفيش شحنة بوسطة مرتبطة بالطلب ده." }, { status: 404 });
  }
  if (order.status === "delivered") {
    return NextResponse.json(
      { error: "الطلب اتسلم بالفعل ومينفعش تلغي الشحنة." },
      { status: 400 }
    );
  }

  const terminated = await bostaTerminateDelivery(store.bostaApiKey, order.carrierRef);
  if (!terminated.ok) {
    return NextResponse.json(
      { error: terminated.error },
      { status: statusCodeFor(terminated.status) }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      carrier: "",
      carrierRef: "",
      trackingNumber: "",
      carrierStatus: "",
      carrierUpdatedAt: new Date(),
    },
  });

  if (order.status === "shipped") {
    await applyOrderStatus({
      storeId,
      orderId: order.id,
      fromStatus: "shipped",
      toStatus: "confirmed",
      total: order.total,
    });
  }

  return NextResponse.json({ ok: true });
}
