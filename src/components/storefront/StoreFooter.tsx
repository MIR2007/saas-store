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
  footerStyle = "dark",
  showNewsletter = true,
}: {
  store: StoreFooterData;
  base: string;
  categories?: { id: string; name: string }[];
  footerStyle?: "dark" | "light";
  showNewsletter?: boolean;
}) {
  const home = base || "/";
  const wa = whatsappUrl(store.phone);
  const dark = footerStyle === "dark";
  const payments =
    store.currency === "EGP"
      ? ["الدفع عند الاستلام", "إنستاباي", "فودافون كاش", "فوري", "ميزة"]
      : ["الدفع عند الاستلام", "Visa", "Mastercard"];

  return (
    <footer className={`mt-0 ${dark ? "bg-[#0d0d0d] text-white" : "border-t border-border bg-card text-foreground"}`}>
      {showNewsletter && (
        <div className={`border-b ${dark ? "border-white/10" : "border-border"}`}>
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:py-16">
            <div>
              <div className="store-eyebrow text-[10px] font-bold uppercase text-primary">
                {store.name} — Newsletter
              </div>
              <h2 className="store-heading mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
                كن أول من يعرف عن الجديد
              </h2>
              <p className={`mt-3 max-w-md text-xs leading-relaxed sm:text-sm ${dark ? "text-white/60" : "text-muted"}`}>
                تشكيلات جديدة وعروض مختارة. تواصل معنا على واتساب وخلّينا نوصلك بأحدث المنتجات.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:justify-end">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--store-btn-radius)] bg-primary px-6 py-3.5 text-[11px] font-bold tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  تواصل واتساب
                </a>
              ) : (
                <Link
                  href={`${home}#products`}
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--store-btn-radius)] bg-primary px-6 py-3.5 text-[11px] font-bold tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                >
                  <ShoppingBag className="h-4 w-4" />
                  ابدأ التسوق
                </Link>
              )}
              <Link
                href={`${home}#products`}
                className={`inline-flex items-center justify-center gap-2 rounded-[var(--store-btn-radius)] border px-6 py-3.5 text-[11px] font-bold tracking-[0.12em] transition-colors ${
                  dark
                    ? "border-white/25 text-white hover:border-primary hover:text-primary"
                    : "border-border text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                كل المنتجات
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href={home} className="flex items-center gap-3">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo}
                alt={store.name}
                className="h-11 w-11 object-contain"
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center border border-primary/50 bg-primary/10 store-heading text-lg font-semibold text-primary">
                {store.name.charAt(0)}
              </span>
            )}
            <span className="min-w-0">
              <span className="store-heading block truncate text-base font-semibold tracking-[0.16em]">
                {store.name}
              </span>
              <span className={`block text-[8px] font-bold uppercase tracking-[0.3em] ${dark ? "text-white/45" : "text-muted"}`}>
                Bee Panal Store
              </span>
            </span>
          </Link>
          <p className={`mt-4 max-w-xs text-xs leading-relaxed ${dark ? "text-white/55" : "text-muted"}`}>
            {store.description || "منتجات مختارة بعناية، أسعار مناسبة، وشحن لكل محافظات مصر."}
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {payments.map((payment) => (
              <span
                key={payment}
                className={`border px-2 py-1 text-[9px] font-semibold ${
                  dark ? "border-white/15 text-white/60" : "border-border bg-surface text-muted"
                }`}
              >
                {payment}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="store-eyebrow text-[10px] font-bold uppercase text-primary">روابط سريعة</h3>
          <ul className={`mt-4 space-y-2.5 text-xs ${dark ? "text-white/60" : "text-muted"}`}>
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

        <div>
          <h3 className="store-eyebrow text-[10px] font-bold uppercase text-primary">الأقسام</h3>
          {categories.length > 0 ? (
            <ul className={`mt-4 space-y-2.5 text-xs ${dark ? "text-white/60" : "text-muted"}`}>
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
            <p className={`mt-4 text-xs ${dark ? "text-white/50" : "text-muted"}`}>
              الأقسام هتظهر هنا أول ما تتضاف.
            </p>
          )}
        </div>

        <div>
          <h3 className="store-eyebrow text-[10px] font-bold uppercase text-primary">خدمة العملاء</h3>
          <ul className={`mt-4 space-y-3.5 text-xs ${dark ? "text-white/60" : "text-muted"}`}>
            <li className="flex items-start gap-2.5">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>شحن سريع لكل محافظات مصر خلال 2-5 أيام عمل.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>دفع عند الاستلام ومراجعة الطلب قبل الدفع.</span>
            </li>
            {wa && (
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={wa} target="_blank" rel="noreferrer" className="transition-colors hover:text-primary" dir="ltr">
                  {store.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className={`border-t ${dark ? "border-white/10" : "border-border"}`}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:flex-row sm:px-6 sm:text-start lg:px-8">
          <p className={`text-[10px] tracking-wide ${dark ? "text-white/40" : "text-muted"}`}>
            © 2026 {store.name} · جميع الحقوق محفوظة · صُنع بـ{" "}
            <Heart className="inline h-3 w-3 text-rose-400" /> في مصر
          </p>
          <a
            href="https://beepanal.store"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary transition-opacity hover:opacity-80"
          >
            مدعوم بواسطة Bee Panal
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
