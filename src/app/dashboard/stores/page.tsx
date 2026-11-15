import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Store } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StoreCard from "@/components/dashboard/StoreCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { primaryBtn } from "@/lib/ui";

export default async function StoresPage() {
  const session = await getSession();
  const userId = session!.userId;

  const [stores, revenue] = await Promise.all([
    prisma.store.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true, orders: true } } },
    }),
    prisma.order.groupBy({ by: ["storeId"], where: { store: { userId } }, _sum: { total: true } }),
  ]);

  const revenueByStore = new Map(revenue.map((s) => [s.storeId, s._sum.total ?? 0]));

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="إدارة المتاجر"
        title="متاجري"
        subtitle="كل متاجرك في مكان واحد — تابع المبيعات وادخل على أي متجر بضغطة."
        icon={<Store className="h-6 w-6" />}
        action={
          <Link href="/dashboard/stores/new" className={primaryBtn}>
            <Plus className="h-4 w-4" />
            متجر جديد
          </Link>
        }
      />

      {stores.length === 0 ? (
        <EmptyState
          icon={Store}
          title="لسه مفيش متاجر"
          description="ابدأ أول متجر ليك في أقل من 10 دقايق، واعرض منتجاتك واستقبل الطلبات من النهاردة."
          action={
            <Link href="/dashboard/stores/new" className={primaryBtn}>
              <Plus className="h-4 w-4" />
              اعمل متجرك الأول
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-xs font-semibold text-muted">
            عندك <span className="font-extrabold text-foreground">{stores.length}</span> متجر
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={{ ...store, revenue: revenueByStore.get(store.id) ?? 0 }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
