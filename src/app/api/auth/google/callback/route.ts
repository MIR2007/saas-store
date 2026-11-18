import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  decodeOAuthValue,
  GOOGLE_STATE_COOKIE,
  googleConfigured,
  googleRedirectUri,
  oauthStateCookieOptions,
  safeNextPath,
  siteBaseUrl,
} from "@/lib/google-oauth";
import { createMerchantStore } from "@/lib/store-onboarding";

type Intent = "merchant" | "login";

function failure(request: NextRequest, reason: string, intent: Intent) {
  const target = new URL(
    intent === "merchant" ? "/register" : "/login",
    siteBaseUrl(request.url)
  );
  target.searchParams.set("error", reason);
  const response = NextResponse.redirect(target);
  response.cookies.set(GOOGLE_STATE_COOKIE, "", {
    ...oauthStateCookieOptions(),
    maxAge: 0,
  });
  return response;
}

function readStateCookie(raw: string) {
  const [state = "", intent = "", encodedNext = ""] = raw.split(".");
  let next = "/dashboard";
  try {
    next = safeNextPath(encodedNext ? decodeOAuthValue(encodedNext) : null, "/dashboard");
  } catch {
    next = "/dashboard";
  }
  return { state, intent: (intent === "merchant" ? "merchant" : "login") as Intent, next };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const saved = readStateCookie(request.cookies.get(GOOGLE_STATE_COOKIE)?.value || "");

  if (!googleConfigured()) return failure(request, "google_not_configured", saved.intent);
  if (oauthError) return failure(request, "google_cancelled", saved.intent);
  if (!code || !state || !saved.state || state !== saved.state) {
    return failure(request, "google_state", saved.intent);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: googleRedirectUri(request.url),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      console.error("google token exchange failed", await tokenResponse.text());
      return failure(request, "google_failed", saved.intent);
    }
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) return failure(request, "google_failed", saved.intent);

    const infoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!infoResponse.ok) {
      console.error("google userinfo failed", await infoResponse.text());
      return failure(request, "google_failed", saved.intent);
    }
    const info = (await infoResponse.json()) as {
      email?: string;
      email_verified?: boolean;
      name?: string;
      given_name?: string;
    };

    const email = (info.email || "").trim().toLowerCase();
    if (!email || info.email_verified !== true) {
      return failure(request, "google_email", saved.intent);
    }

    const displayName = (info.name || info.given_name || email.split("@")[0])
      .trim()
      .slice(0, 80);

    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    let storeId: string | null = null;

    if (!user) {
      // Google signup creates merchant accounts only; normal login never
      // creates an account silently.
      if (saved.intent !== "merchant") {
        return failure(request, "google_no_account", saved.intent);
      }
      const passwordHash = await hashPassword(crypto.randomUUID());
      user = await prisma.user.create({
        data: {
          name: displayName,
          email,
          passwordHash,
          phone: "",
          role: "MERCHANT",
        },
      });
      const store = await createMerchantStore({
        userId: user.id,
        name: user.name,
        email: user.email,
      });
      storeId = store.id;
    } else if (user.role === "MERCHANT") {
      const store = await prisma.store.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (store) {
        storeId = store.id;
      } else {
        const created = await createMerchantStore({
          userId: user.id,
          name: user.name,
          email: user.email,
        });
        storeId = created.id;
      }
    }

    let destination = saved.next;
    if (user.role === "MERCHANT") {
      destination = user.phone
        ? storeId
          ? `/dashboard/stores/${storeId}`
          : "/dashboard/stores/new"
        : "/dashboard/account?required=phone";
    } else if (user.role === "ADMIN") {
      destination = "/dashboard";
    } else if (destination === "/dashboard") {
      destination = "/";
    }

    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.redirect(new URL(destination, siteBaseUrl(request.url)));
    response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      ...oauthStateCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error(error);
    return failure(request, "google_failed", saved.intent);
  }
}
