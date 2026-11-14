"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export default function OrderDetailPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const orderId = params.orderId as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/stores/${storeId}/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.order);
        setStatus(d.order?.status || "pending");
      });
  }, [storeId, orderId]);

  async function updateStatus() {
    setLoading(true);
    await fetch(`/api/stores/${storeId}/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
    // reload
    const res = await fetch(`/api/stores/${storeId}/orders/${orderId}`);
    const d = await res.json();
    setOrder(d.order);
  }

  if (!order) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">تفاصيل الطلب</h1>
      <p className="text-sm text-muted mb-6">{order.id}</p>

      <div className="bg-white border border-border rounded-2xl p-6 mb-6 space-y-3">
        <div className="flex justify-between"><span className="text-muted">العميل</span><span className="font-medium">{order.customerName}</span></div>
        <div className="flex justify-between"><span className="text-muted">الهاتف</span><span className="font-medium">{order.customerPhone}</span></div>
        {order.customerAddress && <div className="flex justify-between"><span className="text-muted">العنوان</span><span className="font-medium">{order.customerAddress}</span></div>}
        {order.notes && <div className="flex justify-between"><span className="text-muted">ملاحظات</span><span className="font-medium">{order.notes}</span></div>}
        <div className="flex justify-between"><span className="text-muted">المجموع</span><span className="font-bold text-primary">{order.total.toLocaleString()}</span></div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-foreground mb-4">المنتجات</h2>
        <ul className="divide-y divide-border">
          {order.items.map((it: any) => (
            <li key={it.id} className="py-3 flex justify-between">
              <span>{it.name} × {it.quantity}</span>
              <span className="font-medium">{(it.price * it.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4">تحديث الحالة</h2>
        <div className="flex gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 border border-border rounded-lg px-3 py-2">
            {statuses.map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
          <button onClick={updateStatus} disabled={loading} className="bg-primary text-white font-medium px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-60">
            {loading ? "..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}