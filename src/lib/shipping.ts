import { EGYPT_GOVERNORATES } from "@/lib/egypt";

/**
 * Shipping is a single fixed amount per Egyptian governorate, configured at
 * store level. `OTHER_REGIONS_KEY` is used for every non-Egyptian country.
 */
export const OTHER_REGIONS_KEY = "*";

export const DEFAULT_SHIPPING_RATES: Record<string, number> = {
  القاهرة: 50,
  الجيزة: 50,
  الإسكندرية: 60,
  القليوبية: 55,
  الدقهلية: 65,
  الشرقية: 65,
  الغربية: 65,
  المنوفية: 65,
  البحيرة: 70,
  "كفر الشيخ": 70,
  دمياط: 70,
  بورسعيد: 70,
  الإسماعيلية: 70,
  السويس: 70,
  "شمال سيناء": 100,
  "جنوب سيناء": 100,
  الفيوم: 70,
  "بني سويف": 70,
  المنيا: 75,
  أسيوط: 80,
  سوهاج: 80,
  قنا: 85,
  الأقصر: 85,
  أسوان: 90,
  "البحر الأحمر": 90,
  "الوادي الجديد": 100,
  مطروح: 90,
  [OTHER_REGIONS_KEY]: 150,
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function defaultShippingRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const governorate of EGYPT_GOVERNORATES) {
    rates[governorate] = DEFAULT_SHIPPING_RATES[governorate] ?? 0;
  }
  rates[OTHER_REGIONS_KEY] = DEFAULT_SHIPPING_RATES[OTHER_REGIONS_KEY] ?? 0;
  return rates;
}

export function parseShippingRates(raw?: string | null): Record<string, number> {
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return defaultShippingRates();
  }

  const rates: Record<string, number> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const name = String(key).trim().slice(0, 60);
    if (!name) continue;
    const amount = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(amount) && amount >= 0) {
      rates[name] = roundMoney(amount);
    }
  }

  // Legacy stores created before governorate shipping have an empty object.
  // Seed them with sensible defaults instead of silently charging zero.
  if (Object.keys(rates).length === 0) return defaultShippingRates();
  return rates;
}

/** Ensures the settings editor always shows every governorate. */
export function shippingRatesWithDefaults(raw?: string | null): Record<string, number> {
  const parsed = parseShippingRates(raw);
  const rates: Record<string, number> = {};
  for (const governorate of EGYPT_GOVERNORATES) {
    rates[governorate] = parsed[governorate] ?? DEFAULT_SHIPPING_RATES[governorate] ?? 0;
  }
  rates[OTHER_REGIONS_KEY] =
    parsed[OTHER_REGIONS_KEY] ?? DEFAULT_SHIPPING_RATES[OTHER_REGIONS_KEY] ?? 0;
  return rates;
}

export function shippingRateFor(
  region: string | null | undefined,
  country: string | null | undefined,
  rates: Record<string, number>
) {
  if (country && country.trim() !== "مصر") {
    return roundMoney(rates[OTHER_REGIONS_KEY] ?? 0);
  }
  const governorate = (region || "").trim();
  return roundMoney(rates[governorate] ?? rates[OTHER_REGIONS_KEY] ?? 0);
}

/** Lowest Egyptian governorate rate — used for "starting from" cart hints. */
export function minShippingRate(rates: Record<string, number>) {
  const values = Object.entries(rates)
    .filter(([key]) => key !== OTHER_REGIONS_KEY)
    .map(([, value]) => value)
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (values.length === 0) return roundMoney(rates[OTHER_REGIONS_KEY] ?? 0);
  return roundMoney(Math.min(...values));
}
