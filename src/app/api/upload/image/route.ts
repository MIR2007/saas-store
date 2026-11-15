import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

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
  if ((file as any).size > maxSize) {
    return NextResponse.json({ error: "الصورة أكبر من 5 ميجابايت" }, { status: 400 });
  }

  // Delete previous image if replacing
  if (previousUrl) {
    try {
      await del(previousUrl);
    } catch {
      // ignore delete errors
    }
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      { error: "خدمة رفع الصور غير مفعلة على الخادم. تواصل مع الدعم." },
      { status: 503 }
    );
  }

  try {
    const blob = await put(`products/${session.userId}/${Date.now()}_${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    console.error("Blob upload error:", e);
    return NextResponse.json({ error: "فشل في رفع الصورة، جرّب تاني." }, { status: 500 });
  }
}
