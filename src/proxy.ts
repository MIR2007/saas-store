import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { extractSubdomain, isPlatformHost, normalizeHost, PLATFORM_URL } from "@/lib/domains";

const COOKIE_NAME = "eo_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me-in-production-please"
);

/** Resolve a custom domain to a store slug through the public API route. */
async function slugForCustomDomain(host: string) {
  if (
    !host.includes(".") ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".workers.dev") ||
    host.endsWith(".pages.dev") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) {
    return null;
  }
  try {
    // Always resolve through the platform hostname. Fetching the custom host
    // itself would re-enter this middleware and recurse.
    const base = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_URL;
    const url = new URL("/api/public/resolve-domain", base);
    url.searchParams.set("host", host);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string | null };
    return data.slug || null;
  } catch (error) {
    console.error("domain lookup failed", error);
    return null;
  }
}

/** Rewrite a storefront request on the store's own host to the /[slug] routes. */
function rewriteToStore(request: NextRequest, slug: string) {
  const pathname = request.nextUrl.pathname;

  // Canonicalise legacy links that still include the store slug.
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(slug.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = normalizeHost(request.headers.get("host"));

  // ---- Own-domain routing: every store gets {slug}.beepanal.store + optional custom domain
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    return rewriteToStore(request, subdomain);
  }

  const platform = isPlatformHost(host);
  if (!platform) {
    const slug = await slugForCustomDomain(host);
    if (slug) return rewriteToStore(request, slug);
    // Unknown host must not fall through to the platform homepage.
    return new NextResponse("هذا الدومين غير مربوط بأي متجر على Bee Panal.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // ---- Platform authentication
  if (pathname === "/") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET);
        if (payload.role === "MERCHANT") {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
      } catch {
        // invalid token, show the marketing site
      }
    }
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    try {
      await jwtVerify(token, SECRET);
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("bp_admin")?.value;
    if (adminToken !== "1") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        await jwtVerify(token, SECRET);
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      } catch {
        // invalid token, stay
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|logo.svg|\\.well-known|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|mjs|map|woff|woff2|ttf|otf|mp4|webm)$).*)",
  ],
};
