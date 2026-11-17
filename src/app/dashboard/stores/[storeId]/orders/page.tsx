import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ShoppingBag, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cardClass } from "@/lib/ui";

const filters = [
  { key: "all", label: "كل الطلبات" },
  { key: "pending", label: "مستني التأكيد" },
  { key: "confirmed", label: "مؤكد" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التسليم" },
  { key: "cancelled", label: "ملغي" },
] as const;

function firstImage(raw: string | undefined | null) {
  try {
    const images = JSON.parse(raw || "[]");
    return Array.isArray(images) ? images[0] || "" : "";
  } catch {
    return "";
  }
}

export default async function OrdersPage(props: PageProps<"/dashboard/stores/[storeId]/orders">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const searchParams = await props.searchParams;
  const filter = (searchParams as any)?.status as string | undefined;

  const store = await prisma.store.findFirst({ where: { id: storeId, userId: session!.userId } });
  if (!store) notFound();

  const [orders, revenueAgg] = await Promise.all([
    prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: { select: { images: true } } } } },
    }),
    prisma.order.aggregate({ where: { storeId }, _sum: { total: true } }),
  ]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const visible = filter && filter !== "all" ? orders.filter((o) => o.status === filter) : orders;
  const revenue = revenueAgg._sum.total ?? 0;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${store.id}`}
        backLabel={store.name}
        eyebrow="المبيعات"
        title="الطلبات"
        subtitle="تابع كل طلب من لحظة وصوله لحد ما يوصل للعميل."
        icon={<ShoppingBag className="h-6 w-6" />}
      />

      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
        <StatCard icon={ShoppingBag} label="كل الطلبات" value={formatNumber(orders.length)} hint="طلب إجمالي" tone="amber" />
        <StatCard icon={Clock} label="مستني التأكيد" value={formatNumber(pendingCount)} hint="محتاج متابعة" tone="rose" />
        <StatCard icon={Wallet} label="إجمالي المبيعات" value={formatMoney(revenue, store.currency)} hint="من كل الطلبات" tone="emerald" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = (filter || "all") === f.key;
          const count = f.key === "all" ? orders.length : orders.filter((o) => o.status === f.key).length;
          return (
            <Link
              key={f.key}
              href={
                f.key === "all"
                  ? `/dashboard/stores/${store.id}/orders`
                  : `/dashboard/stores/${store.id}/orders?status=${f.key}`
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "bg-primary text-white shadow-sm shadow-amber-500/20"
                  : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? "bg-white/20 text-white" : "bg-surface text-muted"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={orders.length === 0 ? "لسه مفيش طلبات" : "مفيش طلبات بالحالة دي"}
          description={
            orders.length === 0
              ? "أول ما عميل يطلب من متجرك، الطلب هيظهر هنا وهتقدر تتابعه خطوة بخطوة."
              : "جرّب تشوف كل الطلبات أو فلتر تاني."
          }
          action={
            orders.length > 0 ? (
              <Link href={`/dashboard/stores/${store.id}/orders`} className="text-sm font-bold text-primary hover:underline">
                عرض كل الطلبات
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
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
                {visible.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">
                          {order.customerName.charAt(0)}
                        </span>
                        <div>
                          <div className="font-semibold text-foreground">{order.customerName}</div>
                          <div className="text-[10px] text-muted" dir="ltr">
                            {order.customerPhone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface text-muted">
                          {firstImage(order.items[0]?.product?.images) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImage(order.items[0]?.product?.images)}
                              alt={order.items[0]?.name || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-muted">{order.items[0]?.name || "—"}</div>
                          <div className="text-[10px] text-muted">
                            {order.items.reduce((s, it) => s + it.quantity, 0)} قطعة
                            {order.items.length > 1 && ` · ${order.items.length} منتجات`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-bold text-foreground">
                      {formatMoney(order.total, store.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/stores/${store.id}/orders/${order.id}`}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
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
