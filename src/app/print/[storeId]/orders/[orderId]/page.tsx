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
}
