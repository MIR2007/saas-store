import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cleanDomainInput, isValidDomain, subdomainFor, PLATFORM_DOMAIN } from "@/lib/domains";
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
import { z } from "zod";

const schema = z.object({ domain: z.string().min(3) });

async function ownsStore(storeId: string, userId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId } });
}

function parseVerification(raw: string) {
  try {
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let verification = parseVerification(store.domainVerification);
  let status = store.customDomainStatus;
  let automated = cloudflareDomainsConfigured();

  if (store.customDomain && automated) {
    const hostname = await getCustomHostname(store.customDomain);
    if (hostname.ok && hostname.data) {
      verification = verificationRecords(hostname.data);
      status = isCustomHostnameActive(hostname.data) ? "active" : "pending";
    } else if (isSaasQuotaError(hostname.errors)) {
      automated = false;
    }
  } else if (automated) {
    automated = await saasAvailable();
  }

  return NextResponse.json({
    subdomain: subdomainFor(store.slug),
    subdomainUrl: `https://${subdomainFor(store.slug)}`,
    customDomain: store.customDomain,
    status,
    verification,
    automated,
    platformDomain: PLATFORM_DOMAIN,
    dns: recommendedDns(),
  });
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

  const token = `beepanal-verify=${randomBytes(16).toString("hex")}`;
  let verification: any[] = [];
  let status = "pending";
  let automated = false;
  let warning = "";

  const added = await addCustomHostname(domain);
  if (added.ok && added.data) {
    automated = true;
    verification = verificationRecords(added.data);
    if (isCustomHostnameActive(added.data)) status = "active";
  } else if (isSaasQuotaError(added.errors)) {
    warning = "ربط الدومينات المخصصة هيتفعّل قريبًا. الدومين اتحفظ، وفريق Bee Panal هيكمّل التفعيل.";
  } else if (added.status === 503) {
    warning = "الإضافة التلقائية غير مفعّلة حاليًا. الدومين اتحفظ، وفريق Bee Panal هيفعّله لك.";
  } else if (added.status === 401 || added.status === 403) {
    // The stored Cloudflare token is missing/expired. Save the domain anyway so
    // the merchant sees the DNS instructions and support can attach it manually.
    automated = false;
    warning = "الربط التلقائي عبر Cloudflare مش متاح حاليًا. الدومين اتحفظ، وفريق Bee Panal هيكمّل التفعيل.";
  } else {
    return NextResponse.json({ error: cloudflareDomainError(added) }, { status: 400 });
  }

  const updated = await prisma.store.update({
    where: { id: storeId },
    data: {
      customDomain: domain,
      customDomainStatus: status,
      domainToken: token,
      domainVerification: JSON.stringify(verification),
    },
    select: { customDomain: true, customDomainStatus: true },
  });

  return NextResponse.json({
    ok: true,
    customDomain: updated.customDomain,
    status: updated.customDomainStatus,
    verification,
    automated,
    warning,
    token,
    dns: recommendedDns(),
  });
}

export async function PATCH(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (!store.customDomain) {
    return NextResponse.json({ error: "مفيش دومين مخصص محفوظ" }, { status: 400 });
  }

  const existing = await getCustomHostname(store.customDomain);
  if (!existing.ok || !existing.data) {
    if (isSaasQuotaError(existing.errors)) {
      return NextResponse.json({
        status: store.customDomainStatus || "pending",
        verified: false,
        verification: parseVerification(store.domainVerification),
        pending: true,
        warning: "ربط الدومينات المخصصة هيتفعّل قريبًا. الدومين محفوظ، وفريق Bee Panal هيكمّل التفعيل.",
        dns: recommendedDns(),
      });
    }
    return NextResponse.json(
      { error: cloudflareDomainError(existing), status: store.customDomainStatus },
      { status: 400 }
    );
  }

  const verification = verificationRecords(existing.data);
  const status = isCustomHostnameActive(existing.data) ? "active" : "pending";

  await prisma.store.update({
    where: { id: storeId },
    data: {
      customDomainStatus: status,
      domainVerification: JSON.stringify(verification),
    },
  });

  return NextResponse.json({
    status,
    verified: status === "active",
    verification,
    sslStatus: existing.data.ssl?.status || null,
    dns: recommendedDns(),
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  if (store.customDomain) {
    try {
      await removeCustomHostname(store.customDomain);
    } catch {
      // Continue clearing the local record even if Cloudflare is unavailable.
    }
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
