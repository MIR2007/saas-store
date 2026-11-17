import type { MetadataRoute } from "next";
import { PLATFORM_URL } from "@/lib/domains";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api/", "/login", "/register"],
    },
    sitemap: `${PLATFORM_URL}/sitemap.xml`,
    host: PLATFORM_URL,
  };
}
