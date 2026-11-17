import Link from "next/link";
import { ArrowUpRight, Heart, MessageCircle, Phone, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

export type StoreFooterData = {
  name: string;
  slug: string;
  logo?: string | null;
  phone?: string | null;
  description?: string | null;
  currency: string;
};

export default function StoreFooter({
  store,
  base,
  categories = [],
}: {
  store: StoreFooterData;
  base: string;
  categories?: { id: string; name: string }[];
}) {
  const home = base || "/";
  const wa = whatsappUrl(store.phone);
  const payments =
    store.currency === "EGP"
      ? ["الدفع عند الاستلام", "إنستاباي", "فودافون كاش", "فوري", "ميزة"]
      : ["الدفع عند الاستلام", "Visa", "Mastercard"];

  return (
    <footer className="mt-14 border-t border-border bg-card">
      {/* Contact band */}
      <div className="border-b border-border bg-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 text-center sm:flex-row sm:px-6 sm:text-start lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-extrabold sm:text-base">عندك سؤال قبل ما تشتري؟</div>
              <div className="text-[11px] text-white/80">كلمنا على واتساب وهنساعدك تختار طلبك.</div>
            </div>
          </div>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius,0.75rem)] bg-white px-5 py-2.5 text-xs font-extrabold text-primary shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <Phone className="h-4 w-4" />
              تواصل واتساب
            </a>
          ) : (
            <Link
              href={`${home}#products`}
              className="inline-flex items-center gap-2 rounded-[var(--store-btn-radius,0.75rem)] bg-white px-5 py-2.5 text-xs font-extrabold text-primary shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="h-4 w-4" />
              ابدأ التسوق
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href={home} className="flex items-center gap-2.5">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo}
                alt={store.name}
                className="h-11 w-11 rounded-[var(--store-radius,1rem)] border border-border bg-card object-cover shadow-sm"
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-[var(--store-radius,1rem)] bg-primary text-lg font-extrabold text-white shadow-sm">
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
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted">
            {store.description || "منتجات مختارة بعناية، أسعار مناسبة، وشحن لكل محافظات مصر."}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {payments.map((payment) => (
              <span
                key={payment}
                className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-muted"
              >
                {payment}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">روابط سريعة</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted">
            <li>
              <Link href={home} className="transition-colors hover:text-primary">
                الرئيسية
              </Link>
            </li>
            <li>
              <Link href={`${home}#products`} className="transition-colors hover:text-primary">
                كل المنتجات
              </Link>
            </li>
            <li>
              <Link href={`${base}/cart`} className="transition-colors hover:text-primary">
                سلة المشتريات
              </Link>
            </li>
            <li>
              <Link href={`${home}#why-us`} className="transition-colors hover:text-primary">
                ليه تشتري مننا؟
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">الأقسام</h3>
          {categories.length > 0 ? (
            <ul className="mt-3 space-y-2 text-xs text-muted">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`${home}?category=${category.id}#products`}
                    className="transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted">الأقسام هتظهر هنا أول ما تتضاف.</p>
          )}
        </div>

        {/* Contact / trust */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">خدمة العملاء</h3>
          <ul className="mt-3 space-y-3 text-xs text-muted">
            <li className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>شحن سريع لكل محافظات مصر خلال 2-5 أيام عمل.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>دفع عند الاستلام ومراجعة الطلب قبل الدفع.</span>
            </li>
            {wa && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={wa} target="_blank" rel="noreferrer" className="transition-colors hover:text-primary" dir="ltr">
                  {store.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:flex-row sm:px-6 sm:text-start lg:px-8">
          <p className="text-[11px] text-muted">
            © 2026 {store.name} · جميع الحقوق محفوظة · صُنع بـ <Heart className="inline h-3 w-3 text-rose-500" /> في مصر
          </p>
          <a
            href="https://beepanal.store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-muted transition-colors hover:text-primary"
          >
            مدعوم بواسطة Bee Panal
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
