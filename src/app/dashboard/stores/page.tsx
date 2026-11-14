import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StoresPage() {
  const session = await getSession();
  const stores = await prisma.store.findMany({
    where: { userId: session!.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true, orders: true } } },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">متاجري</h1>
        <Link href="/dashboard/stores/new" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition">
          + متجر جديد
        </Link>
      </div>

      {stores.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-muted mb-4">لا توجد متاجر بعد.</p>
          <Link href="/dashboard/stores/new" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition">
            إنشاء متجر
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold" style={{ backgroundColor: store.themeColor }}>
                  {store.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-foreground truncate">{store.name}</div>
                  <div className="text-xs text-muted truncate">/{store.slug}</div>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-muted mb-4">
                <span>{store._count.products} منتج</span>
                <span>{store._count.orders} طلب</span>
              </div>
              <Link href={`/dashboard/stores/${store.id}`} className="text-sm text-primary font-medium hover:underline">
                إدارة المتجر ←
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}