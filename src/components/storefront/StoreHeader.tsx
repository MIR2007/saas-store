import Link from "next/link";
import { Phone, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
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
}: {
  store: StoreHeaderData;
  base: string;
  categories?: { id: string; name: string }[];
}) {
  const home = base || "/";
  const wa = whatsappUrl(store.phone);

  return (
    <>
      <div className="border-b border-border bg-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-1.5 text-[10px] font-bold sm:justify-between sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-3 w-3" />
            شحن سريع لكل المحافظات
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            دفع عند الاستلام
          </span>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              اطلب على واتساب
            </a>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={home} className="flex min-w-0 items-center gap-2.5">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo}
                alt={store.name}
                className="h-10 w-10 shrink-0 rounded-[var(--store-radius,1rem)] border border-border bg-card object-cover shadow-sm"
              />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--store-radius,1rem)] bg-primary text-base font-extrabold text-white shadow-sm">
                {store.name.charAt(0)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-extrabold text-foreground">{store.name}</span>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-muted">
                متجر إلكتروني
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href={home} className="rounded-lg px-3 py-2 text-xs font-bold text-muted transition-colors hover:bg-surface hover:text-foreground">
              الرئيسية
            </Link>
            <Link href={`${home}#products`} className="rounded-lg px-3 py-2 text-xs font-bold text-muted transition-colors hover:bg-surface hover:text-foreground">
              المنتجات
            </Link>
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`${home}?category=${category.id}#products`}
                className="rounded-lg px-3 py-2 text-xs font-bold text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`${home}#products`}
              className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-black/10 transition-colors hover:bg-primary-dark sm:inline-flex"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              تسوق الآن
            </Link>
            <CartLink slug={store.slug} base={base} />
          </div>
        </div>
      </header>
    </>
  );
}
