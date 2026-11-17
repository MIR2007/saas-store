import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createResetToken, resetUrl } from "@/lib/reset-token";
import { z } from "zod";

const schema = z.object({ userId: z.string().min(1) });

async function isAdmin() {
  const store = await cookies();
  return store.get("bp_admin")?.value === "1";
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

    const { token, hash, expiresAt } = await createResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: hash, resetTokenExpires: expiresAt },
    });

    return NextResponse.json({
      ok: true,
      user,
      url: resetUrl(token),
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
