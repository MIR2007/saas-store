import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    let redirect = "/";
    if (user.role === "MERCHANT") {
      const store = await prisma.store.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      redirect = store ? `/dashboard/stores/${store.id}` : "/dashboard/stores/new";
    } else if (user.role === "ADMIN") {
      redirect = "/dashboard";
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      redirect,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}