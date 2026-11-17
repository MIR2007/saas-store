import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, MapPin, Phone, ShoppingBag, Truck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { getStoreBase } from "@/lib/store-url";
import { getStoreTheme } from "@/lib/themes";
import TrackPurchase from "@/components/storefront/TrackPurchase";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage(props: PageProps<"/[slug]/order/[orderId]">) {
  const { slug, orderId } = await props.params;
  const searchParams = await props.searchParams;
  const isNewOrder = searchParams?.success === "1";
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  const order = await prisma.order.findFirst({ where: { id: orderId, storeId: store.id }, include: { items: true } });
  if (!order) notFound();

  const theme = getStoreTheme(store.theme);
  const color = store.themeColor || theme.primary;
  const base = await getStoreBase(store.slug, store.customDomain);
  const shortId = `#${order.id.slice(-8).toUpperCase()}`;
  const count = order.items.reduce((s, it) => s + it.quantity, 0);

  return (
    <div className="min-h-screen bg-surface">
      <TrackPurchase
        orderId={order.id}
        enabled={isNewOrder}
        value={order.total}
        currency={store.currency || "EGP"}
        items={order.items.map((item) => ({
          id: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))}
      />
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <div className="mx-auto flex min-h-[calc(100vh-4px)] max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full">
          <div className="text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold text-foreground sm:text-3xl">تم استلام طلبك بنجاح! 🎉</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              شكرًا ليك. {store.name} هيتواصل معاك لتأكيد الطلب، وهنجهّزه في أقرب وقت.
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border bg-surface/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold text-white"
                  style={{ backgroundColor: color }}
                >
                  {store.name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-extrabold text-foreground">{store.name}</div>
                  <div className="text-[10px] text-muted">
                    رقم الطلب <span dir="ltr" className="inline-block font-mono">{shortId}</span>
                  </div>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                بانتظار التأكيد
              </span>
            </div>

            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/50 px-3.5 py-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted">رقم الموبايل</div>
                    <div className="text-xs font-bold text-foreground" dir="ltr">{order.customerPhone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/50 px-3.5 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted">عنوان التوصيل</div>
                    <div className="text-xs font-bold leading-relaxed text-foreground">
                      {order.customerAddress || "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-foreground">تفاصيل الطلب</h2>
                  <span className="text-[10px] text-muted">{count} قطعة</span>
                </div>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-3.5 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-muted">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-foreground">{it.name}</div>
                        <div className="text-[10px] text-muted">الكمية: {it.quantity}</div>
                      </div>
                      <span className="text-xs font-extrabold text-foreground">
                        {formatMoney(it.price * it.quantity, store.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-baseline justify-between rounded-xl bg-primary/5 px-4 py-3 ring-1 ring-primary/15">
                <span className="text-sm font-bold text-foreground">الإجمالي</span>
                <span className="text-xl font-extrabold text-foreground">{formatMoney(order.total, store.currency)}</span>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-[11px] leading-relaxed text-muted">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  الدفع عند الاستلام. التوصيل متاح لكل محافظات مصر خلال 2-5 أيام عمل، وهيتواصل معاك مندوب الشحن قبل التسليم.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              href={`${base}` || "/"}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-black/10 transition-colors hover:bg-primary-dark sm:w-auto"
            >
              كمّل تسوق
            </Link>
            <span className="text-[10px] text-muted">احتفظ برقم الطلب للمتابعة مع التاجر.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
