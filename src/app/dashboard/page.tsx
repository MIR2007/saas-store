import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardHome() {
  const session = await getSession();
  const stores = await prisma.store.findMany({
    where: { userId: session!.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true, orders: true } } },
  });

  const totalProducts = stores.reduce((s, x) => s + x._count.products, 0);
  const totalOrders = stores.reduce((s, x) => s + x._count.orders, 0);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">نظرة عامة</h1>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="text-sm text-muted">المتاجر</div>
          <div className="text-3xl font-bold text-foreground mt-2">{stores.length}</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="text-sm text-muted">المنتجات</div>
          <div className="text-3xl font-bold text-foreground mt-2">{totalProducts}</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="text-sm text-muted">الطلبات</div>
          <div className="text-3xl font-bold text-foreground mt-2">{totalOrders}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">متاجري</h2>
        <Link href="/dashboard/stores/new" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition">
          + متجر جديد
        </Link>
      </div>

      {stores.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-muted mb-4">لا توجد متاجر بعد. أنشئ متجرك الأول!</p>
          <Link href="/dashboard/stores/new" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition">
            إنشاء متجر
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Link key={store.id} href={`/dashboard/stores/${store.id}`} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold" style={{ backgroundColor: store.themeColor }}>
                  {store.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-foreground truncate">{store.name}</div>
                  <div className="text-xs text-muted truncate">/{store.slug}</div>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-muted">
                <span>{store._count.products} منتج</span>
                <span>{store._count.orders} طلب</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}