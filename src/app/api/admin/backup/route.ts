import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const store = await cookies();
  return store.get("bp_admin")?.value === "1";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const [users, stores, categories, products, orders, subscriptionRequests, coupons, walletTransactions] =
    await Promise.all([
      prisma.user.findMany({
        select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
      }),
      prisma.store.findMany(),
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.order.findMany({ include: { items: true } }),
      prisma.subscriptionRequest.findMany(),
      prisma.coupon.findMany(),
      prisma.walletTransaction.findMany(),
    ]);

  const payload = {
    platform: "Bee Panal",
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      stores: stores.length,
      categories: categories.length,
      products: products.length,
      orders: orders.length,
      subscriptionRequests: subscriptionRequests.length,
      coupons: coupons.length,
      walletTransactions: walletTransactions.length,
    },
    users,
    stores,
    categories,
    products,
    orders,
    subscriptionRequests,
    coupons,
    walletTransactions,
  };

  const filename = `beepanal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
