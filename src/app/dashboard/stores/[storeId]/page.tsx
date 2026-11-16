import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Clock,
  FolderTree,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { primaryBtn, secondaryBtn, cardClass } from "@/lib/ui";
import { storePublicUrl } from "@/lib/domains";

export default async function StoreDetailPage(props: PageProps<"/dashboard/stores/[storeId]">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session!.userId },
    include: { _count: { select: { products: true, orders: true, categories: true } } },
  });
  if (!store) notFound();

  const [recentOrders, revenueAgg] = await Promise.all([
    prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: true },
    }),
    prisma.order.aggregate({ where: { storeId }, _sum: { total: true } }),
  ]);

  const revenue = revenueAgg._sum.total ?? 0;

  const quickLinks = [
    {
      href: `/dashboard/stores/${store.id}/products`,
      icon: Package,
      label: "المنتجات",
      desc: "ضيف وعدّل منتجاتك",
      count: formatNumber(store._count.products),
    },
    {
      href: `/dashboard/stores/${store.id}/orders`,
      icon: ShoppingBag,
      label: "الطلبات",
      desc: "تابع طلبات عملائك",
      count: formatNumber(store._count.orders),
    },
    {
      href: `/dashboard/stores/${store.id}/settings`,
      icon: Settings,
      label: "الإعدادات",
      desc: "الاسم والعملة والثيم",
      count: `${store._count.categories} تصنيف`,
    },
  ];

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref="/dashboard/stores"
        backLabel="كل المتاجر"
        eyebrow="لوحة المتجر"
        title={store.name}
        subtitle={`${store.slug}.beepanal.store`}
        icon={<Store className="h-6 w-6" />}
        action={
          <>
            <Link href={`/dashboard/stores/${store.id}/settings`} className={secondaryBtn}>
              <Settings className="h-4 w-4" />
              الإعدادات
            </Link>
            <a href={storePublicUrl(store.slug, store.customDomain)} target="_blank" rel="noreferrer" className={primaryBtn}>
              عرض المتجر
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </>
        }
      />

      {/* Store banner */}
      <div
        className="relative mb-7 overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-7"
        style={{
          background: `linear-gradient(135deg, ${store.themeColor}, ${store.themeColor}b3)`,
          boxShadow: `0 24px 60px -28px ${store.themeColor}aa`,
        }}
      >
        <div className="absolute -end-14 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-20 start-1/4 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-extrabold backdrop-blur-md">
              {store.name.charAt(0)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold sm:text-2xl">{store.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                    store.active
                      ? "bg-emerald-400/20 text-emerald-50 ring-emerald-200/30"
                      : "bg-black/20 text-white/80 ring-white/20"
                  }`}
                >
                  {store.active ? "شغال" : "متوقف"}
                </span>
              </div>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/80">
                {store.description || "ضيف وصف صغير لمتجرك من الإعدادات عشان عملاءك يعرفوك أكتر."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-bold backdrop-blur">
              {store.currency}
            </span>
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-bold backdrop-blur">
              اللون {store.themeColor}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard icon={Package} label="المنتجات" value={formatNumber(store._count.products)} hint="منتج في المتجر" tone="amber" />
        <StatCard icon={ShoppingBag} label="الطلبات" value={formatNumber(store._count.orders)} hint="طلب إجمالي" tone="violet" />
        <StatCard icon={FolderTree} label="التصنيفات" value={formatNumber(store._count.categories)} hint="قسم في المتجر" tone="sky" />
        <StatCard icon={Wallet} label="المبيعات" value={formatMoney(revenue, store.currency)} hint="إجمالي الإيرادات" tone="emerald" />
      </div>

      {/* Quick actions */}
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-black/5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
              <item.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-foreground">{item.label}</div>
              <div className="text-xs text-muted">{item.desc}</div>
            </div>
            <div className="text-end">
              <div className="text-sm font-extrabold text-foreground">{item.count}</div>
              <ArrowUpRight className="ms-auto mt-1 h-4 w-4 text-muted transition-colors group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-extrabold text-foreground">آخر الطلبات</h2>
        </div>
        {recentOrders.length > 0 && (
          <Link href={`/dashboard/stores/${store.id}/orders`} className="text-xs font-bold text-primary hover:underline">
            كل الطلبات
          </Link>
        )}
      </div>

      {recentOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted">
          لسه مفيش طلبات في المتجر ده. أول ما حد يشتري هتلاقي الطلب هنا على طول.
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface/80 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-start font-bold">العميل</th>
                  <th className="px-5 py-3 text-start font-bold">المنتجات</th>
                  <th className="px-5 py-3 text-start font-bold">المبلغ</th>
                  <th className="px-5 py-3 text-start font-bold">الحالة</th>
                  <th className="px-5 py-3 text-start font-bold">التاريخ</th>
                  <th className="px-5 py-3 text-start font-bold" />
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
                    <td className="px-5 py-3.5 text-muted">
                      {order.items[0]?.name}
                      {order.items.length > 1 && (
                        <span className="text-[10px] text-muted"> +{order.items.length - 1}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      {formatMoney(order.total, store.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/stores/${store.id}/orders/${order.id}`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        تفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
