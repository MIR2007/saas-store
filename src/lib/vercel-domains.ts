const API = "https://api.vercel.com";
const TOKEN = process.env.VERCEL_API_TOKEN || "";
const PROJECT = process.env.VERCEL_PROJECT_ID || "prj_OAE14TOW42HNTg2hIxNqAoNpRWG0";
const TEAM = process.env.VERCEL_TEAM_ID || "team_taPPVLLc7sCJ5vp2bXEp6V7w";

export type VercelDomain = {
  name: string;
  verified?: boolean;
  configuredBy?: string | null;
  verification?: Array<{
    type: string;
    domain?: string;
    value?: string;
    reason?: string;
  }>;
  error?: { code?: string; message?: string };
};

export type VercelDomainConfig = {
  configuredBy?: string | null;
  misconfigured?: boolean;
  recommendedIPv4?: Array<{ rank: number; value: string[] }>;
  recommendedCNAME?: Array<{ rank: number; value: string }>;
  aValues?: string[];
  cnames?: string[];
  nameservers?: string[];
};

const DEFAULT_DNS = {
  a: ["216.198.79.1", "64.29.17.1"],
  cname: "cname.vercel-dns.com",
};

/** Recommended DNS records for a domain, with safe defaults if Vercel is unreachable. */
export function recommendedDns(config: VercelDomainConfig | null | undefined) {
  const a = config?.recommendedIPv4?.find((item) => item.rank === 1)?.value?.filter(Boolean) || [];
  const cname = config?.recommendedCNAME?.find((item) => item.rank === 1)?.value?.replace(/\.$/, "");
  return {
    a: a.length > 0 ? a : DEFAULT_DNS.a,
    cname: cname || DEFAULT_DNS.cname,
  };
}

function qs() {
  return TEAM ? `?teamId=${encodeURIComponent(TEAM)}` : "";
}

async function call<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null }> {
  if (!TOKEN) return { ok: false, status: 503, data: null };
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

export function vercelDomainsConfigured() {
  return Boolean(TOKEN);
}

export async function addProjectDomain(domain: string) {
  // The `/alias` endpoint is the one that accepts the CLI's OAuth token
  // (`POST /v10/projects/{project}/domains` returns 403 for it).
  const added = await call<VercelDomain>(`/projects/${encodeURIComponent(PROJECT)}/alias${qs()}`, {
    method: "POST",
    body: JSON.stringify({ target: "PRODUCTION", domain }),
  });
  if (!added.ok) return added;

  // The alias payload is minimal; fetch the full domain record so the UI can
  // show DNS verification instructions.
  const details = await getProjectDomain(domain);
  if (details.ok && details.data) {
    return { ok: true, status: added.status, data: details.data };
  }
  return added;
}

export async function getProjectDomain(domain: string) {
  const direct = await call<VercelDomain>(
    `/v9/projects/${encodeURIComponent(PROJECT)}/domains/${encodeURIComponent(domain)}${qs()}`,
    { method: "GET" }
  );
  if (direct.ok || direct.status !== 404) return direct;

  // Vercel returns 404 for domains that are attached to the project but still
  // waiting for DNS. Fall back to the project domain list so callers can still
  // read the verification state.
  const list = await call<{ domains?: VercelDomain[] }>(
    `/v9/projects/${encodeURIComponent(PROJECT)}/domains${qs()}`,
    { method: "GET" }
  );
  const match = list.data?.domains?.find((item) => item.name === domain);
  if (match) return { ok: true, status: 200, data: match };
  return direct;
}

export async function getDomainConfig(domain: string) {
  return call<VercelDomainConfig>(
    `/v6/domains/${encodeURIComponent(domain)}/config${qs()}`,
    { method: "GET" }
  );
}

export async function removeProjectDomain(domain: string) {
  return call<{ error?: { code?: string } }>(
    `/v9/projects/${encodeURIComponent(PROJECT)}/domains/${encodeURIComponent(domain)}${qs()}`,
    { method: "DELETE" }
  );
}
