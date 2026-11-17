import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  Clock,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StoreCard from "@/components/dashboard/StoreCard";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { VERSION } from "@/lib/version";
import { primaryBtn, secondaryBtn } from "@/lib/ui";

export default async function DashboardHome() {
  const session = await getSession();
  const userId = session!.userId;

  // التاجر بيدخل على متجره مباشرة بدل صفحة المنصة.
  if (session!.role === "MERCHANT") {
    const firstStore = await prisma.store.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (firstStore) redirect(`/dashboard/stores/${firstStore.id}`);
  }

  const [stores, revenueAgg, pendingCount, storeRevenue, recentOrders] = await Promise.all([
    prisma.store.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true, orders: true } } },
    }),
    prisma.order.aggregate({ where: { store: { userId } }, _sum: { total: true } }),
    prisma.order.count({ where: { store: { userId }, status: "pending" } }),
    prisma.order.groupBy({ by: ["storeId"], where: { store: { userId } }, _sum: { total: true } }),
    prisma.order.findMany({
      where: { store: { userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { store: { select: { name: true, id: true, currency: true } } },
    }),
  ]);

  const revenueByStore = new Map(storeRevenue.map((s) => [s.storeId, s._sum.total ?? 0]));
  const totalProducts = stores.reduce((s, x) => s + x._count.products, 0);
  const totalOrders = stores.reduce((s, x) => s + x._count.orders, 0);
  const revenue = revenueAgg._sum.total ?? 0;
  const firstName = (session!.name || "صاحبي").split(" ")[0];

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        title={`أهلاً بيك يا ${firstName} 👋`}
        subtitle="ده ملخص كل متاجرك النهاردة — كل حاجة تحت إيدك."
        action={
          <Link href="/dashboard/stores/new" className={primaryBtn}>
            <Plus className="h-4 w-4" />
            متجر جديد
          </Link>
        }
      />

      {/* Welcome banner */}
      <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 text-white shadow-xl shadow-amber-500/20 sm:p-8">
        <div className="absolute -end-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-24 start-1/4 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Bee Panal v{VERSION}
            </span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
              {pendingCount > 0
                ? `عندك ${formatNumber(pendingCount)} طلب مستني التأكيد`
                : "شغلك ماشي تمام النهاردة"}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/85">
              {pendingCount > 0
                ? "ادخل على الطلبات، أكّد الطلب، وخلّي العميل يعرف إنك بدأت تجهّزه."
                : "تابع مبيعاتك، ضيف منتجات جديدة، وخلي متجرك دايمًا محدّث."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/stores"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-amber-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              إدارة المتاجر
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/stores/new"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              اعمل متجر
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-9 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard icon={Store} label="المتاجر" value={formatNumber(stores.length)} hint="متجر على المنصة" tone="amber" />
        <StatCard icon={Package} label="المنتجات" value={formatNumber(totalProducts)} hint="منتج مرفوع" tone="sky" />
        <StatCard icon={ShoppingBag} label="الطلبات" value={formatNumber(totalOrders)} hint={`${formatNumber(pendingCount)} مستني التأكيد`} tone="violet" />
        <StatCard icon={Wallet} label="إجمالي المبيعات" value={formatMoney(revenue, "EGP")} hint="من كل المتاجر" tone="emerald" />
      </div>

      {/* Stores */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-extrabold text-foreground">متاجرك</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {formatNumber(stores.length)}
          </span>
        </div>
        {stores.length > 0 && (
          <Link href="/dashboard/stores" className="text-xs font-bold text-primary hover:underline">
            عرض الكل
          </Link>
        )}
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={Store}
          title="لسه مفيش متاجر"
          description="اعمل أول متجر ليك في أقل من 10 دقايق، وابدأ تبيع أونلاين من النهاردة."
          action={
            <Link href="/dashboard/stores/new" className={primaryBtn}>
              <Plus className="h-4 w-4" />
              اعمل متجرك الأول
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={{ ...store, revenue: revenueByStore.get(store.id) ?? 0 }}
            />
          ))}
        </div>
      )}

      {/* Recent orders */}
      <div className="mt-9">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">آخر الطلبات</h2>
          </div>
          {recentOrders.length > 0 && (
            <Link
              href={stores.length === 1 ? `/dashboard/stores/${stores[0].id}/orders` : "/dashboard/stores"}
              className="text-xs font-bold text-primary hover:underline"
            >
              كل الطلبات
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
            لسه مفيش طلبات. أول ما حد يشتري من متجرك هتلاقي الطلب هنا.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-surface/80 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 text-start font-bold">العميل</th>
                    <th className="px-5 py-3 text-start font-bold">المتجر</th>
                    <th className="px-5 py-3 text-start font-bold">المبلغ</th>
                    <th className="px-5 py-3 text-start font-bold">الحالة</th>
                    <th className="px-5 py-3 text-start font-bold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-surface/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">
                            {order.customerName.charAt(0)}
                          </span>
                          <div>
                            <div className="font-semibold text-foreground">{order.customerName}</div>
                            <div className="text-[10px] text-muted">{order.customerPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{order.store.name}</td>
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        {formatMoney(order.total, order.store.currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
