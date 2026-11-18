import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isValidEgyptMobile, normalizePhone } from "@/lib/phone";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(30).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const data: { name?: string; phone?: string } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.phone !== undefined) {
      const phone = normalizePhone(parsed.data.phone);
      if (phone && !isValidEgyptMobile(phone)) {
        return NextResponse.json({ error: "رقم الموبايل غير صحيح" }, { status: 400 });
      }
      if (!phone && session.role === "MERCHANT") {
        return NextResponse.json({ error: "رقم الموبايل مطلوب لحساب التاجر" }, { status: 400 });
      }
      data.phone = phone;
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
