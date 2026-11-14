import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "bp_admin";

export async function POST(req: Request) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  if (password !== expected) {
    return NextResponse.json({ error: "كلمة مرور غير صحيحة" }, { status: 401 });
  }
  const store = await cookies();
  store.set(COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}