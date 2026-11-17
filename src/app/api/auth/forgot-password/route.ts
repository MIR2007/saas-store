import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createResetToken, resetUrl } from "@/lib/reset-token";
import { emailConfigured, passwordResetEmail, sendEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const limit = await rateLimit("forgot-password", clientIp(req), 5, 3600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بريد إلكتروني غير صالح" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Always answer the same way so the endpoint can't be used to discover emails.
    if (user && emailConfigured()) {
      const { token, hash, expiresAt } = await createResetToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash: hash, resetTokenExpires: expiresAt },
      });
      await sendEmail({
        to: user.email,
        ...passwordResetEmail(user.name, resetUrl(token)),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: true });
  }
}
