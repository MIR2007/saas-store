import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StoreDetailPage(props: PageProps<"/dashboard/stores/[storeId]">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session!.userId },
    include: { _count: { select: { products: true, orders: true, categories: true } } },
  });
  if (!store) notFound();

  const recentOrders = await prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: true },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-xl" style={{ backgroundColor: store.themeColor }}>
          {store.name.charAt(0)}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
          <div className="text-sm text-muted">/{store.slug} · <a href={`/${store.slug}`} target="_blank" className="text-primary hover:underline">عرض المتجر</a></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <Link href={`/dashboard/stores/${store.id}/products`} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition">
          <div className="text-sm text-muted">المنتجات</div>
          <div className="text-3xl font-bold text-foreground mt-2">{store._count.products}</div>
          <div className="text-xs text-primary mt-2">إدارة المنتجات ←</div>
        </Link>
        <Link href={`/dashboard/stores/${store.id}/orders`} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition">
          <div className="text-sm text-muted">الطلبات</div>
          <div className="text-3xl font-bold text-foreground mt-2">{store._count.orders}</div>
          <div className="text-xs text-primary mt-2">عرض الطلبات ←</div>
        </Link>
        <Link href={`/dashboard/stores/${store.id}/settings`} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition">
          <div className="text-sm text-muted">التصنيفات</div>
          <div className="text-3xl font-bold text-foreground mt-2">{store._count.categories}</div>
          <div className="text-xs text-primary mt-2">الإعدادات ←</div>
        </Link>
      </div>

      <h2 className="text-lg font-bold text-foreground mb-4">آخر الطلبات</h2>
      {recentOrders.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted text-sm">لا توجد طلبات بعد.</div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="text-right px-4 py-3">العميل</th>
                <th className="text-right px-4 py-3">المبلغ</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">{o.total.toLocaleString()} {store.currency}</td>
                  <td className="px-4 py-3">{statusLabel(o.status)}</td>
                  <td className="px-4 py-3 text-muted">{new Date(o.createdAt).toLocaleDateString("ar-IQ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  };
  return map[s] || s;
}