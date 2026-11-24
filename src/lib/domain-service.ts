import { prisma } from "@/lib/prisma";
import { checkDomainDns, pointsToRoutingTarget } from "@/lib/dns-verify";
import {
  parseDomainState,
  serializeDomainState,
  type DomainDnsState,
  type DomainState,
} from "@/lib/domains";
import {
  addCustomHostname,
  cloudflareDomainsConfigured,
  getCustomHostname,
  isCustomHostnameActive,
  isSaasQuotaError,
  verificationRecords,
} from "@/lib/cloudflare-domains";
import {
  attachProxyDomain,
  detachProxyDomain,
  probeProxyDomain,
  proxyModeEnabled,
} from "@/lib/domain-proxy";

export const DOMAIN_QUOTA_WARNING =
  "ربط الدومينات المخصصة هيتفعّل قريبًا. الدومين اتحفظ، وفريق Bee Panal هيكمّل التفعيل.";
export const DOMAIN_TOKEN_WARNING =
  "الربط التلقائي عبر Cloudflare مش متاح حاليًا. الدومين اتحفظ، وفريق Bee Panal هيكمّل التفعيل.";

export type DomainRefreshResult = {
  state: DomainState;
  status: string;
  checks: DomainDnsState;
  automated: boolean;
  warning: string;
  cloudflareActive: boolean;
};

/**
 * Re-checks DNS ownership/routing and, when Cloudflare for SaaS is available,
 * refreshes or attaches the custom hostname. Persists the resulting status.
 */
export async function refreshDomainConnection(store: {
  id: string;
  customDomain: string | null;
  customDomainStatus: string;
  domainToken: string;
  domainVerification: string;
}): Promise<DomainRefreshResult | null> {
  if (!store.customDomain) return null;

  const state = parseDomainState(store.domainVerification);
  const checks = await checkDomainDns({
    domain: store.customDomain,
    token: store.domainToken,
  });

  const proxyMode = proxyModeEnabled();
  let automated = proxyMode || cloudflareDomainsConfigured();
  let warning = "";
  let cloudflareActive = false;
  let proxyActive = false;

  if (proxyMode) {
    // Free mode: once DNS is correct, attach the domain to the edge proxy and
    // mark it active only after HTTPS actually answers through the proxy.
    if (checks.ownership && checks.routing) {
      const hosts = [store.customDomain];
      const www = `www.${store.customDomain}`;
      if (await pointsToRoutingTarget(www)) hosts.push(www);
      await attachProxyDomain(hosts);
      proxyActive = await probeProxyDomain(store.customDomain);
    } else if (store.customDomainStatus === "active" || store.customDomainStatus === "verified") {
      // DNS moved away from the proxy: drop the alias so it cannot block
      // certificate renewals for other stores.
      await detachProxyDomain(store.customDomain);
    }
  } else if (automated) {
    const existing = await getCustomHostname(store.customDomain);
    if (existing.ok && existing.data) {
      state.cloudflare = verificationRecords(existing.data);
      cloudflareActive = isCustomHostnameActive(existing.data);
    } else if (isSaasQuotaError(existing.errors)) {
      automated = false;
      warning = DOMAIN_QUOTA_WARNING;
    } else if (existing.status === 404) {
      // Attach now if Cloudflare for SaaS became available after the domain was
      // saved. Quota errors are expected until the feature is activated.
      const added = await addCustomHostname(store.customDomain);
      if (added.ok && added.data) {
        state.cloudflare = verificationRecords(added.data);
        cloudflareActive = isCustomHostnameActive(added.data);
      } else if (isSaasQuotaError(added.errors)) {
        automated = false;
        warning = DOMAIN_QUOTA_WARNING;
      } else {
        warning = DOMAIN_TOKEN_WARNING;
      }
    } else if (existing.status === 401 || existing.status === 403) {
      automated = false;
      warning = DOMAIN_TOKEN_WARNING;
    }
  }

  let status = store.customDomainStatus || "pending";
  if (cloudflareActive || proxyActive) {
    status = "active";
  } else if (proxyMode && !(checks.ownership && checks.routing)) {
    // In proxy mode the DNS check is authoritative: a domain moved away from
    // the proxy must stop serving the store.
    status = "pending";
  } else if (status !== "active") {
    status = checks.ownership && checks.routing ? "verified" : "pending";
  }

  const verifiedAt =
    status === "verified" || status === "active"
      ? state.verifiedAt || new Date().toISOString()
      : null;

  const nextState: DomainState = {
    cloudflare: state.cloudflare || [],
    dns: checks,
    verifiedAt,
  };

  await prisma.store.update({
    where: { id: store.id },
    data: {
      customDomainStatus: status,
      domainVerification: serializeDomainState(nextState),
    },
  });

  return { state: nextState, status, checks, automated, warning, cloudflareActive };
}

export function domainStatusMessage(status: string, checks: DomainDnsState) {
  if (status === "active") return "تمام! الدومين متفعّل وجاهز ✅";
  if (checks.error) return checks.error;
  if (!checks.ownership && !checks.routing) {
    return "لسه مش لاقيين سجلات DNS. ضيف سجل TXT للتحقق وسجل CNAME لتوجيه الدومين، وبعدها جرّب تاني بعد شوية.";
  }
  if (!checks.ownership) {
    return "سجل الـ CNAME ظاهر، بس سجل التحقق TXT لسه مش موجود أو قيمته مختلفة.";
  }
  if (!checks.routing) {
    return "الملكية اتأكدت ✅ بس الدومين لسه مش موجه لـ Bee Panal. راجع سجل الـ CNAME.";
  }
  if (proxyModeEnabled()) {
    return "الدومين اتأكد ✅ بنجهّز شهادة الأمان (SSL) دلوقتي. ده بياخد من دقيقة لـ 15 دقيقة، دوس «تحقق الآن» تاني بعدها.";
  }
  return "الدومين اتأكد وجاهز. فريق Bee Panal هيكمّل تفعيل شهادة الأمان (SSL) وتشغيل الدومين.";
}
