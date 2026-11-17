const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function hashResetToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createResetToken() {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await hashResetToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

export function resetUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://beepanal.store";
  return `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}
