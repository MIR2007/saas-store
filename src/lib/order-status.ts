import { prisma } from "./prisma";

export const ORDER_STATUS_VALUES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

/**
 * Moves one order to a new status and keeps the merchant wallet in sync.
 * The conditional UPDATE makes concurrent requests safe: only the request
 * that actually changed the row is allowed to credit/debit the wallet.
 */
export async function applyOrderStatus({
  storeId,
  orderId,
  fromStatus,
  toStatus,
  total,
}: {
  storeId: string;
  orderId: string;
  fromStatus: string;
  toStatus: OrderStatusValue;
  total: number;
}) {
  if (fromStatus === toStatus) return { changed: false };

  const changed = await prisma.$executeRaw`
    UPDATE "Order"
    SET status = ${toStatus}
    WHERE id = ${orderId} AND "storeId" = ${storeId} AND status = ${fromStatus}
  `;
  if (changed === 0) return { changed: false };

  const shortId = orderId.slice(-8).toUpperCase();
  const credit = fromStatus !== "delivered" && toStatus === "delivered";
  const debit = fromStatus === "delivered" && toStatus !== "delivered";
  if (!credit && !debit) return { changed: true };

  const amount = total;
  const delta = credit ? amount : -amount;
  const type = credit ? "credit" : "debit";
  const description = credit
    ? `مبيعات الطلب #${shortId}`
    : `إلغاء تسليم الطلب #${shortId}`;

  await prisma.$executeRaw`
    UPDATE "Store"
    SET "walletBalance" = "walletBalance" + ${delta}
    WHERE id = ${storeId}
  `;

  try {
    await prisma.walletTransaction.create({
      data: { storeId, orderId, type, amount, description },
    });
  } catch (error) {
    // Put the balance back and restore the previous order status.
    await prisma.$executeRaw`
      UPDATE "Store"
      SET "walletBalance" = "walletBalance" - ${delta}
      WHERE id = ${storeId}
    `.catch(() => undefined);
    await prisma.$executeRaw`
      UPDATE "Order" SET status = ${fromStatus}
      WHERE id = ${orderId} AND "storeId" = ${storeId}
    `.catch(() => undefined);
    throw error;
  }

  return { changed: true };
}
