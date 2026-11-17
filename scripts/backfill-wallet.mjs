/**
 * One-time wallet backfill.
 *
 * Historically `Store.walletBalance` was never updated. This script creates a
 * credit `WalletTransaction` for every delivered order that doesn't have one,
 * then recalculates each store balance from the full ledger. Safe to re-run.
 *
 * Usage: npm run wallet:backfill
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing. Add it to .env first.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeonHTTP(connectionString, {}),
});

const stores = await prisma.store.findMany({
  select: { id: true, name: true },
});

let createdTransactions = 0;

for (const store of stores) {
  const delivered = await prisma.order.findMany({
    where: { storeId: store.id, status: "delivered" },
    select: { id: true, total: true },
  });

  for (const order of delivered) {
    const existing = await prisma.walletTransaction.findFirst({
      where: { storeId: store.id, orderId: order.id, type: "credit" },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.walletTransaction.create({
      data: {
        storeId: store.id,
        orderId: order.id,
        type: "credit",
        amount: order.total,
        description: `مبيعات الطلب #${order.id.slice(-8).toUpperCase()}`,
      },
    });
    createdTransactions += 1;
  }

  const [credits, debits] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { storeId: store.id, type: "credit" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { storeId: store.id, type: "debit" },
      _sum: { amount: true },
    }),
  ]);

  const balance =
    Math.round(((credits._sum.amount ?? 0) - (debits._sum.amount ?? 0)) * 100) / 100;

  await prisma.$executeRaw`
    UPDATE "Store" SET "walletBalance" = ${balance} WHERE id = ${store.id}
  `;

  console.log(
    `${store.name}: ${delivered.length} delivered orders, balance ${balance}`
  );
}

console.log(`Done. Created ${createdTransactions} wallet transactions.`);
await prisma.$disconnect();
