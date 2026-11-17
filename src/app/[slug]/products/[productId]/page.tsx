import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import { formatMoney } from "@/lib/format";
import { getStoreBase } from "@/lib/store-url";
import { getStoreTheme } from "@/lib/themes";
import { ChevronLeft, RotateCcw, ShieldCheck, Truck } from "lucide-react";

export default async function ProductDetailPage(props: PageProps<"/[slug]/products/[productId]">) {
  const { slug, productId } = await props.params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.active) notFound();

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

  const theme = getStoreTheme(store.theme);
  const color = store.themeColor || theme.primary;
  const base = await getStoreBase(store.slug, store.customDomain);
  const onSale = product.comparePrice && product.comparePrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.comparePrice!) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface">
      <StoreHeader
        store={{ name: store.name, slug: store.slug, logo: store.logo, phone: store.phone }}
        base={base}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted">
          <Link href={base || "/"} className="transition-colors hover:text-foreground">
            المتجر
          </Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          {product.category && (
            <>
              <Link
                href={`${base}?category=${product.category.id}#products`}
                className="transition-colors hover:text-foreground"
              >
                {product.category.name}
              </Link>
              <ChevronLeft className="h-3.5 w-3.5" />
            </>
          )}
          <span className="truncate font-semibold text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-[var(--store-radius,1.5rem)] border border-border bg-card shadow-sm">
              {images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-7xl text-muted">🛍️</div>
              )}
              {onSale && (
                <span className="absolute start-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-extrabold text-white shadow-md">
                  خصم {discount}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={index}
                    src={img}
                    alt=""
                    className="aspect-square w-full rounded-xl border border-border object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {product.category.name}
                </span>
              )}
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                  product.stock > 0
                    ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                    : "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300"
                }`}
              >
                {product.stock > 0 ? `متوفر · ${product.stock} قطعة` : "نفذ المخزون"}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-primary">
                {formatMoney(product.price, store.currency)}
              </span>
              {onSale && (
                <span className="text-lg text-muted line-through">
                  {formatMoney(product.comparePrice!, store.currency)}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
              <span>السعر شامل الضريبة</span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <Truck className="h-3.5 w-3.5 text-primary" />
                {product.shippingPrice > 0
                  ? `الشحن: ${formatMoney(product.shippingPrice, store.currency)}`
                  : "الشحن مجاني"}
              </span>
            </div>

            {product.description && (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            )}

            <div className="mt-7">
              <AddToCartButton product={product} storeSlug={store.slug} base={base} />
            </div>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "دفع عند الاستلام", desc: "افحص طلبك الأول" },
                { icon: Truck, title: "شحن سريع", desc: "2-5 أيام عمل" },
                { icon: RotateCcw, title: "استبدال سهل", desc: "خلال 14 يوم" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-3">
                  <item.icon className="h-4 w-4" style={{ color }} />
                  <div className="mt-1.5 text-[11px] font-bold text-foreground">{item.title}</div>
                  <div className="text-[10px] text-muted">{item.desc}</div>
                </div>
              ))}
            </div>

            <Link
              href={`${base}#products`}
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-muted transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
              العودة للمتجر
            </Link>
          </div>
        </div>
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
