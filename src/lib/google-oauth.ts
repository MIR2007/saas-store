export const GOOGLE_STATE_COOKIE = "bp_google_state";
export const GOOGLE_STATE_MAX_AGE = 60 * 10;

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Public base URL used for OAuth redirects (never trust the Host header in production). */
export function siteBaseUrl(requestUrl: string) {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  if (configured) return configured;
  const url = new URL(requestUrl);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return url.origin;
  return "https://beepanal.store";
}

export function googleRedirectUri(requestUrl: string) {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${siteBaseUrl(requestUrl)}/api/auth/google/callback`
  );
}

export function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: GOOGLE_STATE_MAX_AGE,
  };
}

export function safeNextPath(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

/** Cookie-safe base64url encoding (the `|` character gets re-encoded by Set-Cookie). */
export function encodeOAuthValue(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeOAuthValue(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
