import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, FileText, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { storePublicUrl } from "@/lib/domains";
import { ORDER_STATUS, type OrderStatus } from "@/lib/format";
import { orderShortId } from "@/lib/order-docs";
import PrintButton from "@/components/print/PrintButton";
import OrderInvoice from "@/components/print/OrderInvoice";
import OrderShippingLabel from "@/components/print/OrderShippingLabel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type BulkPrintPageProps = {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ ids?: string; doc?: string }>;
};

const MAX_DOCUMENTS = 60;

function tabClass(active: boolean) {
  return `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
    active
      ? "bg-neutral-900 text-white shadow-sm"
      : "border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
  }`;
}

export default async function BulkPrintPage({ params, searchParams }: BulkPrintPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { storeId } = await params;
  const query = await searchParams;
  const doc = query?.doc === "label" ? "label" : "invoice";
  const ids = Array.from(
    new Set(
      String(query?.ids || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_DOCUMENTS);

  if (!ids.length) redirect(`/dashboard/stores/${storeId}/orders`);

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session.userId },
  });
  if (!store) notFound();

  const rows = await prisma.order.findMany({
    where: { storeId, id: { in: ids } },
    include: { items: true },
  });
  const byId = new Map(rows.map((order) => [order.id, order]));
  const orders = ids
    .map((id) => byId.get(id))
    .filter((order): order is NonNullable<typeof order> => Boolean(order));
  if (!orders.length) notFound();

  const currency = store.currency || "EGP";
  const accent = store.themeColor || "#b08d57";
  const storeUrl = storePublicUrl(
    store.slug,
    store.customDomain,
    store.customDomainStatus
  ).replace(/^https?:\/\//, "");
  const ordersUrl = `/dashboard/stores/${storeId}/orders`;
  const docUrl = (kind: "invoice" | "label") =>
    `/print/${storeId}/orders?ids=${encodeURIComponent(ids.join(","))}&doc=${kind}`;

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{`
        @page { size: ${doc === "label" ? "100mm 150mm" : "A4"}; margin: ${doc === "label" ? "3mm" : "12mm"}; }
        @media screen {
          .print-doc { margin-bottom: 28px; }
        }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-doc { break-after: page; page-break-after: always; margin: 0 !important; }
          .print-doc:last-child { break-after: auto; page-break-after: auto; }
          .print-sheet { box-shadow: none !important; margin: 0 !important; width: auto !important; }
        }
      `}</style>

      <div className="no-print mx-auto mb-5 flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4">
        <Link
          href={ordersUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للطلبات
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-500 shadow-sm">
            {orders.length} مستند
          </span>
          <Link href={docUrl("invoice")} className={tabClass(doc === "invoice")}>
            <FileText className="h-4 w-4" />
            فواتير
          </Link>
          <Link href={docUrl("label")} className={tabClass(doc === "label")}>
            <Truck className="h-4 w-4" />
            بوالص شحن
          </Link>
          <PrintButton label={doc === "label" ? "طباعة البوالص" : "طباعة الفواتير"} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[210mm] px-4 print:max-w-none print:px-0">
        {orders.map((order) => {
          const shortId = orderShortId(order.id);
          const itemsTotal = order.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          const subtotal = order.subtotal > 0 ? order.subtotal : itemsTotal;
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const status = ORDER_STATUS[order.status as OrderStatus] ?? ORDER_STATUS.pending;

          return (
            <div key={order.id} className="print-doc">
              {doc === "label" ? (
                <OrderShippingLabel
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
                <OrderInvoice
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
        })}
      </div>
    </div>
  );
}
