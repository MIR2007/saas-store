import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cleanDomainInput, isValidDomain, subdomainFor, PLATFORM_DOMAIN } from "@/lib/domains";
import {
  addProjectDomain,
  getDomainConfig,
  getProjectDomain,
  recommendedDns,
  removeProjectDomain,
  vercelDomainsConfigured,
} from "@/lib/vercel-domains";
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

function vercelError(data: any) {
  const code = data?.error?.code || data?.code;
  const map: Record<string, string> = {
    domain_already_in_use: "الدومين ده مربوط بمشروع تاني على Vercel. لازم تشيله من المشروع القديم الأول.",
    domain_already_exists: "الدومين مضاف بالفعل لنفس المشروع.",
    invalid_domain: "صيغة الدومين غير صحيحة.",
    forbidden: "مش قادرين نضيف الدومين تلقائيًا. تواصل مع الدعم.",
    invalidToken: "ربط Vercel محتاج تجديد الصلاحية. تواصل مع الدعم.",
    not_authorized: "صلاحية Vercel غير كافية. تواصل مع الدعم.",
  };
  return map[code] || data?.error?.message || "مش قادرين نضيف الدومين دلوقتي. جرّب تاني.";
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/domain">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let dns = recommendedDns(null);
  if (store.customDomain && vercelDomainsConfigured()) {
    const config = await getDomainConfig(store.customDomain);
    if (config.ok) dns = recommendedDns(config.data);
  }

  return NextResponse.json({
    subdomain: subdomainFor(store.slug),
    subdomainUrl: `https://${subdomainFor(store.slug)}`,
    customDomain: store.customDomain,
    status: store.customDomainStatus,
    verification: parseVerification(store.domainVerification),
    automated: vercelDomainsConfigured(),
    platformDomain: PLATFORM_DOMAIN,
    dns,
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

  const added = await addProjectDomain(domain);
  if (added.ok) {
    automated = true;
    verification = added.data?.verification || [];
    // `verified` means Vercel verified ownership; `configuredBy` means DNS is
    // actually pointing at Vercel, so only then is the domain live.
    if (added.data?.verified && added.data?.configuredBy) status = "active";
  } else if (added.status === 503) {
    warning = "الإضافة التلقائية غير مفعّلة حاليًا. الدومين اتحفظ، وفريق Bee Panal هيفعّله لك.";
  } else if (
    added.status === 401 ||
    added.status === 403 ||
    added.data?.error?.code === "forbidden" ||
    added.data?.error?.code === "invalidToken"
  ) {
    // The stored Vercel token is missing/expired. Save the domain anyway so the
    // merchant sees the DNS instructions and support can attach it manually.
    automated = false;
    warning = "الربط التلقائي عبر Vercel مش متاح حاليًا. الدومين اتحفظ، وفريق Bee Panal هيكمّل التفعيل.";
  } else {
    // The domain may already be attached to this same project.
    const existing = await getProjectDomain(domain);
    if (existing.ok) {
      automated = true;
      verification = existing.data?.verification || [];
      if (existing.data?.verified && existing.data?.configuredBy) status = "active";
    } else {
      return NextResponse.json({ error: vercelError(added.data) }, { status: 400 });
    }
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

  let dns = recommendedDns(null);
  const config = await getDomainConfig(domain);
  if (config.ok) dns = recommendedDns(config.data);

  return NextResponse.json({
    ok: true,
    customDomain: updated.customDomain,
    status: updated.customDomainStatus,
    verification,
    automated,
    warning,
    token,
    dns,
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

  const existing = await getProjectDomain(store.customDomain);
  if (!existing.ok) {
    return NextResponse.json(
      { error: vercelError(existing.data), status: store.customDomainStatus },
      { status: 400 }
    );
  }

  const verified = Boolean(existing.data?.verified);
  const live = verified && Boolean(existing.data?.configuredBy);
  const verification = existing.data?.verification || [];
  const status = live ? "active" : "pending";

  await prisma.store.update({
    where: { id: storeId },
    data: {
      customDomainStatus: status,
      domainVerification: JSON.stringify(verification),
    },
  });

  let dns = recommendedDns(null);
  const config = await getDomainConfig(store.customDomain);
  if (config.ok) dns = recommendedDns(config.data);

  return NextResponse.json({
    status,
    verified,
    verification,
    configuredBy: existing.data?.configuredBy || null,
    dns,
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
      await removeProjectDomain(store.customDomain);
    } catch {
      // Continue clearing the local record even if Vercel is unavailable.
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
