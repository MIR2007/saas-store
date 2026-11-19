import { normalizePhone } from "./phone";
import {
  bostaStateFromCode,
  isBostaPackageType,
  type BostaPackageType,
} from "./bosta-status";

/**
 * Server-side Bosta (بوسطة) API client.
 *
 * Every merchant connects their own Bosta business account with a personal API
 * key. The key is sent in the `Authorization` header without a `Bearer` prefix.
 */
export const BOSTA_API_BASE = "https://app.bosta.co/api/v2";
export const BOSTA_BUSINESS_URL = "https://business.bosta.co";
export const BOSTA_EGYPT_COUNTRY_ID = "60e4482c7cb7d4bc4849c4d5";

export type BostaResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; code?: number };

export type BostaConfig = {
  pickupLocationId: string;
  pickupLocationName: string;
  packageType: BostaPackageType;
  packageWeight: number;
  codEnabled: boolean;
  defaultNotes: string;
  connectedAt: string;
  lastCheckedAt: string;
};

export const DEFAULT_BOSTA_CONFIG: BostaConfig = {
  pickupLocationId: "",
  pickupLocationName: "",
  packageType: "SMALL",
  packageWeight: 1,
  codEnabled: true,
  defaultNotes: "",
  connectedAt: "",
  lastCheckedAt: "",
};

export function parseBostaConfig(raw?: string | null): BostaConfig {
  let parsed: Record<string, unknown> = {};
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      parsed = value as Record<string, unknown>;
    }
  } catch {
    parsed = {};
  }

  const weight = Number(parsed.packageWeight);
  const packageType = isBostaPackageType(parsed.packageType)
    ? parsed.packageType
    : DEFAULT_BOSTA_CONFIG.packageType;

  return {
    pickupLocationId: String(parsed.pickupLocationId ?? "").slice(0, 100),
    pickupLocationName: String(parsed.pickupLocationName ?? "").slice(0, 200),
    packageType,
    packageWeight:
      Number.isFinite(weight) && weight > 0 && weight <= 100
        ? Math.round(weight * 100) / 100
        : DEFAULT_BOSTA_CONFIG.packageWeight,
    codEnabled: parsed.codEnabled !== false,
    defaultNotes: String(parsed.defaultNotes ?? "").slice(0, 300),
    connectedAt: String(parsed.connectedAt ?? ""),
    lastCheckedAt: String(parsed.lastCheckedAt ?? ""),
  };
}

export function serializeBostaConfig(config: BostaConfig): string {
  return JSON.stringify({
    pickupLocationId: config.pickupLocationId,
    pickupLocationName: config.pickupLocationName,
    packageType: isBostaPackageType(config.packageType)
      ? config.packageType
      : DEFAULT_BOSTA_CONFIG.packageType,
    packageWeight:
      Number.isFinite(config.packageWeight) && config.packageWeight > 0
        ? config.packageWeight
        : DEFAULT_BOSTA_CONFIG.packageWeight,
    codEnabled: config.codEnabled !== false,
    defaultNotes: String(config.defaultNotes || "").slice(0, 300),
    connectedAt: config.connectedAt,
    lastCheckedAt: config.lastCheckedAt,
  });
}

/** Never send the raw API key to the browser. */
export function maskBostaKey(key: string | null | undefined) {
  const value = String(key || "").trim();
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function isValidBostaKey(key: string | null | undefined) {
  const value = String(key || "").trim();
  return value.length >= 8 && value.length <= 300 && !/\s/.test(value);
}

/** Removes secret Bosta fields from any store object returned by an API. */
export function hideBostaSecrets<
  T extends { bostaApiKey?: string | null; bostaConfig?: string | null },
>(store: T) {
  const { bostaApiKey, bostaConfig, ...safe } = store;
  void bostaApiKey;
  void bostaConfig;
  return safe;
}

const BOSTA_ERROR_MESSAGES: Record<number, string> = {
  1061: "بعض الشحنات فشلت. راجع بيانات الشحنة وجرب تاني.",
  1073: "محتاج تضيف عنوان استلام (Pickup Location) في حساب بوسطة الأول.",
  2150: "بوسطة بتحتاج صور للمنتجات لما يكون فتح الشحنة مسموح.",
  2151: "رابط صورة المنتج غير صالح عند بوسطة.",
  3001: "المدينة غير موجودة في بوسطة. اختار مدينة تانية.",
  3002: "المنطقة غير موجودة في بوسطة.",
  3003: "الحي غير موجود في بوسطة. اختار حي تاني.",
  3004: "كود الشارع غير موجود في بوسطة.",
  3007: "مبلغ التحصيل أكبر من 30,000 جنيه، وبوسطة مش بتقبل أكتر من كده.",
  3009: "لازم تحدد المدينة والحي قبل إنشاء الشحنة.",
};

export function bostaErrorMessage(code?: number | string | null, fallback?: string | null) {
  const numeric = Number(code);
  if (Number.isFinite(numeric) && BOSTA_ERROR_MESSAGES[numeric]) {
    return BOSTA_ERROR_MESSAGES[numeric];
  }
  const message = String(fallback || "").trim();
  if (message && /[\u0600-\u06FF]/.test(message)) return message;
  return "بوسطة رفضت الطلب. راجع بيانات الشحنة وجرب تاني.";
}

type BostaEnvelope = {
  success?: boolean;
  message?: string;
  errorCode?: number | string;
  data?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  for (const key of ["list", "items", "results", "locations", "cities", "districts", "zones"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

async function bostaFetch<T>(
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<BostaResult<T>> {
  const key = String(apiKey || "").trim();
  if (!key) {
    return {
      ok: false,
      status: 401,
      error: "اربط حساب بوسطة الأول بإضافة مفتاح API.",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${BOSTA_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-By": "bee-panal",
        ...(init?.headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "مش قادرين نوصل لبوسطة دلوقتي. جرّب تاني بعد شوية.",
    };
  }

  let json: BostaEnvelope | null = null;
  try {
    json = (await response.json()) as BostaEnvelope;
  } catch {
    json = null;
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      status: response.status,
      error: "مفتاح API بتاع بوسطة غير صحيح أو منتهي. راجع المفتاح من لوحة بوسطة.",
    };
  }

  if (!response.ok || json?.success === false) {
    const code = Number(json?.errorCode);
    return {
      ok: false,
      status: response.status || 400,
      error: bostaErrorMessage(Number.isFinite(code) ? code : undefined, json?.message),
      code: Number.isFinite(code) ? code : undefined,
    };
  }

  const data = json && "data" in json ? json.data : json;
  return { ok: true, data: data as T };
}

export type BostaPickupLocation = {
  id: string;
  name: string;
  address: string;
};

export async function bostaListPickupLocations(apiKey: string) {
  const result = await bostaFetch<unknown>(apiKey, "/pickup-locations");
  if (!result.ok) return result;

  const locations: BostaPickupLocation[] = asArray(result.data)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const id = asString(record._id || record.id);
      if (!id) return null;
      const rawAddress = record.address;
      const addressRecord = asRecord(rawAddress);
      const address = typeof rawAddress === "string"
        ? rawAddress
        : addressRecord
          ? [asString(addressRecord.firstLine), asString(addressRecord.city)]
              .filter(Boolean)
              .join(" - ")
          : "";
      return {
        id,
        name: asString(record.name || record.locationName || record.label) || "فرع بوسطة",
        address,
      };
    })
    .filter((item): item is BostaPickupLocation => Boolean(item));

  return { ok: true as const, data: locations };
}

export type BostaCity = {
  id: string;
  name: string;
  code: string;
};

export async function bostaListCities(apiKey: string) {
  const result = await bostaFetch<unknown>(apiKey, "/cities");
  if (!result.ok) {
    // Only retry when the endpoint rejected the request shape (some accounts
    // require countryId). Network errors and 5xx responses are returned as-is
    // so we never stack two long timeouts.
    if (result.status === 400 || result.status === 404) {
      const retried = await bostaFetch<unknown>(
        apiKey,
        `/cities?countryId=${encodeURIComponent(BOSTA_EGYPT_COUNTRY_ID)}`
      );
      if (!retried.ok) return retried;
      return parseCities(retried.data);
    }
    return result;
  }
  return parseCities(result.data);
}

function parseCities(value: unknown) {
  const cities: BostaCity[] = asArray(value)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const id = asString(record._id || record.id);
      const name = asString(record.name);
      if (!id || !name) return null;
      return { id, name, code: asString(record.code) };
    })
    .filter((item): item is BostaCity => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return { ok: true as const, data: cities };
}

export type BostaDistrict = {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
};

export async function bostaListDistricts(apiKey: string, cityId: string) {
  const result = await bostaFetch<unknown>(
    apiKey,
    `/cities/${encodeURIComponent(cityId)}/districts`
  );
  if (!result.ok) return result;

  const districts: BostaDistrict[] = asArray(result.data)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      if (record.dropOffAvailability === false) return null;
      const id = asString(record.districtId || record._id || record.id);
      const name = asString(record.districtName || record.name);
      if (!id || !name) return null;
      return {
        id,
        name,
        zoneId: asString(record.zoneId),
        zoneName: asString(record.zoneName),
      };
    })
    .filter((item): item is BostaDistrict => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return { ok: true as const, data: districts };
}

export type BostaDeliveryState = {
  value: string;
  code: number;
};

function parseDeliveryState(value: unknown): BostaDeliveryState {
  if (typeof value === "string" || typeof value === "number") {
    const raw = String(value);
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && bostaStateFromCode(numeric)) {
      return { value: bostaStateFromCode(numeric), code: numeric };
    }
    return { value: raw, code: 0 };
  }

  const record = asRecord(value);
  if (!record) return { value: "", code: 0 };
  const code = Number(record.code ?? record.stateCode ?? 0) || 0;
  const label =
    asString(record.value || record.name || record.label) || bostaStateFromCode(code);
  return { value: label, code };
}

export type BostaDelivery = {
  id: string;
  trackingNumber: string;
  state: BostaDeliveryState;
  businessReference: string;
  cod: number;
};

function parseDelivery(value: unknown): BostaDelivery | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asString(record._id || record.id);
  const trackingNumber = asString(record.trackingNumber || record.trackingNumberString);
  if (!id && !trackingNumber) return null;
  return {
    id,
    trackingNumber,
    state: parseDeliveryState(record.state),
    businessReference: asString(record.businessReference),
    cod: Number(record.cod) || 0,
  };
}

export type BostaCreateInput = {
  apiKey: string;
  orderId: string;
  webhookUrl: string;
  receiverName: string;
  receiverPhone: string;
  city: string;
  cityId?: string;
  districtId?: string;
  districtName?: string;
  firstLine: string;
  secondLine?: string;
  cod: number;
  packageType: BostaPackageType;
  packageWeight: number;
  itemsCount: number;
  description: string;
  notes?: string;
  pickupLocationId?: string;
};

export async function bostaCreateDelivery(input: BostaCreateInput) {
  const fullName = input.receiverName.trim() || "عميل";
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "عميل";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const phone = normalizePhone(input.receiverPhone);

  const cod = Math.max(0, Math.round(Number(input.cod) || 0));

  const payload: Record<string, unknown> = {
    type: 10,
    cod,
    businessReference: input.orderId,
    notes: input.notes ? input.notes.slice(0, 500) : undefined,
    webhookUrl: input.webhookUrl,
    receiver: {
      firstName,
      lastName,
      phone,
    },
    dropOffAddress: {
      city: input.city,
      ...(input.cityId ? { cityId: input.cityId } : {}),
      ...(input.districtId ? { districtId: input.districtId } : {}),
      ...(!input.districtId && input.districtName
        ? { districtName: input.districtName }
        : {}),
      firstLine: input.firstLine,
      ...(input.secondLine ? { secondLine: input.secondLine } : {}),
    },
    specs: {
      packageType: input.packageType,
      packageDetails: {
        itemsCount: Math.max(1, Math.round(input.itemsCount || 1)),
        description: input.description.slice(0, 200) || "طلب من Bee Panal",
        weight: Math.max(0.1, Number(input.packageWeight) || 1),
      },
    },
    ...(input.pickupLocationId
      ? { businessLocationId: input.pickupLocationId }
      : {}),
  };

  const result = await bostaFetch<unknown>(input.apiKey, "/deliveries?apiVersion=1", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!result.ok) return result;

  const delivery = parseDelivery(result.data);
  if (!delivery || !delivery.trackingNumber) {
    return {
      ok: false as const,
      status: 502,
      error: "بوسطة أنشأت الشحنة لكن مرجعتش رقم تتبع. راجع لوحة بوسطة.",
    };
  }
  return { ok: true as const, data: delivery };
}

export async function bostaGetDelivery(apiKey: string, trackingNumber: string) {
  const result = await bostaFetch<unknown>(
    apiKey,
    `/deliveries/${encodeURIComponent(trackingNumber)}`
  );
  if (!result.ok) return result;

  const delivery = parseDelivery(result.data);
  if (!delivery) {
    return {
      ok: false as const,
      status: 404,
      error: "مش قادرين نقرأ بيانات الشحنة من بوسطة.",
    };
  }
  return { ok: true as const, data: delivery };
}

export async function bostaTerminateDelivery(apiKey: string, deliveryId: string) {
  const id = String(deliveryId || "").trim();
  if (!id) {
    return { ok: false as const, status: 400, error: "رقم الشحنة غير صالح." };
  }

  const primary = await bostaFetch<unknown>(apiKey, `/deliveries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (primary.ok) return primary;

  if (primary.status === 404 || primary.status === 405) {
    return bostaFetch<unknown>(
      apiKey,
      `/deliveries/business/${encodeURIComponent(id)}/terminate`,
      { method: "DELETE" }
    );
  }

  return primary;
}
