import Link from "next/link";
import { Clock, MessageCircle, Store } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

export default function StoreClosed({
  store,
}: {
  store: { name: string; logo?: string | null; phone?: string | null };
}) {
  const wa = whatsappUrl(store.phone);
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/20">
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo} alt={store.name} className="h-full w-full object-cover" />
          ) : (
            <Store className="h-9 w-9" />
          )}
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-foreground">{store.name}</h1>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
          <Clock className="h-3.5 w-3.5" />
          المتجر متوقف مؤقتًا
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          المتجر مش متاح لاستقبال الطلبات حاليًا. جرّب تاني بعد شوية أو تواصل مع صاحب المتجر.
        </p>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-black/10 transition-colors hover:bg-primary-dark"
          >
            <MessageCircle className="h-4 w-4" />
            تواصل على واتساب
          </a>
        )}
        <Link href="/" className="mt-4 block text-xs font-semibold text-muted hover:text-foreground">
          Bee Panal
        </Link>
      </div>
    </div>
  );
}
