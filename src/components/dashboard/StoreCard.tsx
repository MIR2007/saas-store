import Link from "next/link";
import { ArrowUpRight, Package, ShoppingBag, Wallet } from "lucide-react";
import { formatMoney, formatNumber } from "@/lib/format";

export type StoreCardData = {
  id: string;
  name: string;
  slug: string;
  themeColor: string;
  currency: string;
  active: boolean;
  _count: { products: number; orders: number };
  revenue?: number;
};

export default function StoreCard({ store }: { store: StoreCardData }) {
  const initial = store.name.trim().charAt(0) || "B";
  const color = store.themeColor || "#d97706";

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-black/5">
      <div
        className="relative h-[74px] overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}b8)` }}
      >
        <span className="absolute -end-8 -top-10 h-28 w-28 rounded-full bg-white/15" />
        <span className="absolute -bottom-12 start-16 h-24 w-24 rounded-full bg-black/10 blur-md" />
        <span className="absolute bottom-3 start-4 grid h-11 w-11 place-items-center rounded-xl border border-white/25 bg-white/15 text-lg font-extrabold text-white backdrop-blur-md">
          {initial}
        </span>
        <span
          className={`absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
            store.active
              ? "bg-white/20 text-white ring-white/30"
              : "bg-black/20 text-white/90 ring-white/20"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${store.active ? "bg-emerald-300" : "bg-white/60"}`} />
          {store.active ? "شغال" : "متوقف"}
        </span>
      </div>

      <div className="p-4">
        <h3 className="truncate text-base font-extrabold text-foreground">{store.name}</h3>
        <p className="mt-0.5 truncate text-[11px] text-muted">beepanal.store/{store.slug}</p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface/70 text-center rtl:divide-x-reverse">
          <div className="px-1 py-2.5">
            <Package className="mx-auto h-3.5 w-3.5 text-muted" />
            <div className="mt-1 text-sm font-extrabold text-foreground">{formatNumber(store._count.products)}</div>
            <div className="text-[9px] text-muted">منتج</div>
          </div>
          <div className="px-1 py-2.5">
            <ShoppingBag className="mx-auto h-3.5 w-3.5 text-muted" />
            <div className="mt-1 text-sm font-extrabold text-foreground">{formatNumber(store._count.orders)}</div>
            <div className="text-[9px] text-muted">طلب</div>
          </div>
          <div className="px-1 py-2.5">
            <Wallet className="mx-auto h-3.5 w-3.5 text-muted" />
            <div className="mt-1 truncate text-sm font-extrabold text-foreground">
              {formatMoney(store.revenue ?? 0, store.currency)}
            </div>
            <div className="text-[9px] text-muted">مبيعات</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/dashboard/stores/${store.id}`}
            className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition-colors hover:bg-primary-dark"
          >
            إدارة المتجر
          </Link>
          <a
            href={`/${store.slug}`}
            target="_blank"
            aria-label="عرض المتجر"
            title="عرض المتجر"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
