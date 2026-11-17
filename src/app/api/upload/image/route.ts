import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Only allow deleting objects that live in this user's R2 folder. */
function r2KeyFromUrl(url: string | undefined, userId: string) {
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://beepanal.store");
    const prefix = "/api/uploads/";
    if (!parsed.pathname.startsWith(prefix)) return null;
    const key = decodeURIComponent(parsed.pathname.slice(prefix.length));
    if (!key.startsWith(`products/${userId}/`)) return null;
    return key;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const limit = await rateLimit("upload-image", session.userId, 60, 600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const previousUrl = (formData.get("previousUrl") as string) || undefined;

  if (!file) {
    return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "نوع ملف غير مدعوم (jpg, png, webp, gif فقط)" },
      { status: 400 }
    );
  }

  // Validate size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "الصورة أكبر من 5 ميجابايت" }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const bucket = env.UPLOADS;
  const kv = env.UPLOADS_KV;
  if (!bucket && !kv) {
    return NextResponse.json(
      { error: "خدمة رفع الصور غير مفعلة على الخادم. تواصل مع الدعم." },
      { status: 503 }
    );
  }

  // Delete the previous image when replacing it.
  const previousKey = r2KeyFromUrl(previousUrl, session.userId);
  if (previousKey) {
    try {
      if (bucket) await bucket.delete(previousKey);
      else if (kv) await kv.delete(previousKey);
    } catch {
      // ignore delete errors
    }
  }

  try {
    const safeName =
      file.name
        .normalize("NFKD")
        .replace(/[^\w.\-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(-80) || "image";
    const key = `products/${session.userId}/${Date.now()}_${safeName}`;
    const bytes = await file.arrayBuffer();

    if (bucket) {
      await bucket.put(key, bytes, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: "public, max-age=31536000, immutable",
        },
      });
    } else if (kv) {
      await kv.put(key, bytes, {
        metadata: { contentType: file.type },
      });
    }

    return NextResponse.json({ url: `/api/uploads/${key}` });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "فشل في رفع الصورة، جرّب تاني." }, { status: 500 });
  }
}
