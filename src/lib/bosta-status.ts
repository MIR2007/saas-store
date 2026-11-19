/** Bosta rejects any COD amount above this value. */
export const BOSTA_MAX_COD = 30000;

export type BostaOrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Arabic labels for the delivery states returned by Bosta. Kept in a
 * standalone module so client components can import them without pulling in
 * the server-side API client.
 */
export const BOSTA_STATE_LABELS: Record<string, string> = {
  "pickup requested": "تم طلب الاستلام",
  "waiting for route": "بانتظار تحديد خط السير",
  "route assigned": "تم تحديد خط السير",
  "waiting for pickup": "بانتظار الاستلام من المتجر",
  "picking up": "جاري الاستلام",
  "picking up from warehouse": "جاري الاستلام من المخزن",
  "picking up from consignee": "جاري الاستلام من العميل",
  "arrived at business": "وصل للمتجر",
  "received at warehouse": "وصل لمخزن بوسطة",
  "picked up": "تم الاستلام من المتجر",
  "picked up from business": "تم الاستلام من المتجر",
  "picked up from consignee": "تم الاستلام من العميل",
  delivering: "جاري التوصيل",
  "arrived at customer": "وصل للعميل",
  delivered: "تم التسليم",
  "delivery confirmed": "تم تأكيد التسليم",
  fulfilled: "تم التنفيذ",
  canceled: "ملغاة",
  cancelled: "ملغاة",
  terminated: "ملغاة",
  exception: "مشكلة في الشحنة",
  "returned to business": "مرتجعة للمتجر",
  "returned to stock": "رجعت للمخزن",
  "in transit between hubs": "في الطريق بين الفروع",
  lost: "مفقودة",
  damaged: "تالفة",
  investigation: "قيد المراجعة",
  "awaiting your action": "محتاجة إجراء منك",
  archived: "مؤرشفة",
  "on hold": "معلقة",
};

/**
 * Bosta webhooks send the state as a numeric code. This map mirrors the
 * official state table so we can always store a readable value.
 */
export const BOSTA_STATE_BY_CODE: Record<number, string> = {
  10: "Pickup requested",
  11: "Waiting for route",
  20: "Route Assigned",
  22: "Picking up from consignee",
  40: "Picking up",
  21: "Picked up from business",
  23: "Picked up from consignee",
  41: "Picked up",
  24: "Received at warehouse",
  25: "Fulfilled",
  30: "In transit between Hubs",
  45: "Delivered",
  46: "Returned to business",
  47: "Exception",
  49: "Canceled",
  48: "Terminated",
  100: "Lost",
  101: "Damaged",
  60: "Returned to stock",
  102: "Investigation",
  103: "Awaiting your action",
  104: "Archived",
  105: "On hold",
};

export function bostaStateFromCode(code: number | string | null | undefined) {
  const numeric = Number(code);
  return BOSTA_STATE_BY_CODE[numeric] || "";
}

export const BOSTA_PACKAGE_TYPES = [
  { value: "SMALL", label: "صغير" },
  { value: "MEDIUM", label: "متوسط" },
  { value: "LARGE", label: "كبير" },
  { value: "Light Bulky", label: "ضخم خفيف" },
  { value: "Heavy Bulky", label: "ضخم ثقيل" },
] as const;

export type BostaPackageType = (typeof BOSTA_PACKAGE_TYPES)[number]["value"];

export function isBostaPackageType(value: unknown): value is BostaPackageType {
  return BOSTA_PACKAGE_TYPES.some((type) => type.value === value);
}

export function bostaStateLabel(state: string | null | undefined) {
  const key = String(state || "").trim().toLowerCase();
  if (!key) return "بانتظار التحديث";
  return BOSTA_STATE_LABELS[key] || state || "بانتظار التحديث";
}

export function bostaStateTone(state: string | null | undefined) {
  const key = String(state || "").trim().toLowerCase();
  if (key === "delivered" || key === "delivery confirmed") {
    return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300";
  }
  if (
    key === "canceled" ||
    key === "cancelled" ||
    key === "terminated" ||
    key === "returned to business" ||
    key === "returned to stock"
  ) {
    return "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300";
  }
  if (
    key === "exception" ||
    key === "lost" ||
    key === "damaged" ||
    key === "investigation" ||
    key === "awaiting your action" ||
    key === "on hold"
  ) {
    return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300";
  }
  if (
    key === "picked up" ||
    key === "picked up from business" ||
    key === "picked up from consignee" ||
    key === "received at warehouse" ||
    key === "in transit between hubs" ||
    key === "delivering" ||
    key === "arrived at customer" ||
    key === "fulfilled"
  ) {
    return "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300";
  }
  return "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300";
}

const PICKUP_STATES = new Set([
  "pickup requested",
  "waiting for route",
  "route assigned",
  "waiting for pickup",
  "picking up",
  "picking up from warehouse",
  "arrived at business",
]);

const TRANSIT_STATES = new Set([
  "received at warehouse",
  "picked up",
  "picked up from business",
  "in transit between hubs",
  "delivering",
  "arrived at customer",
]);

const CANCELLED_STATES = new Set([
  "canceled",
  "cancelled",
  "terminated",
  "returned to business",
]);

const EXCEPTION_STATES = new Set(["exception", "lost", "damaged", "investigation"]);

/**
 * Maps a Bosta delivery state to the order status used by Bee Panal.
 * Returns null when the order status should stay unchanged (e.g. in-transit
 * updates after the order is already marked as shipped, or exception states).
 */
export function bostaOrderStatus(
  state: string | null | undefined,
  currentStatus: string
): BostaOrderStatus | null {
  const key = String(state || "").trim().toLowerCase();
  if (!key) return null;

  if (key === "delivered" || key === "delivery confirmed") return "delivered";
  if (CANCELLED_STATES.has(key)) return "cancelled";
  if (EXCEPTION_STATES.has(key)) return null;

  if (PICKUP_STATES.has(key)) {
    return currentStatus === "pending" ? "confirmed" : null;
  }

  if (TRANSIT_STATES.has(key)) {
    if (currentStatus === "pending" || currentStatus === "confirmed") return "shipped";
    return null;
  }

  return null;
}

export const BOSTA_TRACKING_URL = "https://bosta.co/ar-eg/tracking-shipments";

export function bostaTrackingUrl(trackingNumber: string | null | undefined) {
  const number = String(trackingNumber || "").trim();
  return number
    ? `${BOSTA_TRACKING_URL}?shipment-number=${encodeURIComponent(number)}`
    : BOSTA_TRACKING_URL;
}
