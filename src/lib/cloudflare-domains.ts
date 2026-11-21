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

export type SaasQuotaStatus = {
  enabled: boolean;
  quota: number;
  used: number;
  available: number;
  error?: "not_configured" | "not_enabled" | "api_error";
  message?: string;
};

export type CustomDomainDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
};

export type FallbackOriginStatus = {
  ok: boolean;
  origin: string;
  status: string;
  error?: "not_configured" | "not_enabled" | "not_set" | "api_error";
  message?: string;
};

/** Reads how many custom hostnames the zone is allowed to use. */
export async function getSaasQuota(): Promise<SaasQuotaStatus> {
  if (!TOKEN || !ZONE_ID) {
    return {
      enabled: false,
      quota: 0,
      used: 0,
      available: 0,
      error: "not_configured",
    };
  }

  const result = await call<Record<string, unknown>>(
    `/zones/${encodeURIComponent(ZONE_ID)}/custom_hostnames/quota`
  );

  if (!result.ok) {
    if (isSaasQuotaError(result.errors)) {
      return { enabled: false, quota: 0, used: 0, available: 0, error: "not_enabled" };
    }
    return {
      enabled: false,
      quota: 0,
      used: 0,
      available: 0,
      error: "api_error",
      message: result.errors?.[0]?.message,
    };
  }

  const quota = Number(result.data?.quota ?? result.data?.total ?? result.data?.limit ?? 0) || 0;
  const used = Number(result.data?.used ?? result.data?.usage ?? 0) || 0;

  if (quota <= 0) {
    return { enabled: false, quota: 0, used, available: 0, error: "not_enabled" };
  }

  return {
    enabled: true,
    quota,
    used,
    available: Math.max(0, quota - used),
  };
}

/** Returns the proxied DNS record that custom hostnames route through. */
export async function getCustomDomainDnsRecord(): Promise<{
  ok: boolean;
  record: CustomDomainDnsRecord | null;
  message?: string;
}> {
  if (!TOKEN || !ZONE_ID) return { ok: false, record: null, message: "not_configured" };

  const result = await call<Array<Record<string, unknown>>>(
    `/zones/${encodeURIComponent(ZONE_ID)}/dns_records?name=${encodeURIComponent(CUSTOM_DOMAIN_CNAME)}`
  );
  if (!result.ok) {
    return { ok: false, record: null, message: result.errors?.[0]?.message };
  }

  const match =
    result.data?.find((item) => item.name === CUSTOM_DOMAIN_CNAME) || null;
  if (!match) return { ok: true, record: null };

  return {
    ok: true,
    record: {
      id: String(match.id || ""),
      type: String(match.type || ""),
      name: String(match.name || ""),
      content: String(match.content || ""),
      proxied: match.proxied === true,
    },
  };
}

export async function getFallbackOrigin(): Promise<FallbackOriginStatus> {
  if (!TOKEN || !ZONE_ID) {
    return { ok: false, origin: "", status: "", error: "not_configured" };
  }

  const result = await call<{ origin?: string; status?: string }>(
    `/zones/${encodeURIComponent(ZONE_ID)}/custom_hostnames/fallback_origin`
  );
  if (result.ok) {
    return {
      ok: true,
      origin: String(result.data?.origin || ""),
      status: String(result.data?.status || ""),
    };
  }
  if (isSaasQuotaError(result.errors)) {
    return { ok: false, origin: "", status: "", error: "not_enabled" };
  }
  if (result.status === 404) {
    return { ok: false, origin: "", status: "", error: "not_set" };
  }
  return {
    ok: false,
    origin: "",
    status: "",
    error: "api_error",
    message: result.errors?.[0]?.message,
  };
}

/** Snapshot used by the admin infrastructure card. */
export async function customDomainInfraStatus() {
  const [saas, dns, fallback] = await Promise.all([
    getSaasQuota(),
    getCustomDomainDnsRecord(),
    getFallbackOrigin(),
  ]);

  return {
    configured: cloudflareDomainsConfigured(),
    cnameTarget: CUSTOM_DOMAIN_CNAME,
    saas,
    dns: {
      exists: Boolean(dns.record),
      proxied: Boolean(dns.record?.proxied),
      type: dns.record?.type || "",
      content: dns.record?.content || "",
      error: dns.ok ? undefined : dns.message,
    },
    fallback: {
      origin: fallback.origin,
      status: fallback.status,
      ok: fallback.ok,
      error: fallback.error,
    },
  };
}

export type InfraSetupResult = {
  dns: "created" | "updated" | "exists" | "error";
  fallback: "active" | "pending" | "error" | "disabled";
  saasDisabled: boolean;
  message: string;
};

/**
 * One-time setup: creates the proxied `customers` DNS record and designates it
 * as the Cloudflare for SaaS fallback origin. Safe to run repeatedly.
 */
export async function ensureCustomDomainInfrastructure(): Promise<InfraSetupResult> {
  if (!TOKEN || !ZONE_ID) {
    return {
      dns: "error",
      fallback: "error",
      saasDisabled: false,
      message: "إعدادات Cloudflare مش متظبطة على السيرفر.",
    };
  }

  const quota = await getSaasQuota();
  const dns = await getCustomDomainDnsRecord();

  let dnsStatus: InfraSetupResult["dns"] = "error";
  let dnsError = "";

  if (dns.ok && dns.record) {
    if (dns.record.proxied) {
      dnsStatus = "exists";
    } else {
      const updated = await call<unknown>(
        `/zones/${encodeURIComponent(ZONE_ID)}/dns_records/${encodeURIComponent(dns.record.id)}`,
        { method: "PATCH", body: JSON.stringify({ proxied: true }) }
      );
      if (updated.ok) {
        dnsStatus = "updated";
      } else {
        dnsError = updated.errors?.[0]?.message || "";
      }
    }
  } else if (dns.ok && !dns.record) {
    const created = await call<unknown>(
      `/zones/${encodeURIComponent(ZONE_ID)}/dns_records`,
      {
        method: "POST",
        body: JSON.stringify({
          type: "AAAA",
          name: CUSTOM_DOMAIN_CNAME,
          content: "100::",
          proxied: true,
          ttl: 1,
          comment: "Bee Panal custom domains fallback origin",
        }),
      }
    );
    if (created.ok) {
      dnsStatus = "created";
    } else {
      dnsError = created.errors?.[0]?.message || "";
    }
  } else {
    dnsError = dns.message || "";
  }

  if (!quota.enabled) {
    return {
      dns: dnsStatus,
      fallback: "disabled",
      saasDisabled: true,
      message:
        dnsStatus === "error"
          ? `مش قادرين ننشئ سجل DNS: ${dnsError || "راجع صلاحيات التوكن"}. وكمان Cloudflare for SaaS لسه مش مفعّل.`
          : "سجل DNS جاهز. لسه محتاج تفعيل Cloudflare for SaaS من لوحة Cloudflare، وبعدها اضغط تجهيز البنية التحتية تاني.",
    };
  }

  const updated = await call<{ origin?: string; status?: string }>(
    `/zones/${encodeURIComponent(ZONE_ID)}/custom_hostnames/fallback_origin`,
    {
      method: "PUT",
      body: JSON.stringify({ origin: CUSTOM_DOMAIN_CNAME }),
    }
  );

  if (!updated.ok) {
    if (isSaasQuotaError(updated.errors)) {
      return {
        dns: dnsStatus,
        fallback: "disabled",
        saasDisabled: true,
        message: "Cloudflare for SaaS لسه مش مفعّل على الزون.",
      };
    }
    return {
      dns: dnsStatus,
      fallback: "error",
      saasDisabled: false,
      message: updated.errors?.[0]?.message || "مش قادرين نضبط Fallback Origin.",
    };
  }

  const status = String(updated.data?.status || "pending");

  return {
    dns: dnsStatus,
    fallback: status === "active" ? "active" : "pending",
    saasDisabled: false,
    message:
      status === "active"
        ? "البنية التحتية جاهزة ✅ تقدر تضيف دومينات التجار."
        : "اتضبط الـ Fallback Origin. Cloudflare لسه بتفعّله — استنى دقيقة وجرّب التحقق تاني.",
  };
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

type CloudflareEnvelope = {
  success?: boolean;
  result?: unknown;
  errors?: Array<{ code?: number; message?: string }>;
};

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
    let payload: CloudflareEnvelope | null = null;
    try {
      payload = (await res.json()) as CloudflareEnvelope;
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

export function cloudflareDomainError(
  data: { errors?: Array<{ code?: number; message?: string }> } | null | undefined
) {
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
