import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Clock, ShoppingBag, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import OrdersTable, { type OrderRow } from "@/components/dashboard/OrdersTable";
import { formatMoney, formatNumber } from "@/lib/format";

export default async function OrdersPage(props: PageProps<"/dashboard/stores/[storeId]/orders">) {
  const session = await getSession();
  const { storeId } = await props.params;

  const store = await prisma.store.findFirst({ where: { id: storeId, userId: session!.userId } });
  if (!store) notFound();

  const orders = await prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { images: true } } } } },
  });

  const pendingCount = orders.filter((order) => order.status === "pending").length;
  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  const rows: OrderRow[] = orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerCountry: order.customerCountry,
    customerRegion: order.customerRegion,
    customerAddress: order.customerAddress,
    notes: order.notes,
    status: order.status,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode,
    shipping: order.shipping,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      product: item.product ? { images: item.product.images } : null,
    })),
  }));

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${store.id}`}
        backLabel={store.name}
        eyebrow="المبيعات"
        title="الطلبات"
        subtitle="تابع كل طلب، غيّر الحالات، واطبع الفواتير والبوالص بسرعة."
        icon={<ShoppingBag className="h-6 w-6" />}
      />

      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
        <StatCard
          icon={ShoppingBag}
          label="كل الطلبات"
          value={formatNumber(orders.length)}
          hint="طلب إجمالي"
          tone="amber"
        />
        <StatCard
          icon={Clock}
          label="مستني التأكيد"
          value={formatNumber(pendingCount)}
          hint="محتاج متابعة"
          tone="rose"
        />
        <StatCard
          icon={Wallet}
          label="صافي المبيعات"
          value={formatMoney(revenue, store.currency)}
          hint="بدون الطلبات الملغية"
          tone="emerald"
        />
      </div>

      <OrdersTable storeId={store.id} currency={store.currency} orders={rows} />
    </div>
  );
}
