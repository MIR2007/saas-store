import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

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

export default async function OrdersPage(props: PageProps<"/dashboard/stores/[storeId]/orders">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const store = await prisma.store.findFirst({ where: { id: storeId, userId: session!.userId } });
  if (!store) notFound();

  const orders = await prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">الطلبات</h1>
      <p className="text-sm text-muted mb-6">{store.name}</p>

      {orders.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted">لا توجد طلبات بعد.</div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="text-right px-4 py-3">العميل</th>
                <th className="text-right px-4 py-3">الهاتف</th>
                <th className="text-right px-4 py-3">المبلغ</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">التاريخ</th>
                <th className="text-right px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{o.customerName}</td>
                  <td className="px-4 py-3 text-muted">{o.customerPhone}</td>
                  <td className="px-4 py-3">{o.total.toLocaleString()} {store.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[o.status] || ""}`}>{statusLabel(o.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(o.createdAt).toLocaleDateString("ar-IQ")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/stores/${store.id}/orders/${o.id}`} className="text-primary hover:underline">تفاصيل</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}