import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bostaGetDelivery } from "@/lib/bosta";
import { bostaOrderStatus, bostaStateFromCode } from "@/lib/bosta-status";
import { applyOrderStatus } from "@/lib/order-status";

/**
 * Bosta sends a POST after every shipment state change. The body is not
 * trusted: we fetch the delivery from Bosta with the merchant's own API key and
 * apply the authoritative state.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/public/webhooks/bosta/[storeId]">
) {
  const { storeId } = await ctx.params;

  let body: Record<string, unknown> = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    body = {};
  }

  const trackingNumber = String(body.trackingNumber ?? "").trim();
  if (!trackingNumber) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, bostaApiKey: true, bostaEnabled: true },
  });
  if (!store || !store.bostaEnabled || !store.bostaApiKey) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const order = await prisma.order.findFirst({
    where: { storeId, trackingNumber },
    select: { id: true, status: true, total: true },
  });
  if (!order) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const delivery = await bostaGetDelivery(store.bostaApiKey, trackingNumber);
  if (!delivery.ok) {
    // Invalid keys or unknown shipments will never succeed — acknowledge them
    // so Bosta stops retrying. Temporary/network failures get a 502 to retry.
    if (delivery.status === 401 || delivery.status === 403 || delivery.status === 404) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const state =
    delivery.data.state.value || bostaStateFromCode(body.state as number | string);
  const stateCode = delivery.data.state.code || Number(body.state) || 0;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      carrier: "bosta",
      carrierRef: delivery.data.id || undefined,
      trackingNumber: delivery.data.trackingNumber || trackingNumber,
      carrierStatus: state,
      carrierUpdatedAt: new Date(),
    },
  });

  const mapped = bostaOrderStatus(state, order.status);
  if (mapped) {
    await applyOrderStatus({
      storeId,
      orderId: order.id,
      fromStatus: order.status,
      toStatus: mapped,
      total: order.total,
    });
  }

  return NextResponse.json({ ok: true, state, stateCode });
}
