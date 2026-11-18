import { formatDate, formatMoney, formatNumber } from "@/lib/format";

export type LabelItem = { id: string; name: string; quantity: number };

export default function OrderShippingLabel({
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
