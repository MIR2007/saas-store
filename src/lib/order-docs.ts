import { formatMoney, type OrderStatus } from "./format";

/** Short, human-friendly order reference used in documents and messages. */
export function orderShortId(id: string) {
  return `#${String(id).slice(-8).toUpperCase()}`;
}

export type OrderDocItem = { name: string; quantity: number; price: number };

/** First few item names plus a count for the rest — used in chat messages. */
export function orderItemsSummary(items: OrderDocItem[], max = 3) {
  const shown = items.slice(0, max).map((item) => `${item.name} ×${item.quantity}`);
  const rest = items.length - shown.length;
  if (rest > 0) shown.push(`+${rest} منتج آخر`);
  return shown.join("\n");
}

export function orderStatusMessage(status: string) {
  switch (status as OrderStatus) {
    case "confirmed":
      return "طلبك اتأكد وجاري تجهيزه.";
    case "shipped":
      return "طلبك خرج للشحن وهيوصلك قريبًا.";
    case "delivered":
      return "نتمنى تكون تجربة الشراء عجبتك.";
    case "cancelled":
      return "طلبك اتلغى. لو محتاج أي مساعدة كلمنا.";
    default:
      return "بنأكد طلبك دلوقتي وهنرد عليك في أقرب وقت.";
  }
}

/** Ready-to-send WhatsApp message with the order summary. */
export function orderWhatsAppMessage({
  customerName,
  storeName,
  orderId,
  status,
  total,
  currency,
  items,
}: {
  customerName: string;
  storeName: string;
  orderId: string;
  status: string;
  total: number;
  currency: string;
  items: OrderDocItem[];
}) {
  return [
    `أهلًا ${customerName} 👋`,
    `بخصوص طلبك ${orderShortId(orderId)} من ${storeName}:`,
    orderItemsSummary(items),
    `الإجمالي: ${formatMoney(total, currency)}`,
    orderStatusMessage(status),
  ]
    .filter(Boolean)
    .join("\n");
}
