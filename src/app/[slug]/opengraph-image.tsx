import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { STORE_HOST_HEADER } from "@/lib/domain-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "متجر إلكتروني على Bee Panal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function currentOrigin() {
  try {
    const h = await headers();
    const host =
      h.get(STORE_HOST_HEADER) || h.get("x-forwarded-host") || h.get("host") || "beepanal.store";
    const proto =
      h.get("x-forwarded-proto") ||
      (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return "https://beepanal.store";
  }
}

async function loadFont(url: string) {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await prisma.store
    .findUnique({
      where: { slug },
      select: { name: true, description: true, themeColor: true },
    })
    .catch(() => null);

  const origin = await currentOrigin();
  const [bold, regular] = await Promise.all([
    loadFont(`${origin}/fonts/Tajawal-Bold.ttf`),
    loadFont(`${origin}/fonts/Tajawal-Regular.ttf`),
  ]);

  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: "normal";
  }[] = [];
  if (regular) fonts.push({ name: "Tajawal", data: regular, weight: 400, style: "normal" });
  if (bold) fonts.push({ name: "Tajawal", data: bold, weight: 700, style: "normal" });

  const name = store?.name || "Bee Panal";
  const description = (
    store?.description ||
    "تسوق أونلاين — دفع عند الاستلام وشحن سريع لكل محافظات مصر"
  )
    .replace(/\s+/g, " ")
    .slice(0, 120);
  const color = store?.themeColor || "#d97706";
  const fontFamily = fonts.length ? "Tajawal" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0a09",
          color: "#fafaf9",
          padding: 64,
          fontFamily,
          direction: "rtl",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: `${color}33`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            right: -100,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: `${color}1f`,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              B
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>Bee Panal</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              borderRadius: 9999,
              background: "#ffffff14",
              border: "1px solid #ffffff26",
              fontSize: 20,
              color: "#e7e5e4",
            }}
          >
            متجر إلكتروني موثوق
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            position: "relative",
            maxWidth: 980,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: name.length > 22 ? 68 : 84,
              fontWeight: 700,
              lineHeight: 1.15,
              textAlign: "right",
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 30,
              lineHeight: 1.5,
              color: "#d6d3d1",
              textAlign: "right",
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 28px",
              borderRadius: 16,
              background: color,
              fontSize: 24,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            تسوق الآن
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#a8a29e" }}>
            {slug}.beepanal.store
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts.length ? { fonts } : {}),
    }
  );
}
