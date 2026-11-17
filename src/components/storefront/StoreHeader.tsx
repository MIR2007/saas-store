import Link from "next/link";
import { Menu, Phone, Search, ShoppingBag } from "lucide-react";
import CartLink from "@/components/storefront/CartLink";
import { whatsappUrl } from "@/lib/whatsapp";

export type StoreHeaderData = {
  name: string;
  slug: string;
  logo?: string | null;
  phone?: string | null;
};

export default function StoreHeader({
  store,
  base,
  categories = [],
  announcement = "",
  showAnnouncement = true,
  headerStyle = "centered",
}: {
  store: StoreHeaderData;
  base: string;
  categories?: { id: string; name: string }[];
  announcement?: string;
  showAnnouncement?: boolean;
  headerStyle?: "centered" | "split";
}) {
  const home = base || "/";
  const wa = whatsappUrl(store.phone);
  const initial = store.name.trim().charAt(0) || "B";

  const brand = (
    <Link
      href={home}
      className={
        headerStyle === "centered"
          ? "flex min-w-0 flex-col items-center gap-1.5"
          : "flex min-w-0 items-center gap-2.5"
      }
    >
      {store.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.logo}
          alt={store.name}
          className={
            headerStyle === "centered"
              ? "h-9 w-9 object-contain sm:h-10 sm:w-10"
              : "h-10 w-10 object-contain"
          }
        />
      ) : (
        <span
          className={`grid shrink-0 place-items-center border border-primary/40 bg-primary/10 store-heading font-semibold text-primary ${
            headerStyle === "centered"
              ? "h-9 w-9 text-sm sm:h-10 sm:w-10 sm:text-base"
              : "h-10 w-10 text-base"
          }`}
        >
          {initial}
        </span>
      )}
      <span className="min-w-0 text-center">
        <span
          className={`store-heading block truncate font-semibold tracking-[0.18em] text-foreground ${
            headerStyle === "centered" ? "max-w-[52vw] text-sm sm:text-lg" : "max-w-[42vw] text-base sm:text-lg"
          }`}
        >
          {store.name}
        </span>
        <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.32em] text-muted">
          Bee Panal Store
        </span>
      </span>
    </Link>
  );

  const searchPanel = (
    <details className="group relative">
      <summary
        aria-label="بحث"
        className="grid h-10 w-10 cursor-pointer list-none place-items-center text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden"
      >
        <Search className="h-[18px] w-[18px]" />
      </summary>
      <form
        action={home || undefined}
        method="get"
        className="absolute start-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] border border-border bg-card p-3 shadow-2xl shadow-black/10"
      >
        <input
          name="q"
          placeholder="ابحث عن منتج…"
          className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          className="mt-2 w-full bg-foreground py-2.5 text-[11px] font-bold tracking-[0.12em] text-background transition-opacity hover:opacity-85"
        >
          بحث
        </button>
      </form>
    </details>
  );

  const mobileMenu = (
    <details className="group relative md:hidden">
      <summary
        aria-label="القائمة"
        className="grid h-10 w-10 cursor-pointer list-none place-items-center text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden"
      >
        <Menu className="h-5 w-5" />
      </summary>
      <div className="absolute start-0 top-12 z-50 w-[min(17rem,calc(100vw-2rem))] border border-border bg-card p-5 shadow-2xl shadow-black/10">
        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
          القائمة
        </div>
        <nav className="space-y-3.5 text-sm font-semibold text-foreground">
          <Link href={home} className="block transition-colors hover:text-primary">
            الرئيسية
          </Link>
          <Link href={`${home}#products`} className="block transition-colors hover:text-primary">
            كل المنتجات
          </Link>
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`${home}?category=${category.id}#products`}
              className="block transition-colors hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
          <Link href={`${base}/cart`} className="block border-t border-border pt-3 transition-colors hover:text-primary">
            سلة المشتريات
          </Link>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 border-t border-border pt-3 text-primary"
            >
              <Phone className="h-4 w-4" />
              تواصل واتساب
            </a>
          )}
        </nav>
      </div>
    </details>
  );

  const desktopNav = (
    <nav className="hidden items-center gap-6 text-[11px] font-bold tracking-[0.08em] text-muted md:flex">
      <Link href={home} className="transition-colors hover:text-foreground">
        الرئيسية
      </Link>
      <Link href={`${home}#products`} className="transition-colors hover:text-foreground">
        كل المنتجات
      </Link>
      {categories.slice(0, 5).map((category) => (
        <Link
          key={category.id}
          href={`${home}?category=${category.id}#products`}
          className="transition-colors hover:text-foreground"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {showAnnouncement && announcement && (
        <div className="bg-[#111111] text-[#f3eee4]">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[10px] font-semibold leading-relaxed tracking-[0.08em] sm:text-[11px]">
            <span className="h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>{announcement}</span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-xl">
        {headerStyle === "centered" ? (
          <>
            <div className="mx-auto grid h-[84px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-0.5">
                {mobileMenu}
                {searchPanel}
                <Link
                  href={`${home}#products`}
                  className="ms-2 hidden items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-muted transition-colors hover:text-foreground lg:inline-flex"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  تسوق الآن
                </Link>
              </div>

              {brand}

              <div className="flex items-center justify-end gap-0.5">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="واتساب"
                    className="grid h-10 w-10 place-items-center text-foreground transition-colors hover:text-primary"
                  >
                    <Phone className="h-[18px] w-[18px]" />
                  </a>
                )}
                <CartLink slug={store.slug} base={base} />
              </div>
            </div>

            <div className="hidden border-t border-border/70 md:block">
              <div className="mx-auto flex max-w-7xl items-center justify-center gap-7 px-4 py-2.5 lg:px-8">
                {desktopNav}
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              {mobileMenu}
              {brand}
            </div>
            {desktopNav}
            <div className="flex shrink-0 items-center gap-1">
              {searchPanel}
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="واتساب"
                  className="grid h-10 w-10 place-items-center text-foreground transition-colors hover:text-primary"
                >
                  <Phone className="h-[18px] w-[18px]" />
                </a>
              )}
              <CartLink slug={store.slug} base={base} />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
