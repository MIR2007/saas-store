import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import StoreClosed from "@/components/storefront/StoreClosed";
import ViewTracker from "@/components/storefront/ViewTracker";
import { storeIsLive } from "@/lib/store-status";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Headphones,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { formatMoney, formatNumber } from "@/lib/format";
import { storePublicUrl } from "@/lib/domains";
import { getStoreBase } from "@/lib/store-url";
import { getStoreTheme, parseThemeConfig, storeGridClass } from "@/lib/themes";
import { whatsappUrl } from "@/lib/whatsapp";

function firstImage(raw?: string | null) {
  try {
    const images = JSON.parse(raw || "[]");
    return Array.isArray(images) ? images[0] || "" : "";
  } catch {
    return "";
  }
}

export default async function StoreHome(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const categoryFilter =
    typeof searchParams.category === "string" ? searchParams.category : undefined;
  const query =
    typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 80) : "";

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  if (!storeIsLive(store)) {
    return <StoreClosed store={{ name: store.name, logo: store.logo, phone: store.phone }} />;
  }

  const [allProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, active: true },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } }),
  ]);

  const normalizedQuery = query.toLowerCase();
  const products = allProducts.filter((product) => {
    const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
    const matchesQuery =
      !normalizedQuery ||
      `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
  const activeCategory = categories.find((category) => category.id === categoryFilter);
  const theme = getStoreTheme(store.theme);
  const config = parseThemeConfig(store.themeConfig);
  const color = config.colors.primary || store.themeColor || theme.primary;
  const base = await getStoreBase(store.slug, store.customDomain);
  const wa = whatsappUrl(store.phone);
  const initial = store.name.trim().charAt(0) || "B";

  const heroImages = [
    ...allProducts.map((product) => firstImage(product.images)),
    ...categories.map((category) => category.image),
  ]
    .filter(Boolean)
    .slice(0, 3);
  const heroImage = config.heroImage || heroImages[0] || "";

  const countFor = (categoryId: string) =>
    allProducts.filter((product) => product.categoryId === categoryId).length;

  const storeUrl = storePublicUrl(store.slug, store.customDomain, store.customDomainStatus);
  let logoUrl: string | undefined;
  if (store.logo) {
    try {
      logoUrl = new URL(store.logo, storeUrl).toString();
    } catch {
      logoUrl = undefined;
    }
  }
  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description:
      store.description ||
      `تسوق من ${store.name} أونلاين — دفع عند الاستلام وشحن سريع لكل محافظات مصر.`,
    url: storeUrl,
    image: logoUrl,
    telephone: store.phone || undefined,
    currenciesAccepted: store.currency || "EGP",
    paymentAccepted: "Cash on Delivery",
    address: { "@type": "PostalAddress", addressCountry: "EG" },
  };

  const defaultAnnouncement =
    store.freeShippingThreshold > 0
      ? `شحن مجاني للطلبات فوق ${formatMoney(store.freeShippingThreshold, store.currency)} — الدفع عند الاستلام`
      : "شحن سريع لكل محافظات مصر — الدفع عند الاستلام";
  const announcement = config.announcement || defaultAnnouncement;

  const heroTitle = config.heroTitle || store.name;
  const heroSubtitle =
    config.heroSubtitle ||
    store.description ||
    "تشكيلة مختارة بعناية من المنتجات التي تجمع بين الأناقة والجودة. اطلب دلوقتي واستلم عند باب البيت.";
  const heroBadge = config.heroBadge || "تشكيلة جديدة";

  const trustItems = [
    { icon: Truck, title: "شحن سريع", desc: "لكل محافظات مصر" },
    { icon: ShieldCheck, title: "دفع عند الاستلام", desc: "افحص قبل ما تدفع" },
    { icon: RotateCcw, title: "استبدال سهل", desc: "خلال 14 يوم" },
    { icon: Headphones, title: "دعم واتساب", desc: "معاك قبل وبعد الطلب" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <ViewTracker slug={store.slug} />
      <StoreHeader
        store={{ name: store.name, slug: store.slug, logo: store.logo, phone: store.phone }}
        base={base}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        announcement={announcement}
        showAnnouncement={config.announcementEnabled}
        headerStyle={config.headerStyle}
      />

      <main>
        {config.showHero && (
          <section className="relative overflow-hidden bg-[#0d0d0d] text-white">
            {theme.pattern !== "none" && (
              <div
                className={`pointer-events-none absolute inset-0 opacity-[0.06] store-pattern-${theme.pattern}`}
                aria-hidden="true"
              />
            )}
            <div
              className="pointer-events-none absolute -start-24 top-1/3 h-72 w-72 rounded-full blur-3xl"
              style={{ backgroundColor: `${color}22` }}
              aria-hidden="true"
            />
            <div className="relative mx-auto grid max-w-7xl lg:grid-cols-2">
              <div className="flex flex-col justify-center px-5 py-14 sm:px-8 lg:py-20 lg:pe-16">
                <span className="store-eyebrow inline-flex items-center gap-2 text-[10px] font-bold uppercase text-primary">
                  <span className="h-px w-8 bg-primary" aria-hidden="true" />
                  {heroBadge}
                </span>
                <h1 className="store-heading mt-5 max-w-xl text-4xl font-semibold leading-[1.12] sm:text-5xl lg:text-6xl">
                  {heroTitle}
                </h1>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65 sm:text-[15px]">
                  {heroSubtitle}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`${base}#products`}
                    className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius)] bg-primary px-7 py-3.5 text-[11px] font-bold tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    تسوق الآن
                  </Link>
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius)] border border-white/25 px-7 py-3.5 text-[11px] font-bold tracking-[0.12em] text-white transition-colors hover:border-primary hover:text-primary"
                    >
                      <MessageCircle className="h-4 w-4" />
                      اسأل على واتساب
                    </a>
                  ) : (
                    <Link
                      href={`${base}#categories`}
                      className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius)] border border-white/25 px-7 py-3.5 text-[11px] font-bold tracking-[0.12em] text-white transition-colors hover:border-primary hover:text-primary"
                    >
                      <Boxes className="h-4 w-4" />
                      شوف الأقسام
                    </Link>
                  )}
                </div>

                <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-[10px] font-semibold tracking-wide text-white/55">
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                    {formatNumber(allProducts.length)} منتج متاح
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Boxes className="h-3.5 w-3.5 text-primary" />
                    {formatNumber(categories.length)} قسم
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    شحن لكل المحافظات
                  </span>
                </div>
              </div>

              <div className="relative min-h-[300px] overflow-hidden sm:min-h-[420px] lg:min-h-[580px]">
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImage} alt={store.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#2a241c,transparent_62%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent lg:bg-gradient-to-l" />

                {!heroImage && store.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="absolute inset-0 m-auto h-28 w-28 object-contain opacity-80"
                  />
                )}
                {!heroImage && !store.logo && (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="store-heading text-7xl font-semibold tracking-[0.2em] text-primary/50">
                      {initial}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-5 start-5 border border-white/20 bg-black/35 px-4 py-3 backdrop-blur">
                  <div className="store-eyebrow text-[9px] font-bold uppercase text-primary">Bee Panal</div>
                  <div className="mt-1 text-xs font-semibold text-white">تجربة تسوق فاخرة</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {config.showTrust && (
          <section className="border-b border-border bg-card">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-6 px-4 py-7 sm:px-6 md:grid-cols-4 lg:px-8">
              {trustItems.map((item) => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-primary/25 bg-primary/[0.06] text-primary">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-foreground">{item.title}</div>
                    <div className="mt-0.5 text-[10px] text-muted">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {config.showCategories && categories.length > 0 && (
          <section id="categories" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="store-eyebrow text-[10px] font-bold uppercase text-primary">
                  Collections
                </span>
                <h2 className="store-heading mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  تسوق حسب القسم
                </h2>
              </div>
              <Link
                href={`${base}#products`}
                className="inline-flex shrink-0 items-center gap-1.5 border-b border-primary pb-1 text-[10px] font-bold tracking-[0.1em] text-foreground transition-colors hover:text-primary"
              >
                كل المنتجات
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`${base}?category=${category.id}#products`}
                  className="group relative block overflow-hidden bg-surface"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    {category.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}
                      >
                        <span className="store-heading text-5xl font-semibold" style={{ color }}>
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <div className="store-heading text-sm font-semibold tracking-[0.08em] text-white sm:text-base">
                      {category.name}
                    </div>
                    <div className="mt-1 text-[10px] text-white/65">
                      {formatNumber(countFor(category.id))} منتج
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 border-b border-primary pb-0.5 text-[9px] font-bold tracking-[0.16em] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      تسوق الآن
                      <ArrowLeft className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="products" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="store-eyebrow text-[10px] font-bold uppercase text-primary">
                {query ? "Search" : "The Edit"}
              </span>
              <h2 className="store-heading mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                {query
                  ? `نتائج البحث عن «${query}»`
                  : activeCategory
                    ? activeCategory.name
                    : "كل منتجات المتجر"}
              </h2>
              <p className="mt-1.5 text-xs text-muted">
                {query
                  ? `${formatNumber(products.length)} نتيجة مطابقة`
                  : "اختار اللي يعجبك وضيفه للسلة في ثانية."}
              </p>
            </div>
            <span className="border border-border px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-muted">
              {formatNumber(products.length)} منتج
            </span>
          </div>

          {categories.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-3.5">
              <Link
                href={`${base}#products`}
                className={`border-b-2 pb-1 text-[10px] font-bold tracking-[0.08em] transition-colors ${
                  !categoryFilter && !query
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                كل المنتجات
              </Link>
              {categories.map((category) => {
                const active = categoryFilter === category.id;
                return (
                  <Link
                    key={category.id}
                    href={`${base}?category=${category.id}#products`}
                    className={`border-b-2 pb-1 text-[10px] font-bold tracking-[0.08em] transition-colors ${
                      active
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          )}

          {products.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-6 py-20 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center border border-border bg-surface text-muted">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <h3 className="store-heading mt-5 text-lg font-semibold text-foreground">
                {query ? "مفيش نتائج مطابقة" : "لسه مفيش منتجات هنا"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                {query
                  ? "جرّب كلمة بحث تانية أو شوف كل المنتجات."
                  : categoryFilter
                    ? "القسم ده لسه بيتجهّز. جرّب تشوف باقي المنتجات."
                    : "صاحب المتجر لسه بيجهّز المنتجات. ارجع تاني قريب إن شاء الله."}
              </p>
              {(query || categoryFilter) && (
                <Link
                  href={`${base}#products`}
                  className="mt-6 inline-flex items-center gap-1.5 border-b border-primary pb-1 text-[11px] font-bold text-foreground transition-colors hover:text-primary"
                >
                  شوف كل المنتجات
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className={`grid gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-11 ${storeGridClass(config.gridCols)}`}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                  base={base}
                  currency={store.currency}
                  cardStyle={config.cardStyle}
                  align={config.productAlign}
                />
              ))}
            </div>
          )}
        </section>

        {config.showWhy && (
          <section id="why-us" className="scroll-mt-28 border-t border-border bg-surface">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                <div>
                  <span className="store-eyebrow text-[10px] font-bold uppercase text-primary">
                    The Promise
                  </span>
                  <h2 className="store-heading mt-3 text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                    ليه تشتري من {store.name}؟
                  </h2>
                  <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted sm:text-sm">
                    بنهتم بتجربة الشراء من أول ما تختار لحد ما الطلب يوصل لباب البيت.
                  </p>
                  <Link
                    href={`${base}#products`}
                    className="mt-6 inline-flex items-center gap-2 border-b border-primary pb-1 text-[10px] font-bold tracking-[0.12em] text-foreground transition-colors hover:text-primary"
                  >
                    ابدأ التسوق
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      icon: BadgeCheck,
                      title: "منتجات أصلية",
                      desc: "بنختار المنتجات بعناية ونتأكد من جودتها قبل ما توصلك.",
                    },
                    {
                      icon: PackageCheck,
                      title: "أسعار مناسبة",
                      desc: "أسعار واضحة من غير مفاجآت، وعروض على منتجات مختارة.",
                    },
                    {
                      icon: MessageCircle,
                      title: "خدمة سريعة",
                      desc: "فريقنا معاك على واتساب للرد على أي سؤال قبل وبعد الطلب.",
                    },
                  ].map((item, index) => (
                    <div key={item.title} className="border-t border-foreground/15 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="store-heading text-3xl font-semibold text-primary/70">
                          0{index + 1}
                        </span>
                        <item.icon className="h-4 w-4 text-muted" />
                      </div>
                      <h3 className="mt-4 text-sm font-bold text-foreground">{item.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-3">
                {[
                  { step: "1", title: "اختار منتجاتك", desc: "ضيف اللي يعجبك للسلة." },
                  { step: "2", title: "أكد طلبك", desc: "اكتب بياناتك واختار المحافظة." },
                  { step: "3", title: "استلم وادفع", desc: "الشحن بيوصلك وبتدفع عند الاستلام." },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/40 text-[11px] font-bold text-primary">
                      {item.step}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-foreground">{item.title}</div>
                      <div className="text-[10px] text-muted">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-[#0d0d0d] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-12 text-center sm:flex-row sm:px-6 sm:text-start lg:px-8">
            <div>
              <span className="store-eyebrow text-[10px] font-bold uppercase text-primary">Ready?</span>
              <h2 className="store-heading mt-2 text-2xl font-semibold">جاهز تطلب دلوقتي؟</h2>
              <p className="mt-1.5 text-xs text-white/55">اختار منتجاتك وأكد الطلب في أقل من دقيقة.</p>
            </div>
            <Link
              href={`${base}#products`}
              className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius)] bg-primary px-7 py-3.5 text-[11px] font-bold tracking-[0.14em] text-white transition-opacity hover:opacity-90"
            >
              <ShoppingBag className="h-4 w-4" />
              ابدأ التسوق
            </Link>
          </div>
        </section>
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
