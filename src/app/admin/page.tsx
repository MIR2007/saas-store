"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, LogOut, Package, ShieldCheck, ShoppingBag, Store, Users, Wallet } from "lucide-react";
import { VERSION } from "@/lib/version";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cardClass } from "@/lib/ui";

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (loading)
    return <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">بنحمّل...</div>;
  if (!data) return null;

  const cards = [
    { label: "المستخدمون", value: formatNumber(data.stats.users), icon: Users, tone: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
    { label: "المتاجر", value: formatNumber(data.stats.stores), icon: Store, tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
    { label: "المنتجات", value: formatNumber(data.stats.products), icon: Package, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
    { label: "الطلبات", value: formatNumber(data.stats.orders), icon: ShoppingBag, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    { label: "الإيرادات", value: formatMoney(data.stats.revenue, "EGP"), icon: Wallet, tone: "text-rose-600 dark:text-rose-400 bg-rose-500/10" },
  ];

  return (
    <div className="min-h-screen bg-surface" dir="rtl">
      <header className="border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-sm font-extrabold text-background">
              A
            </span>
            <div>
              <div className="text-sm font-extrabold text-foreground">Admin Panel</div>
              <div className="text-[10px] text-muted">Bee Panal · لوحة المطور</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:text-foreground sm:inline-flex"
            >
              الموقع
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-extrabold text-foreground">نظرة عامة على المنصة</h1>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
          {cards.map((s) => (
            <div key={s.label} className={`${cardClass} p-5`}>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </span>
              <div className="mt-3 text-xl font-extrabold tracking-tight text-foreground">{s.value}</div>
              <div className="mt-0.5 text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-extrabold text-foreground">آخر المستخدمين</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                {formatNumber(data.recentUsers.length)}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {data.recentUsers.map((u: any) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">
                      {u.name.charAt(0)}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-foreground">{u.name}</div>
                      <div className="text-[10px] text-muted" dir="ltr">{u.email}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted">{formatDate(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-extrabold text-foreground">آخر الطلبات</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                {formatNumber(data.recentOrders.length)}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {data.recentOrders.map((o: any) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-foreground">{o.customerName}</div>
                    <div className="truncate text-[10px] text-muted">{o.store.name}</div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-extrabold text-primary">
                      {formatMoney(o.total, o.store.currency || "EGP")}
                    </div>
                    <div className="text-[10px] text-muted">{formatDate(o.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted">Bee Panal Admin · v{VERSION}</div>
      </main>
    </div>
  );
}
