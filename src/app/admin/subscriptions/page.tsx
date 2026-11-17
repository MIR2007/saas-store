"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Loader2,
  PauseCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cardClass } from "@/lib/ui";
import { formatDate, formatMoney } from "@/lib/format";

type AdminStore = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  plan: string;
  planStatus: string;
  planRenewsAt: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string };
  subscriptionRequests: {
    id: string;
    plan: string;
    method: string;
    reference: string;
    amount: number;
    createdAt: string;
  }[];
  _count: { subscriptionRequests: number };
};

export default function AdminSubscriptionsPage() {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/subscriptions");
    if (response.ok) {
      const data = await response.json();
      setStores(data.stores || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function runAction(storeId: string, action: "activate" | "stop" | "trial", plan?: "monthly" | "yearly") {
    if (action === "stop" && !confirm("إيقاف اشتراك المتجر؟ المتجر هيتقفل للعملاء فورًا.")) return;
    setBusy(storeId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, action, plan }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "مش قادرين ننفّذ العملية");
        return;
      }
      setMessage("تم تحديث اشتراك المتجر.");
      await load();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy(null);
    }
  }

  const stats = useMemo(() => {
    const now = Date.now();
    const isExpired = (store: AdminStore) =>
      ["expired", "cancelled", "canceled", "stopped"].includes(store.planStatus) ||
      (store.planRenewsAt ? new Date(store.planRenewsAt).getTime() <= now : false);
    return {
      total: stores.length,
      active: stores.filter((store) => !isExpired(store)).length,
      expired: stores.filter(isExpired).length,
      pending: stores.reduce((sum, store) => sum + store._count.subscriptionRequests, 0),
    };
  }, [stores]);

  return (
    <div className="min-h-screen bg-surface" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-extrabold text-foreground">لوحة المطور</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/merchants"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-surface"
            >
              <Users className="h-3 w-3" /> التجار
            </Link>
            <Link
              href="/admin/subscriptions"
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              <CreditCard className="h-3 w-3" /> الاشتراكات
            </Link>
            <a
              href="/api/admin/backup"
              className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-surface sm:flex"
            >
              <Download className="h-3 w-3" /> نسخة احتياطية
            </a>
            <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:underline">
              خروج <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">إدارة الاشتراكات</h1>
          <p className="mt-1 text-sm text-muted">
            فعّل الاشتراكات المدفوعة، مدّد التجربة، أو أوقف متجرًا منتهيًا.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {[
            { label: "كل المتاجر", value: stats.total, tone: "text-foreground" },
            { label: "اشتراك نشط", value: stats.active, tone: "text-emerald-600 dark:text-emerald-400" },
            { label: "منتهي", value: stats.expired, tone: "text-rose-600 dark:text-rose-400" },
            { label: "طلبات بانتظار المراجعة", value: stats.pending, tone: "text-amber-600 dark:text-amber-400" },
          ].map((item) => (
            <div key={item.label} className={`${cardClass} p-4`}>
              <div className="text-[11px] font-bold text-muted">{item.label}</div>
              <div className={`mt-1 text-2xl font-extrabold ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center text-sm text-muted">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            بنحمّل المتاجر...
          </div>
        ) : (
          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">المتجر</th>
                    <th className="px-4 py-3 text-start font-bold">التاجر</th>
                    <th className="px-4 py-3 text-start font-bold">الخطة</th>
                    <th className="px-4 py-3 text-start font-bold">التجديد</th>
                    <th className="px-4 py-3 text-start font-bold">طلبات</th>
                    <th className="px-4 py-3 text-start font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                        مفيش متاجر بعد.
                      </td>
                    </tr>
                  ) : (
                    stores.map((store) => {
                      const expired =
                        ["expired", "cancelled", "canceled", "stopped"].includes(store.planStatus) ||
                        (store.planRenewsAt ? new Date(store.planRenewsAt).getTime() <= Date.now() : false);
                      const pending = store.subscriptionRequests[0];
                      return (
                        <tr key={store.id} className="align-top transition-colors hover:bg-surface/60">
                          <td className="px-4 py-4">
                            <div className="font-bold text-foreground">{store.name}</div>
                            <div className="font-mono text-[10px] text-muted" dir="ltr">
                              {store.slug}.beepanal.store
                            </div>
                            <span
                              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                expired
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {expired ? "متوقف" : "شغّال"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs font-semibold text-foreground">{store.user.name}</div>
                            <div className="text-[10px] text-muted" dir="ltr">{store.user.email}</div>
                            {store.user.phone && (
                              <div className="font-mono text-[10px] text-muted" dir="ltr">{store.user.phone}</div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs font-bold text-foreground">
                              {store.plan === "yearly" ? "سنوي" : store.plan === "monthly" ? "شهري" : "تجربة"}
                            </div>
                            <div className={`text-[10px] ${expired ? "text-rose-600" : "text-emerald-600"}`}>
                              {expired ? "منتهي" : store.planStatus === "pending" ? "بانتظار التفعيل" : "نشط"}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[11px] text-muted">
                            {store.planRenewsAt ? (
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(store.planRenewsAt)}
                              </span>
                            ) : (
                              "غير محدد"
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {pending ? (
                              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
                                <div className="font-bold">
                                  {pending.plan === "yearly" ? "سنوي" : "شهري"} — {formatMoney(pending.amount, "EGP")}
                                </div>
                                <div>{pending.method === "instapay" ? "إنستاباي" : "فودافون كاش"}</div>
                                <div className="font-mono" dir="ltr">{pending.reference}</div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted">لا يوجد</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => runAction(store.id, "activate", "monthly")}
                                disabled={busy === store.id}
                                className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                              >
                                شهري
                              </button>
                              <button
                                onClick={() => runAction(store.id, "activate", "yearly")}
                                disabled={busy === store.id}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                سنوي
                              </button>
                              <button
                                onClick={() => runAction(store.id, "trial")}
                                disabled={busy === store.id}
                                className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-surface disabled:opacity-50"
                              >
                                تجربة 7 أيام
                              </button>
                              <button
                                onClick={() => runAction(store.id, "stop")}
                                disabled={busy === store.id}
                                className="flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                              >
                                <PauseCircle className="h-3 w-3" />
                                إيقاف
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
