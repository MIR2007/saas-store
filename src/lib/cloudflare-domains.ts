import { PLATFORM_DOMAIN } from "@/lib/domains";

const API = "https://api.cloudflare.com/client/v4";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "";

/**
 * Fallback origin for Cloudflare for SaaS custom hostnames. Merchants point a
 * CNAME (or ALIAS/ANAME at the apex) at this hostname.
 */
export const CUSTOM_DOMAIN_CNAME = `customers.${PLATFORM_DOMAIN}`;

export type CloudflareCustomHostname = {
  id: string;
  hostname: string;
  status?: string;
  ssl?: {
    status?: string;
    method?: string;
    type?: string;
    validation_records?: Array<{
      status?: string;
      txt_name?: string;
      txt_value?: string;
    }>;
    validation_errors?: Array<{ message?: string }>;
  };
  ownership_verification?: {
    type?: string;
    name?: string;
    value?: string;
  };
  verification_errors?: string[];
};

export type DomainDns = {
  a: string[];
  cname: string;
};

export type DomainVerificationRecord = {
  type: string;
  domain: string;
  value: string;
  reason?: string;
};

const DEFAULT_DNS: DomainDns = { a: [], cname: CUSTOM_DOMAIN_CNAME };

/** Recommended DNS records for a merchant domain. */
export function recommendedDns(): DomainDns {
  return { ...DEFAULT_DNS };
}

export function cloudflareDomainsConfigured() {
  return Boolean(TOKEN && ZONE_ID);
}

/**
 * Cloudflare for SaaS is not enabled for the zone/account yet. The API answers
 * 403 with error 1404 ("No quota has been allocated...") until it is activated.
 */
export function isSaasQuotaError(errors?: Array<{ code?: number; message?: string }>) {
  return Boolean(errors?.some((error) => error.code === 1404));
}

/** Quick probe used by the dashboard to hide the automated flow until SaaS is on. */
export async function saasAvailable() {
  if (!TOKEN || !ZONE_ID) return false;
  const probe = await call<CloudflareCustomHostname[]>(
    `/zones/${encodeURIComponent(ZONE_ID)}/custom_hostnames?per_page=1`
  );
  if (probe.ok) return true;
  if (isSaasQuotaError(probe.errors)) return false;
  // Permission/network hiccups should not hide the normal flow.
  return true;
}

/** Convert a Cloudflare custom hostname into the TXT records the merchant must add. */
export function verificationRecords(record: CloudflareCustomHostname | null | undefined) {
  const records: DomainVerificationRecord[] = [];
  const ownership = record?.ownership_verification;
  if (ownership?.name && ownership?.value) {
    records.push({
      type: (ownership.type || "TXT").toUpperCase(),
      domain: ownership.name,
      value: ownership.value,
      reason: "ownership",
    });
  }
  for (const item of record?.ssl?.validation_records || []) {
    if (item.txt_name && item.txt_value) {
      records.push({
        type: "TXT",
        domain: item.txt_name,
        value: item.txt_value,
        reason: "ssl",
      });
    }
  }
  return records;
}

export function isCustomHostnameActive(record: CloudflareCustomHostname | null | undefined) {
  if (!record) return false;
  const hostnameActive = record.status === "active";
  const sslActive = record.ssl?.status === "active";
  return hostnameActive && sslActive;
}

async function call<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; errors?: Array<{ code?: number; message?: string }> }> {
  if (!TOKEN || !ZONE_ID) return { ok: false, status: 503, data: null };
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    return {
      ok: res.ok && payload?.success !== false,
      status: res.status,
      data: (payload?.result as T) ?? null,
      errors: payload?.errors,
    };
  } catch {
    return { ok: false, status: 502, data: null };
  }
}

export async function getCustomHostname(domain: string) {
  const list = await call<CloudflareCustomHostname[]>(
    `/zones/${encodeURIComponent(ZONE_ID)}/custom_hostnames?hostname=${encodeURIComponent(domain)}`
  );
  if (!list.ok) return { ...list, data: null as CloudflareCustomHostname | null };
  const match = list.data?.find((item) => item.hostname === domain) || null;
  return { ok: Boolean(match), status: match ? 200 : 404, data: match, errors: list.errors };
}

export async function addCustomHostname(domain: string) {
  const created = await call<CloudflareCustomHostname>(
    `/zones/${encodeURIComponent(ZONE_ID)}/custom_hostnames`,
    {
      method: "POST",
      body: JSON.stringify({
        hostname: domain,
        ssl: {
          method: "txt",
          type: "dv",
          settings: { min_tls_version: "1.2" },
        },
      }),
    }
  );

  if (created.ok) return created;

  // Already attached to this zone: return the existing record instead.
  const existing = await getCustomHostname(domain);
  if (existing.ok) return existing;

  return created;
}

export async function removeCustomHostname(domain: string) {
  const existing = await getCustomHostname(domain);
  if (!existing.ok || !existing.data) return existing;
  return call<{ id?: string }>(
    `/zones/${encodeURIComponent(ZONE_ID)}/custom_hostnames/${encodeURIComponent(existing.data.id)}`,
    { method: "DELETE" }
  );
}

export function cloudflareDomainError(data: any) {
  const code = data?.errors?.[0]?.code;
  const message = data?.errors?.[0]?.message;
  const map: Record<number, string> = {
    1404: "ربط الدومينات المخصصة هيتفعّل قريبًا. الدومين اتحفظ، وفريق Bee Panal هيكمّل التفعيل.",
    1406: "الدومين ده مربوط بحساب تاني. لازم يتشال من الحساب القديم الأول.",
    1414: "الدومين ده مش صالح أو مش مدعوم.",
    1415: "الدومين ده موجود بالفعل على Cloudflare.",
  };
  if (code && map[code]) return map[code];
  return message || "مش قادرين نضيف الدومين دلوقتي. جرّب تاني.";
}
