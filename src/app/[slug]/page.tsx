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
  Sparkles,
  Truck,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { storePublicUrl } from "@/lib/domains";
import { getStoreBase } from "@/lib/store-url";
import { getStoreTheme } from "@/lib/themes";
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
  const searchParams = await props.searchParams;
  const categoryFilter = (searchParams as any)?.category as string | undefined;

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

  const products = categoryFilter
    ? allProducts.filter((product) => product.categoryId === categoryFilter)
    : allProducts;
  const activeCategory = categories.find((category) => category.id === categoryFilter);
  const theme = getStoreTheme(store.theme);
  const color = store.themeColor || theme.primary;
  const base = await getStoreBase(store.slug, store.customDomain);
  const wa = whatsappUrl(store.phone);

  const heroImages = allProducts
    .map((product) => firstImage(product.images))
    .filter(Boolean)
    .slice(0, 3);

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
      />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-card">
          {theme.pattern !== "none" && (
            <div
              className={`pointer-events-none absolute inset-0 opacity-50 store-pattern-${theme.pattern}`}
              aria-hidden="true"
            />
          )}
          <div
            className="absolute -end-24 -top-28 h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: `${color}22` }}
          />
          <div
            className="absolute -bottom-32 start-1/4 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: `${color}14` }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ backgroundColor: `${color}18`, color }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                متجر إلكتروني مصري · دفع عند الاستلام
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {store.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                {store.description ||
                  "اختار من منتجاتنا المختارة بعناية، واطلب دلوقتي واستلم عند باب البيت. شحن سريع ودفع عند الاستلام."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`${base}#products`}
                  className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius,0.75rem)] bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
                >
                  <ShoppingBag className="h-4 w-4" />
                  تسوق الآن
                </Link>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius,0.75rem)] border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <MessageCircle className="h-4 w-4" />
                    اسأل على واتساب
                  </a>
                ) : (
                  <Link
                    href={`${base}#categories`}
                    className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius,0.75rem)] border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Boxes className="h-4 w-4" />
                    شوف الأقسام
                  </Link>
                )}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4" style={{ color }} />
                  {formatNumber(allProducts.length)} منتج متاح
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Boxes className="h-4 w-4" style={{ color }} />
                  {formatNumber(categories.length)} قسم
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-4 w-4" style={{ color }} />
                  شحن لكل المحافظات
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-primary/10 blur-2xl" aria-hidden="true" />
              <div className="relative grid grid-cols-2 gap-3">
                {heroImages.length > 0 ? (
                  <>
                    <div className="col-span-2 aspect-[16/9] overflow-hidden rounded-[var(--store-radius,1rem)] border border-border bg-surface shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImages[0]} alt={store.name} className="h-full w-full object-cover" />
                    </div>
                    {heroImages.slice(1, 3).map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square overflow-hidden rounded-[var(--store-radius,1rem)] border border-border bg-surface shadow-lg"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="col-span-2 flex aspect-[16/10] flex-col items-center justify-center gap-4 rounded-[var(--store-radius,1rem)] border border-border bg-card p-8 text-center shadow-xl">
                    {store.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="h-24 w-24 rounded-[var(--store-radius,1.25rem)] border border-border object-cover shadow-md"
                      />
                    ) : (
                      <span
                        className="grid h-24 w-24 place-items-center rounded-[var(--store-radius,1.25rem)] text-4xl font-extrabold text-white shadow-md"
                        style={{ backgroundColor: color }}
                      >
                        {store.name.charAt(0)}
                      </span>
                    )}
                    <div>
                      <div className="text-lg font-extrabold text-foreground">{store.name}</div>
                      <div className="mt-1 text-xs text-muted">منتجات أصلية · أسعار مناسبة · خدمة سريعة</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-5 start-4 flex items-center gap-2.5 rounded-2xl border border-border bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[11px] font-extrabold text-foreground">تسوق بأمان</div>
                  <div className="text-[10px] text-muted">دفع عند الاستلام</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              { icon: Truck, title: "شحن سريع", desc: "لكل محافظات مصر" },
              { icon: ShieldCheck, title: "دفع عند الاستلام", desc: "افحص قبل ما تدفع" },
              { icon: RotateCcw, title: "استبدال سهل", desc: "خلال 14 يوم" },
              { icon: Headphones, title: "دعم واتساب", desc: "معاك قبل وبعد الطلب" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-2.5 rounded-[var(--store-radius,1rem)] border border-border bg-surface px-3 py-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-extrabold text-foreground">{item.title}</div>
                  <div className="truncate text-[10px] text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">تسوق حسب القسم</h2>
                <p className="mt-1 text-xs text-muted">اختار القسم اللي يناسبك ووصل للمنتج في ثانية.</p>
              </div>
              <Link
                href={`${base}#products`}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark"
              >
                كل المنتجات
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`${base}?category=${category.id}#products`}
                  className="group relative overflow-hidden rounded-[var(--store-radius,1rem)] border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    {category.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}
                      >
                        <span className="text-4xl font-extrabold" style={{ color }}>
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-white">{category.name}</div>
                        <div className="text-[10px] font-semibold text-white/80">
                          {formatNumber(countFor(category.id))} منتج
                        </div>
                      </div>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20 text-white backdrop-blur">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section id="products" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
                {activeCategory ? activeCategory.name : "كل منتجات المتجر"}
              </h2>
              <p className="mt-1 text-xs text-muted">اختار اللي يعجبك وضيفه للسلة في ثانية.</p>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold text-muted">
              {formatNumber(products.length)} منتج
            </span>
          </div>

          {categories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <Link
                href={`${base}#products`}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  !categoryFilter
                    ? "text-white shadow-sm"
                    : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
                }`}
                style={!categoryFilter ? { backgroundColor: color } : undefined}
              >
                <Boxes className="h-3.5 w-3.5" />
                كل المنتجات
              </Link>
              {categories.map((category) => {
                const active = categoryFilter === category.id;
                return (
                  <Link
                    key={category.id}
                    href={`${base}?category=${category.id}#products`}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      active
                        ? "text-white shadow-sm"
                        : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
                    }`}
                    style={active ? { backgroundColor: color } : undefined}
                  >
                    {category.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={category.image} alt="" className="h-5 w-5 rounded-full object-cover" />
                    )}
                    {category.name}
                  </Link>
                );
              })}
            </div>
          )}

          {products.length === 0 ? (
            <div className="rounded-[var(--store-radius,1.5rem)] border border-dashed border-border bg-card px-6 py-20 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface text-muted">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-foreground">لسه مفيش منتجات هنا</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {categoryFilter
                  ? "القسم ده لسه بيتجهّز. جرّب تشوف باقي المنتجات."
                  : "صاحب المتجر لسه بيجهّز المنتجات. ارجع تاني قريب إن شاء الله."}
              </p>
              {categoryFilter && (
                <Link
                  href={`${base}#products`}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white"
                >
                  شوف كل المنتجات
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                  base={base}
                  currency={store.currency}
                />
              ))}
            </div>
          )}
        </section>

        {/* Why us + steps */}
        <section id="why-us" className="scroll-mt-24 border-t border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="mb-7 text-center">
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">ليه تشتري من {store.name}؟</h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted">
                بنهتم بتجربة الشراء من أول ما تختار لحد ما الطلب يوصل لباب البيت.
              </p>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-3">
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
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--store-radius,1rem)] border border-border bg-surface p-5 text-center"
                >
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-extrabold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3.5 sm:grid-cols-3">
              {[
                { step: "1", title: "اختار منتجاتك", desc: "ضيف اللي يعجبك للسلة." },
                { step: "2", title: "أكد طلبك", desc: "اكتب بياناتك واختار المحافظة." },
                { step: "3", title: "استلم وادفع", desc: "الشحن بيوصلك وبتدفع عند الاستلام." },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-3 rounded-[var(--store-radius,1rem)] border border-border bg-card p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-white">
                    {item.step}
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-foreground">{item.title}</div>
                    <div className="text-[10px] text-muted">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[var(--store-radius,1.25rem)] border border-primary/20 bg-primary/5 p-5 text-center sm:flex-row sm:text-start">
              <div>
                <div className="text-sm font-extrabold text-foreground">جاهز تطلب دلوقتي؟</div>
                <div className="text-xs text-muted">اختار منتجاتك وأكد الطلب في أقل من دقيقة.</div>
              </div>
              <Link
                href={`${base}#products`}
                className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius,0.75rem)] bg-primary px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <ShoppingBag className="h-4 w-4" />
                ابدأ التسوق
              </Link>
            </div>
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
      />
    </div>
  );
}
