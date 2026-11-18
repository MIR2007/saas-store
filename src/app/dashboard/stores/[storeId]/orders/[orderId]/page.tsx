"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Check,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  StickyNote,
  Truck,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatDate, formatMoney, formatNumber, ORDER_STATUS, type OrderStatus } from "@/lib/format";
import { orderShortId, orderWhatsAppMessage } from "@/lib/order-docs";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { cardClass, primaryBtn, secondaryBtn, inputClass, labelClass } from "@/lib/ui";

const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  product?: { images: string | null } | null;
};

type OrderDetail = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCountry: string;
  customerRegion: string;
  customerAddress: string;
  notes: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  couponCode: string;
  shipping: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type StoreInfo = { name: string; currency: string };

function firstImage(raw: string | undefined | null) {
  try {
    const images = JSON.parse(raw || "[]");
    return Array.isArray(images) ? images[0] || "" : "";
  } catch {
    return "";
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const orderId = params.orderId as string;
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [currency, setCurrency] = useState("EGP");
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/stores/${storeId}/orders/${orderId}`).then((r) => r.json()),
      fetch(`/api/stores/${storeId}`).then((r) => r.json()),
    ]).then(([orderData, storeData]) => {
      setOrder(orderData.order);
      setStore(storeData.store);
      setStatus(orderData.order?.status || "pending");
      if (storeData.store?.currency) setCurrency(storeData.store.currency);
    });
  }, [storeId, orderId]);

  async function updateStatus() {
    setLoading(true);
    setSaved(false);
    await fetch(`/api/stores/${storeId}/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch(`/api/stores/${storeId}/orders/${orderId}`);
    const d = await res.json();
    setOrder(d.order);
    setStatus(d.order?.status || status);
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  if (!order) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const shortId = orderShortId(order.id);
  const storeName = store?.name || "متجرك";
  const wa = whatsappChatUrl(
    order.customerPhone,
    orderWhatsAppMessage({
      customerName: order.customerName,
      storeName,
      orderId: order.id,
      status: order.status,
      total: order.total,
      currency,
      items: order.items,
    })
  );
  const invoiceUrl = `/print/${storeId}/orders/${orderId}?doc=invoice`;
  const labelUrl = `/print/${storeId}/orders/${orderId}?doc=label`;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}/orders`}
        backLabel="كل الطلبات"
        eyebrow="تفاصيل الطلب"
        title={<span dir="ltr" className="inline-block">{shortId}</span>}
        subtitle={`اتعمل بتاريخ ${formatDate(order.createdAt)}`}
        icon={<ShoppingBag className="h-6 w-6" />}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Customer */}
          <section className={`${cardClass} p-6`}>
            <h2 className="mb-5 flex items-center gap-2 font-extrabold text-foreground">
              <User className="h-5 w-5 text-primary" />
              بيانات العميل
            </h2>
            <div className="flex items-center gap-3.5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-base font-extrabold text-white shadow-sm">
                {order.customerName.charAt(0)}
              </span>
              <div>
                <div className="font-extrabold text-foreground">{order.customerName}</div>
                <div className="text-xs text-muted">{itemCount} قطعة في الطلب</div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href={`tel:${order.customerPhone}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface/70 px-4 py-3 transition-colors hover:border-primary/30"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted">رقم الهاتف</div>
                  <div className="truncate text-sm font-bold text-foreground" dir="ltr">
                    {order.customerPhone}
                  </div>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/70 px-4 py-3">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="text-[10px] text-muted">تاريخ الطلب</div>
                  <div className="text-sm font-bold text-foreground">{formatDate(order.createdAt)}</div>
                </div>
              </div>
              {(order.customerCountry || order.customerRegion || order.customerAddress) && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/70 px-4 py-3 sm:col-span-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted">عنوان التوصيل</div>
                    <div className="text-sm font-bold text-foreground">
                      {[order.customerCountry, order.customerRegion].filter(Boolean).join(" · ")}
                    </div>
                    {order.customerAddress && (
                      <div className="mt-0.5 text-sm font-semibold leading-relaxed text-foreground">
                        {order.customerAddress}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {order.notes && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 sm:col-span-2">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted">ملاحظات العميل</div>
                    <div className="text-sm font-semibold leading-relaxed text-foreground">{order.notes}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Items */}
          <section className={`${cardClass} p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-extrabold text-foreground">منتجات الطلب</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                {formatNumber(itemCount)} قطعة
              </span>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((it) => {
                const image = firstImage(it.product?.images);
                return (
                  <li key={it.id} className="flex items-center gap-3 py-3.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface text-muted">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={it.name} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-foreground">{it.name}</div>
                      <div className="text-[11px] text-muted">
                        {formatMoney(it.price, currency)} × {it.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-foreground">
                      {formatMoney(it.price * it.quantity, currency)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-amber-500/10 via-card to-orange-500/10 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <Wallet className="h-4 w-4" />
                ملخص الطلب
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>عدد القطع</span>
                  <span className="font-semibold text-foreground">{formatNumber(itemCount)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>الشحن</span>
                  <span className="font-semibold text-foreground">
                    {order.shipping > 0 ? formatMoney(order.shipping, currency) : "مجاني"}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>المنتجات</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(
                      order.subtotal > 0
                        ? order.subtotal
                        : Math.max(0, order.total - (order.shipping || 0)),
                      currency
                    )}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>خصم{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                    <span className="font-semibold" dir="ltr">
                      - {formatMoney(order.discount, currency)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-sm font-bold text-foreground">الإجمالي</span>
                <span className="text-2xl font-extrabold text-foreground">{formatMoney(order.total, currency)}</span>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section className={`${cardClass} p-6`}>
            <h2 className="flex items-center gap-2 font-extrabold text-foreground">
              <Zap className="h-5 w-5 text-primary" />
              أدوات سريعة
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              اطبع المستندات أو ابعت للعميل رسالة واتساب جاهزة بتفاصيل الطلب.
            </p>
            <div className="mt-4 space-y-2.5">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition-colors hover:bg-[#1ebe5a]"
                >
                  <MessageCircle className="h-4 w-4" />
                  واتساب العميل
                </a>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <a href={invoiceUrl} target="_blank" rel="noreferrer" className={secondaryBtn}>
                  <FileText className="h-4 w-4" />
                  الفاتورة
                </a>
                <a href={labelUrl} target="_blank" rel="noreferrer" className={secondaryBtn}>
                  <Truck className="h-4 w-4" />
                  البوليصة
                </a>
              </div>
              <a href={`tel:${order.customerPhone}`} className={`${secondaryBtn} w-full`}>
                <Phone className="h-4 w-4" />
                اتصال بالعميل
              </a>
            </div>
            <p className="mt-3 text-center text-[10px] text-muted">
              المستندات بتفتح في تاب جديد وجاهزة للطباعة.
            </p>
          </section>

          {/* Update status */}
          <section className={`${cardClass} p-6`}>
            <h2 className="font-extrabold text-foreground">تحديث الحالة</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              غيّر حالة الطلب عشان تتابع مع العميل خطوة بخطوة.
            </p>
            <label className={`${labelClass} mt-4`}>حالة الطلب</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={inputClass}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS[s].label}
                </option>
              ))}
            </select>
            <button onClick={updateStatus} disabled={loading} className={`${primaryBtn} mt-4 w-full`}>
              {loading ? "بنحفظ..." : "حفظ الحالة"}
              {!loading && <Check className="h-4 w-4" />}
            </button>
            {saved && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                تم تحديث الحالة
              </p>
            )}
            <div className="mt-4 rounded-xl border border-border bg-surface/70 p-3">
              <p className="text-[10px] font-bold text-muted">الحالة الحالية</p>
              <div className="mt-1.5">
                <StatusBadge status={order.status} />
              </div>
            </div>
          </section>

          <Link href={`/dashboard/stores/${storeId}/orders`} className={`${secondaryBtn} w-full`}>
            رجوع لكل الطلبات
          </Link>
        </div>
      </div>
    </div>
  );
}
