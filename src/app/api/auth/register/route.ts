import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidEgyptMobile, normalizePhone } from "@/lib/phone";
import { createMerchantStore } from "@/lib/store-onboarding";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().max(30).optional(),
  role: z.enum(["CUSTOMER", "MERCHANT"]).optional(),
});

export async function POST(req: Request) {
  try {
    const limit = await rateLimit("register", clientIp(req), 6, 3600);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const { name, email, password, role } = parsed.data;
    const finalRole = role || "CUSTOMER";
    const phone = normalizePhone(parsed.data.phone);

    if (finalRole === "MERCHANT" && !isValidEgyptMobile(phone)) {
      return NextResponse.json(
        { error: "رقم الموبايل مطلوب وصحيح للتجار (مثال: 01012345678)" },
        { status: 400 }
      );
    }
    if (phone && !isValidEgyptMobile(phone)) {
      return NextResponse.json({ error: "رقم الموبايل غير صحيح" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone, role: finalRole },
    });

    let storeId: string | null = null;
    if (finalRole === "MERCHANT") {
      const store = await createMerchantStore({
        userId: user.id,
        name: user.name,
        email: user.email,
      });
      storeId = store.id;
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      storeId,
      redirect:
        finalRole === "MERCHANT" && storeId ? `/dashboard/stores/${storeId}` : "/",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
