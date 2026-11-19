"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Power,
} from "lucide-react";
import { cardClass, inputClass } from "@/lib/ui";
import { formatDate } from "@/lib/format";
import { whatsappChatUrl } from "@/lib/whatsapp";

type DnsState = {
  ownership?: boolean;
  routing?: boolean;
  checkedAt?: string;
  cnameFound?: string | null;
  error?: string;
};

type AdminDomainStore = {
  id: string;
  name: string;
  slug: string;
  customDomain: string;
  customDomainStatus: string;
  createdAt: string;
  user: { name: string; email: string; phone: string };
  state: { dns?: DnsState; verifiedAt?: string | null };
  records: {
    apex: boolean;
    txt: { type: string; name: string; value: string };
    cname: { type: string; name: string; value: string };
  } | null;
};

type Filter = "all" | "active" | "verified" | "pending";

const STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "متصل", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  verified: { label: "جاهز للتفعيل", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  pending: { label: "بانتظار DNS", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  none: { label: "غير مربوط", className: "bg-surface text-muted" },
};

export default function AdminDomainsPage() {
  const router = useRouter();
  const [stores, setStores] = useState<AdminDomainStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "info">("success");
  const [copied, setCopied] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/admin/domains");
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!response.ok) throw new Error("failed");
      const data = await response.json();
      setStores(data.stores || []);
    } catch {
      setError("مش قادرين نحمّل الدومينات. جرّب تحديث الصفحة.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/domains")
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/admin/login");
          return null;
        }
        if (!response.ok) throw new Error("failed");
        return response.json();
      })
      .then((data) => {
        if (active && data) setStores(data.stores || []);
      })
      .catch(() => {
        if (active) setError("مش قادرين نحمّل الدومينات. جرّب تحديث الصفحة.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(
    () => ({
      all: stores.length,
      active: stores.filter((store) => store.customDomainStatus === "active").length,
      verified: stores.filter((store) => store.customDomainStatus === "verified").length,
      pending: stores.filter((store) => store.customDomainStatus === "pending").length,
    }),
    [stores]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return stores.filter((store) => {
      if (filter !== "all" && store.customDomainStatus !== filter) return false;
      if (!term) return true;
      return [store.customDomain, store.name, store.slug, store.user.name, store.user.email, store.user.phone]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [stores, query, filter]);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  }

  async function act(store: AdminDomainStore, action: "verify" | "activate" | "deactivate" | "remove") {
    if (action === "remove") {
      if (!confirm(`تحب تفصل الدومين ${store.customDomain} عن المتجر؟`)) return;
    }
    if (action === "activate") {
      if (!confirm("التفعيل اليدوي بيخلي المتجر يشتغل على الدومين. اتأكد إن DNS وشهادة SSL جاهزين.")) return;
    }
    if (action === "deactivate") {
      if (!confirm("إيقاف الدومين هيرجّع المتجر للسب دومين مؤقتًا. تكمل؟")) return;
    }

    setBusy(`${store.id}:${action}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store.id, action }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "العملية فشلت. جرّب تاني.");
        return;
      }
      const success =
        action === "remove" ||
        action === "deactivate" ||
        data.status === "active" ||
        data.status === "verified";
      setMessageTone(success ? "success" : "info");
      setMessage(data.message || "تمت العملية.");
      await load();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface" dir="rtl">
      <header className="border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-sm font-extrabold text-background">
              A
            </span>
            <div>
              <div className="text-sm font-extrabold text-foreground">الدومينات المخصصة</div>
              <div className="text-[10px] text-muted">Bee Panal · إدارة ربط الدومينات</div>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            لوحة التحكم
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start gap-2">
          <Globe2 className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-extrabold text-foreground">دومينات التجار</h1>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              راقب الدومينات، تحقق من DNS، وفعّل الدومين يدويًا بعد تجهيز شهادة SSL.
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="كل الدومينات" value={counts.all} />
          <Stat label="متصل" value={counts.active} tone="text-emerald-600 dark:text-emerald-400" />
          <Stat label="جاهز للتفعيل" value={counts.verified} tone="text-sky-600 dark:text-sky-400" />
          <Stat label="بانتظار DNS" value={counts.pending} tone="text-amber-600 dark:text-amber-400" />
        </div>

        <div className={`${cardClass} mb-4 p-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث بالدومين، المتجر، اسم التاجر، أو الموبايل..."
                className={`${inputClass} pr-9`}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "الكل"],
                  ["active", "متصل"],
                  ["verified", "جاهز"],
                  ["pending", "بانتظار DNS"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    filter === key
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
              messageTone === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
            }`}
          >
            {messageTone === "success" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {message}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-2xl bg-card" />
            <div className="h-32 animate-pulse rounded-2xl bg-card" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${cardClass} p-10 text-center`}>
            <Globe2 className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 text-sm font-bold text-foreground">مفيش دومينات مطابقة</p>
            <p className="mt-1 text-xs text-muted">أول ما تاجر يضيف دومين، هيظهر هنا.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((store) => {
              const status = STATUS[store.customDomainStatus] || STATUS.pending;
              const dns = store.state?.dns;
              const whatsapp = whatsappChatUrl(
                store.user.phone,
                `بخصوص دومين ${store.customDomain} لمتجر ${store.name} على Bee Panal`
              );
              const rowBusy = busy?.startsWith(store.id);

              return (
                <div key={store.id} className={`${cardClass} p-5`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-extrabold text-primary" dir="ltr">
                          <Globe2 className="h-3.5 w-3.5" />
                          {store.customDomain}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}>
                          {status.label}
                        </span>
                        {store.records?.apex && (
                          <span className="rounded-full bg-surface px-2 py-1 text-[10px] font-bold text-muted">دومين أساسي</span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <Link href={`/dashboard/stores/${store.id}`} className="font-bold text-foreground hover:text-primary">
                          {store.name}
                        </Link>
                        <span>·</span>
                        <span>{store.user.name}</span>
                        <span dir="ltr" className="font-mono text-[11px]">{store.user.email}</span>
                        {store.user.phone && (
                          <a href={whatsapp || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span dir="ltr">{store.user.phone}</span>
                          </a>
                        )}
                        <span>·</span>
                        <span>اتضاف {formatDate(store.createdAt)}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <CheckChip label="ملكية TXT" ok={Boolean(dns?.ownership)} checked={Boolean(dns?.checkedAt)} />
                        <CheckChip label="توجيه CNAME" ok={Boolean(dns?.routing)} checked={Boolean(dns?.checkedAt)} />
                        {dns?.checkedAt && (
                          <span className="text-[10px] text-muted">آخر فحص {formatDate(dns.checkedAt)}</span>
                        )}
                      </div>
                      {dns?.error && <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">{dns.error}</p>}
                      {dns?.cnameFound && (
                        <p className="mt-1 font-mono text-[10px] text-muted" dir="ltr">
                          CNAME → {dns.cnameFound}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => act(store, "verify")}
                        disabled={rowBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-bold text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                      >
                        {busy === `${store.id}:verify` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        تحقق
                      </button>
                      {store.customDomainStatus !== "active" && (
                        <button
                          type="button"
                          onClick={() => act(store, "activate")}
                          disabled={rowBusy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busy === `${store.id}:activate` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          تفعيل
                        </button>
                      )}
                      {store.customDomainStatus === "active" && (
                        <button
                          type="button"
                          onClick={() => act(store, "deactivate")}
                          disabled={rowBusy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-bold text-amber-600 transition-colors hover:bg-surface disabled:opacity-50 dark:text-amber-400"
                        >
                          {busy === `${store.id}:deactivate` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                          إيقاف
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => act(store, "remove")}
                        disabled={rowBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                      >
                        {busy === `${store.id}:remove` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        فصل
                      </button>
                      <a
                        href={`https://${store.customDomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-bold text-muted transition-colors hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        فتح
                      </a>
                    </div>
                  </div>

                  {store.records && (
                    <details className="mt-4 rounded-xl border border-border bg-surface/50 px-4 py-3">
                      <summary className="cursor-pointer text-[11px] font-bold text-muted">
                        سجلات DNS المطلوبة
                      </summary>
                      <div className="mt-3 space-y-2">
                        <RecordRow
                          type={store.records.txt.type}
                          name={store.records.txt.name}
                          value={store.records.txt.value}
                          copied={copied === `${store.id}:txt`}
                          onCopy={() => copy(store.records!.txt.value, `${store.id}:txt`)}
                        />
                        <RecordRow
                          type={store.records.cname.type}
                          name={store.records.cname.name}
                          value={store.records.cname.value}
                          copied={copied === `${store.id}:cname`}
                          onCopy={() => copy(store.records!.cname.value, `${store.id}:cname`)}
                        />
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-[11px] leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          التفعيل اليدوي بيتطلب إن سجل TXT وسجل CNAME يكونوا ظاهرين. متفعّلش الدومين قبل ما تتأكد إن
          شهادة SSL جاهزة عند Cloudflare، وإلا رابط المتجر هيدّي تحذير أمان للعملاء.
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className={`text-2xl font-extrabold ${tone || "text-foreground"}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-bold text-muted">{label}</div>
    </div>
  );
}

function CheckChip({ label, ok, checked }: { label: string; ok: boolean; checked: boolean }) {
  if (!checked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[10px] font-bold text-muted">
        <Clock className="h-3 w-3" />
        {label}: لسه ما اتفحصش
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        ok
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      }`}
    >
      {ok ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function RecordRow({
  type,
  name,
  value,
  copied,
  onCopy,
}: {
  type: string;
  name: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:gap-3" dir="ltr">
      <span className="w-14 shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-center font-mono text-[9px] font-extrabold text-primary">
        {type}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted">{name}</span>
      <span className="min-w-0 flex-[2] truncate font-mono text-[10px] font-bold text-foreground">{value}</span>
      <button type="button" onClick={onCopy} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "اتنسخ" : "نسخ"}
      </button>
    </div>
  );
}
