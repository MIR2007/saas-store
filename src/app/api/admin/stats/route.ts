import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const store = await cookies();
  if (store.get("bp_admin")?.value !== "1") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const [users, stores, products, orders, recentUsers, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { store: { select: { name: true, slug: true, currency: true } } } }),
  ]);

  const revenue = await prisma.order.aggregate({ _sum: { total: true } });

  return NextResponse.json({
    stats: { users, stores, products, orders, revenue: revenue._sum.total || 0 },
    recentUsers,
    recentOrders,
  });
}