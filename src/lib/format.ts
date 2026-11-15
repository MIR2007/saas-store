export const CURRENCIES = [
  { code: "EGP", label: "جنيه مصري", symbol: "ج.م" },
  { code: "USD", label: "دولار أمريكي", symbol: "$" },
  { code: "SAR", label: "ريال سعودي", symbol: "ر.س" },
  { code: "AED", label: "درهم إماراتي", symbol: "د.إ" },
  { code: "IQD", label: "دينار عراقي", symbol: "د.ع" },
] as const;

export function currencySymbol(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatMoney(value: number, currency = "EGP") {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value || 0);
  return `${formatted} ${currencySymbol(currency)}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "بانتظار التأكيد",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "مؤكد",
    className: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  shipped: {
    label: "تم الشحن",
    className: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  delivered: {
    label: "تم التسليم",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "ملغي",
    className: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export function orderStatus(status: string) {
  return ORDER_STATUS[status as OrderStatus] ?? ORDER_STATUS.pending;
}
