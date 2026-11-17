import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStoreTheme, storeThemeVars } from "@/lib/themes";
import { storeIsLive } from "@/lib/store-status";
import { PLATFORM_URL, storePublicUrl } from "@/lib/domains";

export async function generateMetadata(props: LayoutProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      description: true,
      customDomain: true,
      customDomainStatus: true,
      active: true,
      planStatus: true,
      planRenewsAt: true,
    },
  });

  if (!store) {
    return {
      title: "المتجر غير موجود | Bee Panal",
      robots: { index: false, follow: false },
    };
  }

  const url = storePublicUrl(store.slug, store.customDomain, store.customDomainStatus);
  const live = storeIsLive(store);
  const description =
    store.description.trim() ||
    `تسوق من ${store.name} أونلاين — منتجات مختارة، دفع عند الاستلام، وشحن لكل محافظات مصر.`;

  return {
    // Keep generated image URLs on the platform host: it always serves the
    // /[slug]/opengraph-image route, even when the store uses a custom domain.
    metadataBase: new URL(PLATFORM_URL),
    title: {
      default: `${store.name} | متجر إلكتروني`,
      template: `%s | ${store.name}`,
    },
    description,
    alternates: { canonical: url },
    robots: live
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "ar_EG",
      siteName: store.name,
      title: store.name,
      description,
      url,
      images: [
        {
          url: `${PLATFORM_URL}/${store.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${store.name} | Bee Panal`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: store.name,
      description,
      images: [`${PLATFORM_URL}/${store.slug}/opengraph-image`],
    },
  };
}

export default async function StoreLayout(props: LayoutProps<"/[slug]">) {
  const { slug } = await props.params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { theme: true, themeColor: true },
  });

  const theme = getStoreTheme(store?.theme);
  const style = storeThemeVars(store?.theme, store?.themeColor) as CSSProperties;

  return (
    <div
      className={`store-theme ${theme.dark ? "dark" : ""}`}
      style={style}
    >
      {props.children}
    </div>
  );
}
