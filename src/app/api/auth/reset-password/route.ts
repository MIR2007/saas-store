import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { hashResetToken } from "@/lib/reset-token";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10).max(300),
  password: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const limit = await rateLimit("reset-password", clientIp(req), 10, 3600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const hash = await hashResetToken(parsed.data.token);
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: hash,
        resetTokenExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابط جديد." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetTokenHash: "", resetTokenExpires: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
