import { NextResponse, type NextRequest } from "next/server";
import {
  encodeOAuthValue,
  GOOGLE_STATE_COOKIE,
  googleConfigured,
  googleRedirectUri,
  oauthStateCookieOptions,
  safeNextPath,
  siteBaseUrl,
} from "@/lib/google-oauth";

function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent") === "merchant" ? "merchant" : "login";
  const next = safeNextPath(url.searchParams.get("next"), "/dashboard");

  if (!googleConfigured()) {
    const target = new URL(
      intent === "merchant" ? "/register" : "/login",
      siteBaseUrl(request.url)
    );
    target.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(target);
  }

  const state = randomState();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  authUrl.searchParams.set("redirect_uri", googleRedirectUri(request.url));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("access_type", "online");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(
    GOOGLE_STATE_COOKIE,
    `${state}.${intent}.${encodeOAuthValue(next)}`,
    oauthStateCookieOptions()
  );
  return response;
}
