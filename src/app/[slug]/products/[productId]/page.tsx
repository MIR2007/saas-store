import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/storefront/ProductGallery";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import StoreClosed from "@/components/storefront/StoreClosed";
import { storeIsLive } from "@/lib/store-status";
import { storePublicUrl } from "@/lib/domains";
import { formatMoney } from "@/lib/format";
import { getStoreBase } from "@/lib/store-url";
import {
  getStoreTheme,
  parseThemeConfig,
  storeGridClass,
} from "@/lib/themes";
import { ArrowLeft, ChevronLeft, RotateCcw, ShieldCheck, Truck } from "lucide-react";

function absoluteImage(image: string, base: string) {
  try {
    return new URL(image, base).toString();
  } catch {
    return image;
  }
}

export async function generateMetadata(
  props: PageProps<"/[slug]/products/[productId]">
): Promise<Metadata> {
  const { slug, productId } = await props.params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, customDomain: true, customDomainStatus: true },
  });
  if (!store) return { title: "المنتج غير موجود", robots: { index: false, follow: false } };

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id, active: true },
    select: { id: true, name: true, description: true, images: true, price: true },
  });
  if (!product) return { title: "المنتج غير موجود", robots: { index: false, follow: false } };

  const base = storePublicUrl(store.slug, store.customDomain, store.customDomainStatus);
  const url = `${base}/products/${product.id}`;
  const description = (
    product.description ||
    `اطلب ${product.name} من ${store.name} — دفع عند الاستلام وشحن سريع.`
  )
    .replace(/\s+/g, " ")
    .slice(0, 160);

  let images: string[] = [];
  try {
    const parsed = JSON.parse(product.images || "[]");
    if (Array.isArray(parsed)) images = parsed.filter(Boolean).slice(0, 4);
  } catch {
    images = [];
  }
  const ogImages = images.length
    ? images.map((image) => absoluteImage(image, base))
    : [`${base}/opengraph-image`];

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: ogImages,
    },
  };
}

export default async function ProductDetailPage(props: PageProps<"/[slug]/products/[productId]">) {
  const { slug, productId } = await props.params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  if (!storeIsLive(store)) {
    return <StoreClosed store={{ name: store.name, logo: store.logo, phone: store.phone }} />;
  }

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id: productId, storeId: store.id, active: true },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  let images: string[] = [];
  try {
    images = JSON.parse(product.images || "[]");
  } catch {
    images = [];
  }
  images = images.filter(Boolean).slice(0, 5);

  const related = await prisma.product.findMany({
    where: {
      storeId: store.id,
      active: true,
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const theme = getStoreTheme(store.theme);
  const config = parseThemeConfig(store.themeConfig);
  const color = config.colors.primary || store.themeColor || theme.primary;
  const base = await getStoreBase(store.slug, store.customDomain);
  const onSale = product.comparePrice && product.comparePrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.comparePrice!) * 100) : 0;
  const canonicalUrl = `${storePublicUrl(store.slug, store.customDomain, store.customDomainStatus)}/products/${product.id}`;

  const defaultAnnouncement =
    store.freeShippingThreshold > 0
      ? `شحن مجاني للطلبات فوق ${formatMoney(store.freeShippingThreshold, store.currency)} — الدفع عند الاستلام`
      : "شحن سريع لكل محافظات مصر — الدفع عند الاستلام";
  const announcement = config.announcement || defaultAnnouncement;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: images.length ? images.map((image) => absoluteImage(image, canonicalUrl)) : undefined,
    sku: product.id,
    brand: { "@type": "Brand", name: store.name },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: store.currency || "EGP",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: store.name },
    },
  };

  return (
    <div className="min-h-screen bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <StoreHeader
        store={{ name: store.name, slug: store.slug, logo: store.logo, phone: store.phone }}
        base={base}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        announcement={announcement}
        showAnnouncement={config.announcementEnabled}
        headerStyle={config.headerStyle}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav className="mb-7 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold tracking-wide text-muted">
          <Link href={base || "/"} className="transition-colors hover:text-foreground">
            المتجر
          </Link>
          <ChevronLeft className="h-3 w-3" />
          {product.category && (
            <>
              <Link
                href={`${base || "/"}?category=${product.category.id}#products`}
                className="transition-colors hover:text-foreground"
              >
                {product.category.name}
              </Link>
              <ChevronLeft className="h-3 w-3" />
            </>
          )}
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={images} name={product.name} />

          <div className="lg:py-1">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="store-eyebrow text-[10px] font-bold uppercase text-primary">
                  {product.category.name}
                </span>
              )}
              <span
                className={`border px-2 py-1 text-[9px] font-bold tracking-[0.08em] ${
                  product.stock > 0
                    ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-300"
                }`}
              >
                {product.stock > 0 ? "متوفر" : "نفذ المخزون"}
              </span>
            </div>

            <h1 className="store-heading mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
                {formatMoney(product.price, store.currency)}
              </span>
              {onSale && (
                <span className="text-base text-muted line-through">
                  {formatMoney(product.comparePrice!, store.currency)}
                </span>
              )}
              {onSale && (
                <span className="bg-[#111111] px-2 py-1 text-[9px] font-bold tracking-[0.08em] text-white">
                  خصم {discount}%
                </span>
              )}
            </div>

            <span className="store-hairline mt-5" />

            {product.description && (
              <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            )}

            <div className="mt-7">
              <AddToCartButton product={product} storeSlug={store.slug} base={base} />
            </div>

            <div className="mt-6 border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="text-xs font-bold text-foreground">الشحن حسب المحافظة</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    الشحن مبلغ ثابت لكل محافظة، ويتحدد بدقة عند إتمام الطلب.
                  </p>
                  {store.freeShippingThreshold > 0 && (
                    <p className="mt-1.5 text-[11px] font-semibold" style={{ color }}>
                      شحن مجاني للطلبات فوق {formatMoney(store.freeShippingThreshold, store.currency)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "دفع عند الاستلام", desc: "افحص طلبك الأول" },
                { icon: Truck, title: "شحن سريع", desc: "2-5 أيام عمل" },
                { icon: RotateCcw, title: "استبدال سهل", desc: "خلال 14 يوم" },
              ].map((item) => (
                <div key={item.title} className="border border-border bg-card p-3">
                  <item.icon className="h-4 w-4" style={{ color }} />
                  <div className="mt-2 text-[11px] font-bold text-foreground">{item.title}</div>
                  <div className="mt-0.5 text-[10px] text-muted">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
              <span>السعر شامل الضريبة</span>
              <span className="h-3 w-px bg-border" aria-hidden="true" />
              <span>{product.stock > 0 ? `${product.stock} قطعة متاحة` : "غير متوفر حاليًا"}</span>
            </div>

            <Link
              href={`${base || "/"}#products`}
              className="mt-7 inline-flex items-center gap-1.5 border-b border-primary pb-1 text-[10px] font-bold tracking-[0.1em] text-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              العودة للمتجر
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="store-eyebrow text-[10px] font-bold uppercase text-primary">
                  You may also like
                </span>
                <h2 className="store-heading mt-2 text-2xl font-semibold text-foreground">
                  منتجات مشابهة
                </h2>
              </div>
              <Link
                href={`${base || "/"}#products`}
                className="inline-flex items-center gap-1.5 border-b border-primary pb-1 text-[10px] font-bold tracking-[0.1em] text-foreground transition-colors hover:text-primary"
              >
                كل المنتجات
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className={`grid gap-x-3 gap-y-9 sm:gap-x-5 ${storeGridClass(config.gridCols)}`}>
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  storeSlug={store.slug}
                  base={base}
                  currency={store.currency}
                  cardStyle={config.cardStyle}
                  align={config.productAlign}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <StoreFooter
        store={{
          name: store.name,
          slug: store.slug,
          logo: store.logo,
          phone: store.phone,
          description: store.description,
          currency: store.currency,
        }}
        base={base}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        footerStyle={config.footerStyle}
        showNewsletter={config.showNewsletter}
      />
    </div>
  );
}
