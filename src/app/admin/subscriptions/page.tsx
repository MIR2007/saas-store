"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Loader2,
  MessageCircle,
  PauseCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cardClass, inputClass } from "@/lib/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { whatsappChatUrl } from "@/lib/whatsapp";

type SubscriptionRequest = {
  id: string;
  plan: string;
  method: string;
  reference: string;
  phone: string;
  amount: number;
  status: string;
  createdAt: string;
};

type AdminStore = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  plan: string;
  planStatus: string;
  planRenewsAt: string | null;
  subscriptionNote: string;
  createdAt: string;
  user: { name: string; email: string; phone: string };
  subscriptionRequests: SubscriptionRequest[];
  _count: { subscriptionRequests: number };
};

type Filter = "all" | "active" | "expiring" | "expired" | "pending";

type ActionPayload =
  | { action: "activate"; plan?: "monthly" | "yearly"; months?: number }
  | { action: "stop" }
  | { action: "trial" }
  | { action: "set-date"; renewsAt: string }
  | { action: "note"; note: string };

const DAY = 24 * 60 * 60 * 1000;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "كل المتاجر" },
  { key: "active", label: "نشط" },
  { key: "expiring", label: "قرب يخلص" },
  { key: "expired", label: "منتهي" },
  { key: "pending", label: "عنده طلب دفع" },
];

function isExpired(store: AdminStore) {
  return (
    ["expired", "cancelled", "canceled", "stopped"].includes(store.planStatus) ||
    (store.planRenewsAt ? new Date(store.planRenewsAt).getTime() <= Date.now() : false)
  );
}

function daysRemaining(store: AdminStore) {
  if (!store.planRenewsAt) return null;
  return Math.ceil((new Date(store.planRenewsAt).getTime() - Date.now()) / DAY);
}

function planLabel(plan: string) {
  if (plan === "yearly") return "سنوي";
  if (plan === "monthly") return "شهري";
  return "تجربة";
}

function methodLabel(method: string) {
  if (method === "instapay") return "إنستاباي";
  if (method === "vodafone") return "فودافون كاش";
  return method;
}

function requestLabel(status: string) {
  if (status === "approved") return "مقبول";
  if (status === "rejected") return "مرفوض";
  return "بانتظار المراجعة";
}

function requestBadge(status: string) {
  if (status === "approved") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (status === "rejected") {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  }
  return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
}

function daysBadge(store: AdminStore) {
  if (!store.planRenewsAt) {
    return { text: "غير محدد", className: "bg-surface text-muted" };
  }
  const days = daysRemaining(store) ?? 0;
  if (isExpired(store)) {
    return {
      text: days < 0 ? `متأخر ${Math.abs(days)} يوم` : "منتهي",
      className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    };
  }
  if (days <= 0) {
    return { text: "بينتهي النهاردة", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  }
  if (days <= 7) {
    return { text: `باقي ${days} يوم`, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  }
  return { text: `باقي ${days} يوم`, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
}

function localDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function csvCell(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function AdminSubscriptionsPage() {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/admin/subscriptions");
    if (response.ok) {
      const data = await response.json();
      setStores(data.stores || []);
    } else {
      setError("مش قادرين نحمّل المتاجر. جرّب تحديث الصفحة.");
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/subscriptions")
      .then((response) => {
        if (!response.ok) throw new Error("failed");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setStores(data.stores || []);
      })
      .catch(() => {
        if (active) setError("مش قادرين نحمّل المتاجر. جرّب تحديث الصفحة.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function runAction(
    store: AdminStore,
    payload: ActionPayload,
    success: string,
    confirmText?: string
  ) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(`${store.id}:${payload.action}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store.id, ...payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "مش قادرين ننفّذ العملية");
        return;
      }
      setMessage(success);
      if (payload.action === "note") {
        setNotes((previous) => ({
          ...previous,
          [store.id]: data.store?.subscriptionNote ?? payload.note,
        }));
      } else if (data.store?.planRenewsAt !== undefined) {
        setDates((previous) => ({
          ...previous,
          [store.id]: localDateInput(data.store.planRenewsAt),
        }));
      }
      await load();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy(null);
    }
  }

  const stats = useMemo(() => {
    const active = stores.filter((store) => !isExpired(store)).length;
    const expired = stores.filter(isExpired).length;
    const expiring = stores.filter((store) => {
      if (isExpired(store)) return false;
      const days = daysRemaining(store);
      return days !== null && days <= 7;
    }).length;
    const pending = stores.reduce((sum, store) => sum + store._count.subscriptionRequests, 0);
    return { total: stores.length, active, expired, expiring, pending };
  }, [stores]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((store) => {
      if (q) {
        const haystack = `${store.name} ${store.slug} ${store.user.name} ${store.user.email} ${store.user.phone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filter === "active") return !isExpired(store);
      if (filter === "expired") return isExpired(store);
      if (filter === "pending") return store._count.subscriptionRequests > 0;
      if (filter === "expiring") {
        if (isExpired(store)) return false;
        const days = daysRemaining(store);
        return days !== null && days <= 7;
      }
      return true;
    });
  }, [stores, query, filter]);

  function toggleExpanded(store: AdminStore) {
    if (expanded === store.id) {
      setExpanded(null);
      return;
    }
    setExpanded(store.id);
    setNotes((previous) => ({ ...previous, [store.id]: store.subscriptionNote || "" }));
    setDates((previous) => ({ ...previous, [store.id]: localDateInput(store.planRenewsAt) }));
  }

  function whatsappFor(store: AdminStore) {
    const days = daysRemaining(store);
    const renewal = store.planRenewsAt ? formatDate(store.planRenewsAt) : "غير محدد";
    const text = [
      `أهلًا ${store.user.name} 👋`,
      `بخصوص اشتراك متجر ${store.name}:`,
      isExpired(store)
        ? "اشتراك المتجر منتهي حاليًا والمتجر متوقف عن استقبال الطلبات."
        : `اشتراكك نشط وبيتجدد يوم ${renewal}${days !== null ? ` (باقي ${days} يوم)` : ""}.`,
      "قيمة الاشتراك: 1500 ج.م شهري أو 9000 ج.م سنوي.",
      "تقدر تجدد عبر إنستاباي أو فودافون كاش على 01005419148، وابعتلنا صورة التحويل.",
      "بعد التأكيد هنفعّل الاشتراك فورًا ✅",
    ].join("\n");
    return whatsappChatUrl(store.user.phone, text);
  }

  function exportCsv() {
    if (!filtered.length) {
      setError("مفيش متاجر للتصدير.");
      return;
    }
    setError("");
    const header = [
      "المتجر",
      "الرابط",
      "التاجر",
      "الإيميل",
      "الموبايل",
      "الخطة",
      "الحالة",
      "تاريخ التجديد",
      "الأيام المتبقية",
      "طلبات معلقة",
      "ملاحظات داخلية",
    ];
    const lines = filtered.map((store) => {
      const days = daysRemaining(store);
      return [
        store.name,
        `${store.slug}.beepanal.store`,
        store.user.name,
        store.user.email,
        store.user.phone,
        planLabel(store.plan),
        isExpired(store) ? "منتهي" : "نشط",
        store.planRenewsAt ? formatDate(store.planRenewsAt) : "غير محدد",
        days === null ? "" : days,
        store._count.subscriptionRequests,
        store.subscriptionNote,
      ]
        .map(csvCell)
        .join(",");
    });
    const blob = new Blob([`\uFEFF${header.map(csvCell).join(",")}\n${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function isBusy(storeId: string) {
    return Boolean(busy && busy.startsWith(`${storeId}:`));
  }

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
            <button
              type="button"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/api/admin/backup";
                link.download = "";
                document.body.appendChild(link);
                link.click();
                link.remove();
              }}
              className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-surface sm:flex"
            >
              <Download className="h-3 w-3" /> نسخة احتياطية
            </button>
            <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:underline">
              خروج <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">إدارة الاشتراكات</h1>
            <p className="mt-1 text-sm text-muted">
              فعّل ومدّد الاشتراكات، تابع الأيام المتبقية، وسجّل ملاحظاتك ومدفوعات كل تاجر.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-surface"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
          {[
            { label: "كل المتاجر", value: stats.total, tone: "text-foreground" },
            { label: "اشتراك نشط", value: stats.active, tone: "text-emerald-600 dark:text-emerald-400" },
            { label: "قرب يخلص (7 أيام)", value: stats.expiring, tone: "text-amber-600 dark:text-amber-400" },
            { label: "منتهي", value: stats.expired, tone: "text-rose-600 dark:text-rose-400" },
            { label: "طلبات دفع معلقة", value: stats.pending, tone: "text-sky-600 dark:text-sky-400" },
          ].map((item) => (
            <div key={item.label} className={`${cardClass} p-4`}>
              <div className="text-[11px] font-bold text-muted">{item.label}</div>
              <div className={`mt-1 text-2xl font-extrabold ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث باسم المتجر أو التاجر أو الموبايل..."
              className={`${inputClass} ps-10`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                      : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center text-sm text-muted">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            بنحمّل المتاجر...
          </div>
        ) : (
          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">المتجر</th>
                    <th className="px-4 py-3 text-start font-bold">التاجر</th>
                    <th className="px-4 py-3 text-start font-bold">الاشتراك</th>
                    <th className="px-4 py-3 text-start font-bold">طلب الدفع</th>
                    <th className="px-4 py-3 text-start font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                        مفيش متاجر مطابقة للبحث أو الفلتر.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((store) => {
                      const expired = isExpired(store);
                      const days = daysRemaining(store);
                      const pending = store.subscriptionRequests.find(
                        (request) => request.status === "pending"
                      );
                      const isOpen = expanded === store.id;
                      const badge = daysBadge(store);
                      const wa = whatsappFor(store);

                      return (
                        <Fragment key={store.id}>
                          <tr className="align-top transition-colors hover:bg-surface/60">
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
                                {expired ? "متوقف" : store.planStatus === "pending" ? "بانتظار التفعيل" : "شغّال"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-xs font-semibold text-foreground">{store.user.name}</div>
                              <div className="text-[10px] text-muted" dir="ltr">
                                {store.user.email}
                              </div>
                              {store.user.phone ? (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="font-mono text-[10px] text-muted" dir="ltr">
                                    {store.user.phone}
                                  </span>
                                  <a
                                    href={whatsappChatUrl(store.user.phone) || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="grid h-5 w-5 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                                    aria-label={`واتساب ${store.user.name}`}
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                  </a>
                                </div>
                              ) : (
                                <div className="mt-1 text-[10px] font-bold text-rose-500">رقم الموبايل ناقص</div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-xs font-bold text-foreground">{planLabel(store.plan)}</div>
                              <div className={`text-[10px] ${expired ? "text-rose-600" : "text-emerald-600"}`}>
                                {expired ? "منتهي" : store.planStatus === "pending" ? "بانتظار التفعيل" : "نشط"}
                              </div>
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                                <CalendarDays className="h-3 w-3" />
                                {store.planRenewsAt ? formatDate(store.planRenewsAt) : "غير محدد"}
                              </div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${badge.className}`}>
                                  <Clock className="h-2.5 w-2.5" />
                                  {badge.text}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {pending ? (
                                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
                                  <div className="font-bold">
                                    {planLabel(pending.plan)} — {formatMoney(pending.amount, "EGP")}
                                  </div>
                                  <div>{methodLabel(pending.method)}</div>
                                  <div className="font-mono" dir="ltr">
                                    {pending.reference}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted">لا يوجد</span>
                              )}
                              {store.subscriptionRequests.length > 0 && (
                                <div className="mt-1 text-[9px] text-muted">
                                  {store.subscriptionRequests.length} عملية في السجل
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    runAction(
                                      store,
                                      { action: "activate", months: 1 },
                                      "تم تمديد الاشتراك شهر."
                                    )
                                  }
                                  disabled={isBusy(store.id)}
                                  className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                                >
                                  + شهر
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(store)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-surface"
                                >
                                  {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  {isOpen ? "إغلاق" : "إدارة"}
                                </button>
                                {wa && (
                                  <a
                                    href={wa}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="grid h-7 w-7 place-items-center rounded-lg bg-[#25d366]/10 text-[#128c4a] hover:bg-[#25d366]/20 dark:text-[#4ade80]"
                                    aria-label={`تذكير واتساب ${store.name}`}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              {days !== null && days <= 7 && !expired && (
                                <div className="mt-1.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                  محتاج متابعة للتجديد
                                </div>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <tr>
                              <td colSpan={5} className="bg-surface/60 px-4 pb-5 pt-1">
                                <div className="grid gap-4 lg:grid-cols-3">
                                  <div className="rounded-xl border border-border bg-card p-4">
                                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                                      <Sparkles className="h-4 w-4 text-primary" />
                                      تمديد سريع
                                    </h3>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                      {[
                                        { months: 1, label: "شهر" },
                                        { months: 3, label: "3 شهور" },
                                        { months: 6, label: "6 شهور" },
                                        { months: 12, label: "سنة" },
                                      ].map((option) => (
                                        <button
                                          key={option.months}
                                          type="button"
                                          onClick={() =>
                                            runAction(
                                              store,
                                              { action: "activate", months: option.months },
                                              `تم تمديد الاشتراك ${option.label}.`
                                            )
                                          }
                                          disabled={isBusy(store.id)}
                                          className="rounded-lg border border-border bg-surface/60 px-2.5 py-2 text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                                        >
                                          {option.label}
                                        </button>
                                      ))}
                                    </div>

                                    <div className="mt-4">
                                      <label className="mb-1 block text-[10px] font-bold text-muted">
                                        تاريخ تجديد يدوي
                                      </label>
                                      <input
                                        type="date"
                                        value={dates[store.id] || ""}
                                        onChange={(event) =>
                                          setDates((previous) => ({
                                            ...previous,
                                            [store.id]: event.target.value,
                                          }))
                                        }
                                        className={inputClass}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          runAction(
                                            store,
                                            {
                                              action: "set-date",
                                              renewsAt: dates[store.id] || "",
                                            },
                                            "تم تحديث تاريخ التجديد."
                                          )
                                        }
                                        disabled={!dates[store.id] || isBusy(store.id)}
                                        className="mt-2 w-full rounded-lg bg-neutral-900 px-3 py-2 text-[11px] font-bold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                                      >
                                        حفظ التاريخ
                                      </button>
                                      <p className="mt-1 text-[9px] leading-relaxed text-muted">
                                        لو التاريخ في الماضي، المتجر هيتقفل تلقائيًا.
                                      </p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          runAction(store, { action: "trial" }, "تم تفعيل تجربة 7 أيام.")
                                        }
                                        disabled={isBusy(store.id)}
                                        className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-surface disabled:opacity-50"
                                      >
                                        تجربة 7 أيام
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          runAction(
                                            store,
                                            { action: "stop" },
                                            "تم إيقاف اشتراك المتجر.",
                                            "إيقاف اشتراك المتجر؟ المتجر هيتقفل للعملاء فورًا."
                                          )
                                        }
                                        disabled={isBusy(store.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                                      >
                                        <PauseCircle className="h-3 w-3" />
                                        إيقاف الاشتراك
                                      </button>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-border bg-card p-4">
                                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                                      <CreditCard className="h-4 w-4 text-primary" />
                                      ملاحظات داخلية
                                    </h3>
                                    <p className="mt-1 text-[9px] leading-relaxed text-muted">
                                      ملاحظاتك هنا مش بتظهر للتاجر.
                                    </p>
                                    <textarea
                                      rows={6}
                                      value={notes[store.id] ?? ""}
                                      onChange={(event) =>
                                        setNotes((previous) => ({
                                          ...previous,
                                          [store.id]: event.target.value,
                                        }))
                                      }
                                      placeholder="مثال: وعد بالتحويل يوم 25، أو خصم خاص..."
                                      className={`${inputClass} mt-2 resize-y`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        runAction(
                                          store,
                                          { action: "note", note: notes[store.id] || "" },
                                          "تم حفظ الملاحظة."
                                        )
                                      }
                                      disabled={isBusy(store.id)}
                                      className="mt-2 w-full rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                                    >
                                      حفظ الملاحظة
                                    </button>
                                  </div>

                                  <div className="rounded-xl border border-border bg-card p-4">
                                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                                      <CalendarDays className="h-4 w-4 text-primary" />
                                      سجل المدفوعات
                                    </h3>
                                    {store.subscriptionRequests.length === 0 ? (
                                      <p className="mt-3 rounded-lg border border-dashed border-border bg-surface/50 p-3 text-center text-[10px] text-muted">
                                        لسه مفيش طلبات دفع.
                                      </p>
                                    ) : (
                                      <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto pe-1">
                                        {store.subscriptionRequests.map((request) => (
                                          <li
                                            key={request.id}
                                            className="rounded-lg border border-border bg-surface/40 p-2 text-[10px]"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="font-bold text-foreground">
                                                {planLabel(request.plan)} — {formatMoney(request.amount, "EGP")}
                                              </span>
                                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${requestBadge(request.status)}`}>
                                                {requestLabel(request.status)}
                                              </span>
                                            </div>
                                            <div className="mt-0.5 text-muted">
                                              {methodLabel(request.method)} ·{" "}
                                              <span dir="ltr">{request.reference}</span>
                                            </div>
                                            <div className="text-muted">{formatDate(request.createdAt)}</div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {wa && (
                                      <a
                                        href={wa}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25d366] px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#1ebe5a]"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                        تذكير واتساب
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
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
