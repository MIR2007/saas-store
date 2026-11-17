import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CUSTOMER", "MERCHANT"]).optional(),
});

function slugBase(name: string, email: string) {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const base = clean(name) || clean(email.split("@")[0]) || "store";
  return base.slice(0, 28).replace(/-+$/g, "") || "store";
}

async function uniqueSlug(name: string, email: string) {
  const base = slugBase(name, email);
  let slug = base;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const existing = await prisma.store.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const finalRole = role || "CUSTOMER";
    const storeSlug = finalRole === "MERCHANT" ? await uniqueSlug(name, email) : null;

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: finalRole },
    });

    let storeId: string | null = null;
    if (finalRole === "MERCHANT" && storeSlug) {
      const store = await prisma.store.create({
        data: {
          userId: user.id,
          name: `متجر ${name.split(" ")[0]}`.slice(0, 60),
          slug: storeSlug,
          description: "",
          currency: "EGP",
          themeColor: "#d97706",
          theme: "aura",
          plan: "trial",
          planStatus: "active",
          planRenewsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
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