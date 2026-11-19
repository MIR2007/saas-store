import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  domainVerificationHost,
  isApexDomain,
  parseDomainState,
  serializeDomainState,
} from "@/lib/domains";
import { CUSTOM_DOMAIN_CNAME, removeCustomHostname } from "@/lib/cloudflare-domains";
import { domainStatusMessage, refreshDomainConnection } from "@/lib/domain-service";
import { z } from "zod";

async function isAdmin() {
  const store = await cookies();
  return store.get("bp_admin")?.value === "1";
}

const schema = z.object({
  storeId: z.string().min(1),
  action: z.enum(["verify", "activate", "deactivate", "remove"]),
});

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const stores = await prisma.store.findMany({
    where: { customDomain: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      domainToken: true,
      domainVerification: true,
      createdAt: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  return NextResponse.json({
    stores: stores.map((store) => {
      const state = parseDomainState(store.domainVerification);
      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        customDomain: store.customDomain,
        customDomainStatus: store.customDomainStatus,
        createdAt: store.createdAt,
        user: store.user,
        state,
        records:
          store.customDomain && store.domainToken
            ? {
                apex: isApexDomain(store.customDomain),
                txt: {
                  type: "TXT",
                  name: domainVerificationHost(store.customDomain),
                  value: store.domainToken,
                },
                cname: {
                  type: "CNAME",
                  name: store.customDomain,
                  value: CUSTOM_DOMAIN_CNAME,
                },
              }
            : null,
      };
    }),
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { storeId, action } = parsed.data;
  let store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
  const domain = store.customDomain;
  if (!domain) {
    return NextResponse.json({ error: "المتجر مفيش عليه دومين مخصص" }, { status: 400 });
  }

  if (!store.domainToken) {
    store = await prisma.store.update({
      where: { id: storeId },
      data: { domainToken: `beepanal-verify=${randomBytes(16).toString("hex")}` },
    });
  }

  if (action === "remove") {
    try {
      await removeCustomHostname(domain);
    } catch {
      // Continue clearing the local record even if Cloudflare is unavailable.
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
    return NextResponse.json({ ok: true, status: "none" });
  }

  if (action === "deactivate") {
    await prisma.store.update({
      where: { id: storeId },
      data: { customDomainStatus: "pending" },
    });
    return NextResponse.json({ ok: true, status: "pending", message: "تم إيقاف الدومين مؤقتًا." });
  }

  const refreshed = await refreshDomainConnection(store);
  if (!refreshed) {
    return NextResponse.json({ error: "المتجر مفيش عليه دومين مخصص" }, { status: 400 });
  }

  if (action === "activate") {
    if (!refreshed.checks.ownership) {
      return NextResponse.json(
        { error: "لازم سجل التحقق TXT يكون ظاهر قبل التفعيل اليدوي." },
        { status: 400 }
      );
    }
    if (!refreshed.checks.routing) {
      return NextResponse.json(
        { error: "الدومين لسه مش موجه لـ Bee Panal. راجع سجل CNAME قبل التفعيل." },
        { status: 400 }
      );
    }

    const verifiedAt = refreshed.state.verifiedAt || new Date().toISOString();
    await prisma.store.update({
      where: { id: storeId },
      data: {
        customDomainStatus: "active",
        domainVerification: serializeDomainState({ ...refreshed.state, verifiedAt }),
      },
    });
    return NextResponse.json({
      ok: true,
      status: "active",
      message: "تم تفعيل الدومين. اتأكد إن شهادة SSL جاهزة قبل ما تشارك الرابط.",
    });
  }

  return NextResponse.json({
    ok: true,
    status: refreshed.status,
    message: domainStatusMessage(refreshed.status, refreshed.checks),
    checks: refreshed.checks,
    automated: refreshed.automated,
    warning: refreshed.warning,
    state: refreshed.state,
  });
}
