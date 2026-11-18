import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEgyptMobile, normalizePhone } from "@/lib/phone";
import { cookies } from "next/headers";
import { z } from "zod";

const ADMIN_COOKIE = "bp_admin";

async function isAdmin() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "1";
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  role: z.enum(["CUSTOMER", "MERCHANT", "ADMIN"]).optional(),
});

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const merchants = await prisma.user.findMany({
    where: { role: "MERCHANT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      stores: {
        select: { id: true, name: true, slug: true, active: true, themeColor: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { stores: true } },
    },
  });

  return NextResponse.json({ merchants });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, ...data } = body;

  if (!userId) {
    return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const update = { ...parsed.data };
  if (update.phone !== undefined) {
    const phone = normalizePhone(update.phone);
    if (phone && !isValidEgyptMobile(phone)) {
      return NextResponse.json({ error: "رقم الموبايل غير صحيح" }, { status: 400 });
    }
    update.phone = phone;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: update,
  });

  return NextResponse.json({ user });
}
