import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PLATFORM_URL } from "@/lib/domains";
import {
  bostaListPickupLocations,
  isValidBostaKey,
  maskBostaKey,
  parseBostaConfig,
  serializeBostaConfig,
  type BostaConfig,
  type BostaPickupLocation,
} from "@/lib/bosta";
import { isBostaPackageType } from "@/lib/bosta-status";
import { z } from "zod";

const saveSchema = z.object({
  apiKey: z.string().trim().max(300).optional(),
  pickupLocationId: z.string().trim().max(100).optional(),
  pickupLocationName: z.string().trim().max(200).optional(),
  packageType: z.string().trim().max(40).optional(),
  packageWeight: z.number().positive().max(100).optional(),
  codEnabled: z.boolean().optional(),
  defaultNotes: z.string().max(300).optional(),
  testOnly: z.boolean().optional(),
});

async function ownsStore(storeId: string, userId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId } });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/shipping/bosta">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const config = parseBostaConfig(store.bostaConfig);
  return NextResponse.json({
    connected: Boolean(store.bostaApiKey),
    enabled: Boolean(store.bostaEnabled && store.bostaApiKey),
    maskedKey: maskBostaKey(store.bostaApiKey),
    config,
    webhookUrl: `${PLATFORM_URL}/api/public/webhooks/bosta/${store.id}`,
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/shipping/bosta">) {
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
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const providedKey = parsed.data.apiKey?.trim() || "";
  const apiKey = providedKey || store.bostaApiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "اكتب مفتاح API بتاع بوسطة الأول." },
      { status: 400 }
    );
  }
  if (!isValidBostaKey(apiKey)) {
    return NextResponse.json(
      { error: "مفتاح API غير صالح — انسخه كامل من لوحة بوسطة بدون مسافات." },
      { status: 400 }
    );
  }

  const shouldCheck = Boolean(providedKey) || parsed.data.testOnly === true;
  let locations: BostaPickupLocation[] | null = null;

  if (shouldCheck) {
    const result = await bostaListPickupLocations(apiKey);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    locations = result.data;
  }

  if (parsed.data.testOnly) {
    return NextResponse.json({
      ok: true,
      maskedKey: maskBostaKey(apiKey),
      locations: locations || [],
    });
  }

  const current = parseBostaConfig(store.bostaConfig);
  const config: BostaConfig = {
    ...current,
    pickupLocationId: parsed.data.pickupLocationId ?? current.pickupLocationId,
    pickupLocationName: parsed.data.pickupLocationName ?? current.pickupLocationName,
    packageType: isBostaPackageType(parsed.data.packageType)
      ? parsed.data.packageType
      : current.packageType,
    packageWeight: parsed.data.packageWeight ?? current.packageWeight,
    codEnabled: parsed.data.codEnabled ?? current.codEnabled,
    defaultNotes: parsed.data.defaultNotes ?? current.defaultNotes,
    connectedAt: current.connectedAt || new Date().toISOString(),
    lastCheckedAt: shouldCheck ? new Date().toISOString() : current.lastCheckedAt,
  };

  if (locations) {
    if (config.pickupLocationId) {
      const selected = locations.find((location) => location.id === config.pickupLocationId);
      if (selected) {
        config.pickupLocationName = selected.name;
      } else {
        config.pickupLocationId = locations[0]?.id || "";
        config.pickupLocationName = locations[0]?.name || "";
      }
    } else if (locations[0]) {
      config.pickupLocationId = locations[0].id;
      config.pickupLocationName = locations[0].name;
    }
  }

  await prisma.store.update({
    where: { id: storeId },
    data: {
      bostaApiKey: apiKey,
      bostaEnabled: true,
      bostaConfig: serializeBostaConfig(config),
    },
  });

  return NextResponse.json({
    ok: true,
    connected: true,
    enabled: true,
    maskedKey: maskBostaKey(apiKey),
    config,
    locations: locations || [],
    warning:
      locations && locations.length === 0
        ? "الحساب متصل، لكن مفيش عنوان استلام في بوسطة. أضف Pickup Location من لوحة بوسطة قبل إنشاء شحنة."
        : "",
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/stores/[storeId]/shipping/bosta">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { storeId } = await ctx.params;
  const store = await ownsStore(storeId, session.userId);
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await prisma.store.update({
    where: { id: storeId },
    data: { bostaApiKey: "", bostaEnabled: false, bostaConfig: "{}" },
  });

  return NextResponse.json({ ok: true });
}
