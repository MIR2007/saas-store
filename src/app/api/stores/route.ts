import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const stores = await prisma.store.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true, orders: true } } },
  });
  return NextResponse.json({ stores });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const { name, slug, description } = parsed.data;

    const existing = await prisma.store.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "هذا الرابط مستخدم بالفعل" }, { status: 409 });
    }

    const store = await prisma.store.create({
      data: {
        name,
        slug,
        description: description || "",
        userId: session.userId,
        currency: "EGP",
        themeColor: "#d97706",
      },
    });
    return NextResponse.json({ store });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}