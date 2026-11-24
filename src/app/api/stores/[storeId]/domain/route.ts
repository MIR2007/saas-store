import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  cleanDomainInput,
  domainVerificationHost,
  isApexDomain,
  isValidDomain,
  parseDomainState,
  serializeDomainState,
  subdomainFor,
  PLATFORM_DOMAIN,
  type DomainState,
} from "@/lib/domains";
import {
  addCustomHostname,
  cloudflareDomainError,
  cloudflareDomainsConfigured,
  getCustomHostname,
  isCustomHostnameActive,
  isSaasQuotaError,
  recommendedDns,
  removeCustomHostname,
  saasAvailable,
  verificationRecords,
} from "@/lib/cloudflare-domains";
import {
  DOMAIN_QUOTA_WARNING,
  DOMAIN_TOKEN_WARNING,
  domainStatusMessage,
  refreshDomainConnection,
} from "@/lib/domain-service";
import {
  detachProxyDomain,
  domainMode,
  proxyModeEnabled,
  routingRecord,
  routingTarget,
} from "@/lib/domain-proxy";
import { z } from "zod";

/** Removes a domain from whichever edge (Cloudflare for SaaS or the free proxy) serves it. */
async function detachDomain(domain: string) {
  try {
    if (proxyModeEnabled()) await detachProxyDomain(domain);
    else await removeCustomHostname(domain);
  } catch {
    // The local record is still updated even if the edge cleanup fails.
  }
}

const schema = z.object({ domain: z.string().min(3) });

const QUOTA_WARNING = DOMAIN_QUOTA_WARNING;
const TOKEN_WARNING = DOMAIN_TOKEN_WARNING;

type StoreDomainRecord = {
  id: string;
  slug: string;
  customDomain: string | null;
  customDomainStatus: string;
  domainToken: string;
  domainVerification: string;
};

async function ownsStore(storeId: string, userId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId } });
}

function makeToken() {
  return `beepanal-verify=${randomBytes(16).toString("hex")}`;
}

function recordsFor(domain: string, token: string) {
  const apex = isApexDomain(domain);
  return {
    apex,
    txt: {
      type: "TXT",
      name: domainVerificationHost(domain),
      value: token,
    },
    cname: routingRecord(domain, apex),
    www: {
      type: "CNAME",
      name: `www.${domain}`,
      value: routingTarget(),
    },
  };
}

function payload(
  store: StoreDomainRecord,
  state: DomainState,
  extras: { automated: boolean; warning?: string }
) {
  const token = store.domainToken || "";
  return {
    subdomain: subdomainFor(store.slug),
    subdomainUrl: `https://${subdomainFor(store.slug)}`,
    customDomain: store.customDomain,
    status: store.customDomainStatus,
    verification: state.cloudflare || [],
    checks: state.dns || null,
    verifiedAt: state.verifiedAt || null,
    automated: extras.automated,
    warning: extras.warning || "",
    platformDomain: PLATFORM_DOMAIN,
    mode: domainMode(),
    dns: proxyModeEnabled() ? { a: [], cname: routingTarget() } : recommendedDns(),
    token,
    records: store.customDomain && token ? recordsFor(store.customDomain, token) : null,
  };
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  let store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  // Legacy rows can have a domain without a verification token.
  if (store.customDomain && !store.domainToken) {
    store = await prisma.store.update({
      where: { id: storeId },
      data: { domainToken: makeToken() },
    });
  }

  const state = parseDomainState(store.domainVerification);
  let status = store.customDomainStatus || (store.customDomain ? "pending" : "none");
  if (store.customDomain && status === "none") status = "pending";
  let automated = proxyModeEnabled() || cloudflareDomainsConfigured();
  const warning = "";

  if (proxyModeEnabled()) {
    // Status is refreshed by PATCH (DNS + HTTPS probe); nothing to poll here.
  } else if (store.customDomain && automated) {
    const hostname = await getCustomHostname(store.customDomain);
    if (hostname.ok && hostname.data) {
      state.cloudflare = verificationRecords(hostname.data);
      if (isCustomHostnameActive(hostname.data)) status = "active";
    } else if (isSaasQuotaError(hostname.errors)) {
      automated = false;
    }
  } else if (automated) {
    automated = await saasAvailable();
  }

  if (status !== store.customDomainStatus) {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        customDomainStatus: status,
        domainVerification: serializeDomainState(state),
      },
    });
  }

  return NextResponse.json(
    payload({ ...store, customDomainStatus: status }, state, { automated, warning })
  );
}

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "اكتب الدومين الأول" }, { status: 400 });

  const domain = cleanDomainInput(parsed.data.domain);
  if (!isValidDomain(domain)) {
    return NextResponse.json(
      { error: "صيغة الدومين غير صحيحة. اكتبها بالشكل ده: mystore.com" },
      { status: 400 }
    );
  }

  const taken = await prisma.store.findFirst({
    where: { customDomain: domain, NOT: { id: storeId } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "الدومين ده مربوط بمتجر تاني على Bee Panal." }, { status: 409 });
  }

  // Replacing a domain: detach the previous one from the edge first.
  if (store.customDomain && store.customDomain !== domain) {
    await detachDomain(store.customDomain);
  }

  const token = makeToken();
  let cloudflareRecords: DomainState["cloudflare"] = [];
  let status = "pending";
  let automated = false;
  let warning = "";

  if (proxyModeEnabled()) {
    // Free proxy mode: the domain is attached to the proxy after DNS verification (PATCH).
    automated = true;
  } else {
    const added = await addCustomHostname(domain);
    if (added.ok && added.data) {
      automated = true;
      cloudflareRecords = verificationRecords(added.data);
      if (isCustomHostnameActive(added.data)) status = "active";
    } else if (isSaasQuotaError(added.errors)) {
      warning = QUOTA_WARNING;
    } else if (added.status === 503) {
      warning = "الإضافة التلقائية غير مفعّلة حاليًا. الدومين اتحفظ، وفريق Bee Panal هيفعّله لك.";
    } else if (added.status === 401 || added.status === 403) {
      // The stored Cloudflare token is missing/expired. Save the domain anyway so
      // the merchant sees the DNS instructions and support can attach it manually.
      warning = TOKEN_WARNING;
    } else {
      return NextResponse.json({ error: cloudflareDomainError(added) }, { status: 400 });
    }
  }

  const state: DomainState = {
    cloudflare: cloudflareRecords,
    dns: undefined,
    verifiedAt: status === "active" ? new Date().toISOString() : null,
  };

  const updated = await prisma.store.update({
    where: { id: storeId },
    data: {
      customDomain: domain,
      customDomainStatus: status,
      domainToken: token,
      domainVerification: serializeDomainState(state),
    },
  });

  return NextResponse.json(
    payload(updated, state, { automated, warning })
  );
}

export async function PATCH(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  let store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!store.customDomain) {
    return NextResponse.json({ error: "مفيش دومين مخصص محفوظ" }, { status: 400 });
  }

  if (!store.domainToken) {
    store = await prisma.store.update({
      where: { id: storeId },
      data: { domainToken: makeToken() },
    });
  }

  const refreshed = await refreshDomainConnection(store);
  if (!refreshed) {
    return NextResponse.json({ error: "مفيش دومين مخصص محفوظ" }, { status: 400 });
  }

  const updated = { ...store, customDomainStatus: refreshed.status };

  return NextResponse.json({
    ...payload(updated, refreshed.state, {
      automated: refreshed.automated,
      warning: refreshed.warning,
    }),
    verified: refreshed.status !== "pending",
    active: refreshed.status === "active",
    message: domainStatusMessage(refreshed.status, refreshed.checks),
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  if (store.customDomain) {
    await detachDomain(store.customDomain);
  }

  await prisma.store.update({
    where: { id: storeId },
    data: {
      customDomain: null,
      customDomainStatus: "none",
      domainToken: "",
      domainVerification: "",
    },
  });

  return NextResponse.json({ ok: true });
}
