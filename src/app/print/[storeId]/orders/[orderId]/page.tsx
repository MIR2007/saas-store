import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, FileText, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { storePublicUrl } from "@/lib/domains";
import { formatDate, formatMoney, formatNumber, ORDER_STATUS, type OrderStatus } from "@/lib/format";
import { orderShortId } from "@/lib/order-docs";
import PrintButton from "@/components/print/PrintButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PrintPageProps = {
  params: Promise<{ storeId: string; orderId: string }>;
  searchParams: Promise<{ doc?: string }>;
};

function tabClass(active: boolean) {
  return `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
    active
      ? "bg-neutral-900 text-white shadow-sm"
      : "border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
  }`;
}

export default async function PrintOrderPage({ params, searchParams }: PrintPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { storeId, orderId } = await params;
  const query = await searchParams;
  const doc = query?.doc === "label" ? "label" : "invoice";

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session.userId },
  });
  if (!store) notFound();

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: true },
  });
  if (!order) notFound();

  const currency = store.currency || "EGP";
  const shortId = orderShortId(order.id);
  const accent = store.themeColor || "#b08d57";
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = order.subtotal > 0 ? order.subtotal : itemsTotal;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const status = ORDER_STATUS[order.status as OrderStatus] ?? ORDER_STATUS.pending;
  const storeUrl = storePublicUrl(
    store.slug,
    store.customDomain,
    store.customDomainStatus
  ).replace(/^https?:\/\//, "");
  const orderUrl = `/dashboard/stores/${storeId}/orders/${orderId}`;
  const docUrl = (kind: "invoice" | "label") => `/print/${storeId}/orders/${orderId}?doc=${kind}`;

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{`
        @page { size: ${doc === "label" ? "100mm 150mm" : "A4"}; margin: ${doc === "label" ? "3mm" : "12mm"}; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-sheet { box-shadow: none !important; margin: 0 !important; width: auto !important; }
        }
      `}</style>

      <div className="no-print mx-auto mb-5 flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4">
        <Link
          href={orderUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للطلب
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={docUrl("invoice")} className={tabClass(doc === "invoice")}>
            <FileText className="h-4 w-4" />
            فاتورة
          </Link>
          <Link href={docUrl("label")} className={tabClass(doc === "label")}>
            <Truck className="h-4 w-4" />
            بوليصة شحن
          </Link>
          <PrintButton label={doc === "label" ? "طباعة البوليصة" : "طباعة الفاتورة"} />
        </div>
      </div>

      {doc === "label" ? (
        <ShippingLabel
          storeName={store.name}
          shortId={shortId}
          orderId={order.id}
          createdAt={order.createdAt}
          accent={accent}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          customerCountry={order.customerCountry}
          customerRegion={order.customerRegion}
          customerAddress={order.customerAddress}
          notes={order.notes}
          total={order.total}
          currency={currency}
          itemCount={itemCount}
          items={order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
          }))}
        />
      ) : (
        <Invoice
          storeName={store.name}
          storeLogo={store.logo}
          storePhone={store.phone}
          storeUrl={storeUrl}
          accent={accent}
          shortId={shortId}
          createdAt={order.createdAt}
          statusLabel={status.label}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          customerCountry={order.customerCountry}
          customerRegion={order.customerRegion}
          customerAddress={order.customerAddress}
          notes={order.notes}
          items={order.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))}
          subtotal={subtotal}
          discount={order.discount}
          couponCode={order.couponCode}
          shipping={order.shipping}
          total={order.total}
          currency={currency}
        />
      )}
    </div>
  );
}

type InvoiceItem = { id: string; name: string; price: number; quantity: number };

function Invoice({
  storeName,
  storeLogo,
  storePhone,
  storeUrl,
  accent,
  shortId,
  createdAt,
  statusLabel,
  customerName,
  customerPhone,
  customerCountry,
  customerRegion,
  customerAddress,
  notes,
  items,
  subtotal,
  discount,
  couponCode,
  shipping,
  total,
  currency,
}: {
  storeName: string;
  storeLogo: string;
  storePhone: string;
  storeUrl: string;
  accent: string;
  shortId: string;
  createdAt: Date;
  statusLabel: string;
  customerName: string;
  customerPhone: string;
  customerCountry: string;
  customerRegion: string;
  customerAddress: string;
  notes: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  couponCode: string;
  shipping: number;
  total: number;
  currency: string;
}) {
  return (
    <article className="print-sheet mx-auto w-full max-w-[210mm] bg-white text-neutral-900 shadow-lg">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="p-8 sm:p-10">
        <header className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {storeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeLogo}
                alt={storeName}
                className="h-16 w-16 rounded-xl border border-neutral-200 object-cover"
              />
            ) : (
              <span
                className="grid h-16 w-16 place-items-center rounded-xl text-2xl font-black text-white"
                style={{ backgroundColor: accent }}
              >
                {storeName.trim().charAt(0)}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">{storeName}</h1>
              {storePhone && (
                <p dir="ltr" className="mt-1 text-sm font-semibold text-neutral-600">
                  {storePhone}
                </p>
              )}
              <p dir="ltr" className="text-xs text-neutral-400">
                {storeUrl}
              </p>
            </div>
          </div>
          <div className="text-end">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
              Invoice
            </div>
            <div className="mt-1 text-xl font-extrabold">فاتورة</div>
            <div className="mt-2 font-mono text-sm font-bold" dir="ltr">
              {shortId}
            </div>
            <div className="mt-0.5 text-xs text-neutral-500">{formatDate(createdAt)}</div>
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="break-inside-avoid rounded-xl border border-neutral-200 p-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              فاتورة إلى
            </h2>
            <div className="mt-1.5 text-base font-extrabold">{customerName}</div>
            <div className="mt-1 text-sm font-semibold text-neutral-700" dir="ltr">
              {customerPhone}
            </div>
            {(customerCountry || customerRegion) && (
              <div className="mt-1 text-sm text-neutral-600">
                {[customerCountry, customerRegion].filter(Boolean).join(" · ")}
              </div>
            )}
            {customerAddress && (
              <div className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                {customerAddress}
              </div>
            )}
          </section>
          <section className="break-inside-avoid rounded-xl border border-neutral-200 p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">رقم الطلب</dt>
                <dd className="font-mono font-bold" dir="ltr">
                  {shortId}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">تاريخ الطلب</dt>
                <dd className="font-semibold">{formatDate(createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">الحالة</dt>
                <dd className="font-semibold">{statusLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">طريقة الدفع</dt>
                <dd className="font-semibold">الدفع عند الاستلام</dd>
              </div>
            </dl>
          </section>
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-900">
              <th className="w-8 py-2 text-start font-bold">#</th>
              <th className="py-2 text-start font-bold">المنتج</th>
              <th className="py-2 text-start font-bold">السعر</th>
              <th className="py-2 text-center font-bold">الكمية</th>
              <th className="py-2 text-end font-bold">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="py-3 text-neutral-400">{formatNumber(index + 1)}</td>
                <td className="py-3 pe-3 font-semibold">{item.name}</td>
                <td className="py-3 text-neutral-600">{formatMoney(item.price, currency)}</td>
                <td className="py-3 text-center text-neutral-600">{formatNumber(item.quantity)}</td>
                <td className="py-3 text-end font-bold">
                  {formatMoney(item.price * item.quantity, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex break-inside-avoid justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">المنتجات</span>
              <span className="font-semibold">{formatMoney(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>خصم{couponCode ? ` (${couponCode})` : ""}</span>
                <span className="font-semibold" dir="ltr">
                  - {formatMoney(discount, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500">الشحن</span>
              <span className="font-semibold">
                {shipping > 0 ? formatMoney(shipping, currency) : "مجاني"}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t-2 border-neutral-900 pt-2.5 text-lg font-extrabold">
              <span>الإجمالي</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
          </div>
        </div>

        {notes && (
          <section className="mt-6 break-inside-avoid rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              ملاحظات
            </div>
            <p className="mt-1 text-sm leading-relaxed text-neutral-700">{notes}</p>
          </section>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-center text-[11px] leading-relaxed text-neutral-400">
          شكرًا لتسوقك من {storeName} — فاتورة تم إنشاؤها بواسطة Bee Panal
        </footer>
      </div>
    </article>
  );
}

type LabelItem = { id: string; name: string; quantity: number };

function ShippingLabel({
  storeName,
  shortId,
  orderId,
  createdAt,
  accent,
  customerName,
  customerPhone,
  customerCountry,
  customerRegion,
  customerAddress,
  notes,
  total,
  currency,
  itemCount,
  items,
}: {
  storeName: string;
  shortId: string;
  orderId: string;
  createdAt: Date;
  accent: string;
  customerName: string;
  customerPhone: string;
  customerCountry: string;
  customerRegion: string;
  customerAddress: string;
  notes: string;
  total: number;
  currency: string;
  itemCount: number;
  items: LabelItem[];
}) {
  return (
    <article className="print-sheet mx-auto w-[94mm] bg-white text-neutral-900 shadow-lg">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="flex min-h-[142mm] flex-col p-4">
        <header className="flex items-start justify-between gap-2 border-b border-neutral-300 pb-2">
          <div>
            <div className="text-sm font-extrabold leading-tight">{storeName}</div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Shipping Label
            </div>
          </div>
          <div className="text-end">
            <div className="text-[10px] font-bold text-neutral-500">بوليصة شحن</div>
            <div className="font-mono text-xs font-bold" dir="ltr">
              {shortId}
            </div>
          </div>
        </header>

        <div className="mt-3">
          <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
            المرسل إليه
          </div>
          <div className="mt-0.5 text-lg font-extrabold leading-tight">{customerName}</div>
          <div className="mt-1 font-mono text-base font-extrabold tracking-wide" dir="ltr">
            {customerPhone}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
            العنوان
          </div>
          <div className="mt-0.5 text-sm font-bold leading-snug">
            {[customerCountry, customerRegion].filter(Boolean).join(" · ")}
          </div>
          {customerAddress && (
            <div className="mt-0.5 text-[12px] leading-snug text-neutral-700">
              {customerAddress}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-2 border-neutral-900 px-3 py-2">
          <div>
            <div className="text-[9px] font-bold text-neutral-500">المبلغ عند الاستلام</div>
            <div className="text-base font-black">{formatMoney(total, currency)}</div>
          </div>
          <div className="text-end">
            <div className="text-[9px] font-bold text-neutral-500">عدد القطع</div>
            <div className="text-base font-black">{formatNumber(itemCount)}</div>
          </div>
        </div>

        <div className="mt-3 border-t border-neutral-200 pt-2">
          <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
            الطلب
          </div>
          <ul className="mt-1 space-y-0.5 text-[11px] leading-snug text-neutral-700">
            {items.slice(0, 4).map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 font-bold">×{item.quantity}</span>
              </li>
            ))}
            {items.length > 4 && (
              <li className="text-neutral-400">+{items.length - 4} منتج آخر</li>
            )}
          </ul>
        </div>

        {notes && (
          <div className="mt-2 border-t border-neutral-200 pt-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
              ملاحظات
            </div>
            <div className="mt-0.5 text-[11px] leading-snug text-neutral-700">
              {notes.length > 120 ? `${notes.slice(0, 120).trimEnd()}…` : notes}
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 text-center">
          <div className="text-[8px] text-neutral-400">
            Bee Panal — {formatDate(createdAt)}
          </div>
          <div className="mt-0.5 font-mono text-[8px] text-neutral-300" dir="ltr">
            {orderId}
          </div>
        </div>
      </div>
    </article>
  );
}
