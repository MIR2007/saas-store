import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import CartLink from "@/components/storefront/CartLink";
import Link from "next/link";
import { ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { getStoreBase } from "@/lib/store-url";

export default async function StoreHome(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const categoryFilter = (searchParams as any)?.category as string | undefined;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.active) notFound();

  const products = await prisma.product.findMany({
    where: { storeId: store.id, active: true, ...(categoryFilter ? { categoryId: categoryFilter } : {}) },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  const categories = await prisma.category.findMany({ where: { storeId: store.id } });
  const color = store.themeColor || "#d97706";
  const base = await getStoreBase(store.slug, store.customDomain);

  return (
    <div className="min-h-screen bg-surface">
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`${base}` || "/"} className="flex items-center gap-2.5">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-base font-extrabold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {store.name.charAt(0)}
            </span>
            <span className="font-extrabold text-foreground">{store.name}</span>
          </Link>
          <CartLink slug={store.slug} base={base} />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div
          className="absolute -end-24 -top-28 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: `${color}22` }}
        />
        <div
          className="absolute -bottom-32 start-1/4 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: `${color}14` }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              متجر إلكتروني مصري
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {store.name}
            </h1>
            {store.description && (
              <p className="mt-3 max-w-xl leading-relaxed text-muted">{store.description}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4" style={{ color }} />
                شحن لكل محافظات مصر
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" style={{ color }} />
                دفع عند الاستلام
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" style={{ color }} />
                {formatNumber(products.length)} منتج متاح
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href={`${base}` || "/"}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                !categoryFilter
                  ? "text-white shadow-sm"
                  : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
              }`}
              style={!categoryFilter ? { backgroundColor: color } : undefined}
            >
              كل المنتجات
            </Link>
            {categories.map((c) => {
              const active = categoryFilter === c.id;
              return (
                <Link
                  key={c.id}
                  href={`${base}?category=${c.id}`}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                    active
                      ? "text-white shadow-sm"
                      : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
                  }`}
                  style={active ? { backgroundColor: color } : undefined}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        )}

        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              {categoryFilter ? "منتجات القسم" : "كل منتجات المتجر"}
            </h2>
            <p className="text-xs text-muted">اختار اللي يعجبك وضيفه للسلة في ثانية.</p>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold text-muted">
            {formatNumber(products.length)} منتج
          </span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface text-muted">
              <ShoppingBag className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-foreground">لسه مفيش منتجات هنا</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              صاحب المتجر لسه بيجهّز المنتجات. ارجع تاني قريب إن شاء الله.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} storeSlug={store.slug} base={base} currency={store.currency} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-10 border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold text-white"
              style={{ backgroundColor: color }}
            >
              {store.name.charAt(0)}
            </span>
            <div>
              <div className="text-sm font-extrabold text-foreground">{store.name}</div>
              <div className="text-[10px] text-muted">بيشتغل بـ Bee Panal</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {(store.currency === "EGP"
              ? ["الدفع عند الاستلام", "فوري", "إنستاباي", "فودافون كاش", "ميزة"]
              : ["الدفع عند الاستلام", "Visa", "Mastercard"]
            ).map((p) => (
              <span
                key={p}
                className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-muted"
              >
                {p}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted">
            © 2026 {store.name} · صُنع بـ ❤️ في مصر
          </p>
        </div>
      </footer>
    </div>
  );
}
