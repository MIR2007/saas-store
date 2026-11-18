import { formatDate, formatMoney, formatNumber } from "@/lib/format";

export type InvoiceItem = { id: string; name: string; price: number; quantity: number };

export default function OrderInvoice({
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
