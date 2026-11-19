import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseOnboarding, serializeOnboarding } from "@/lib/onboarding";
import { z } from "zod";

const schema = z.object({
  step: z.enum(["share"]).optional(),
  hidden: z.boolean().optional(),
});

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/onboarding">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { storeId } = await ctx.params;
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session.userId },
    select: { id: true, onboarding: true },
  });
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const flags = parseOnboarding(store.onboarding);
  if (parsed.data.step === "share") flags.share = true;
  if (parsed.data.hidden) flags.hidden = true;

  await prisma.store.update({
    where: { id: storeId },
    data: { onboarding: serializeOnboarding(flags) },
  });

  return NextResponse.json({ onboarding: flags });
}
