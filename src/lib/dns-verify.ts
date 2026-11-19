import { CUSTOM_DOMAIN_CNAME } from "@/lib/cloudflare-domains";
import { domainVerificationHost, normalizeHost, type DomainDnsState } from "@/lib/domains";

type DohAnswer = { name?: string; type?: number; data?: string };

type DohResult = {
  status: number;
  answers: DohAnswer[];
  ok: boolean;
};

const DOH_ENDPOINTS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
];

/**
 * Small DNS-over-HTTPS client. Cloudflare Workers cannot use `node:dns`, and
 * DoH works the same locally and in production.
 */
async function lookup(name: string, type: "TXT" | "CNAME" | "A" | "AAAA"): Promise<DohResult> {
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set("name", name);
      url.searchParams.set("type", type);
      const response = await fetch(url, {
        headers: { accept: "application/dns-json" },
        cache: "no-store",
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as { Status?: number; Answer?: DohAnswer[] };
      return {
        status: typeof payload.Status === "number" ? payload.Status : 0,
        answers: Array.isArray(payload.Answer) ? payload.Answer : [],
        ok: true,
      };
    } catch {
      // Try the next resolver.
    }
  }
  return { status: -1, answers: [], ok: false };
}

function normalizeTxt(value: string) {
  return value
    .replace(/^"+|"+$/g, "")
    .replace(/"\s+"/g, "")
    .trim();
}

function cleanTarget(value: string | undefined) {
  return normalizeHost((value || "").trim());
}

/**
 * Verifies both parts of a custom domain connection:
 *  1. Ownership: TXT at `_beepanal-verify.<domain>` matches the stored token.
 *  2. Routing: the domain points at the Bee Panal custom-domain hostname.
 *
 * Routing can be a CNAME, or (at the apex) a flattened/ALIAS record that
 * resolves to the same Cloudflare addresses as the platform target.
 */
export async function checkDomainDns({
  domain,
  token,
}: {
  domain: string;
  token: string;
}): Promise<DomainDnsState> {
  const host = normalizeHost(domain);
  const txtName = domainVerificationHost(host);
  const target = normalizeHost(CUSTOM_DOMAIN_CNAME);
  const checkedAt = new Date().toISOString();

  if (!host || !token) {
    return {
      ownership: false,
      routing: false,
      checkedAt,
      txtName,
      cnameTarget: target,
      error: "بيانات التحقق ناقصة",
    };
  }

  const [txt, cname, platformA, domainA] = await Promise.all([
    lookup(txtName, "TXT"),
    lookup(host, "CNAME"),
    lookup(target, "A"),
    lookup(host, "A"),
  ]);

  if (!txt.ok) {
    return {
      ownership: false,
      routing: false,
      checkedAt,
      txtName,
      cnameTarget: target,
      error: "مش قادرين نسأل سيرفرات DNS دلوقتي. جرّب تاني بعد شوية.",
    };
  }

  const txtValues = txt.answers
    .filter((answer) => answer.type === 16)
    .map((answer) => normalizeTxt(answer.data || ""));
  const ownership = txtValues.some((value) => value === token || value.includes(token));

  const cnameFound =
    cname.answers.find((answer) => answer.type === 5)?.data?.replace(/\.$/, "") || null;
  const cnameMatches = Boolean(cnameFound && cleanTarget(cnameFound) === target);

  // Apex domains usually cannot use a CNAME. Accept a flattened record when
  // the domain resolves to the same addresses as the platform target.
  const platformIps = platformA.answers
    .filter((answer) => answer.type === 1 && answer.data)
    .map((answer) => answer.data as string);
  const domainIps = domainA.answers
    .filter((answer) => answer.type === 1 && answer.data)
    .map((answer) => answer.data as string);
  const flattenedMatches =
    platformIps.length > 0 && domainIps.some((ip) => platformIps.includes(ip));

  return {
    ownership,
    routing: cnameMatches || flattenedMatches,
    checkedAt,
    txtName,
    cnameTarget: target,
    cnameFound: cnameFound ? cleanTarget(cnameFound) : null,
    aRecords: domainIps,
  };
}
