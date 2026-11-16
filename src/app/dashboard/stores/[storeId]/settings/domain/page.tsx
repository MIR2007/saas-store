"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, dangerBtn, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

type VerificationRecord = { type?: string; domain?: string; value?: string; reason?: string };
type DnsInfo = { a: string[]; cname: string };

const DEFAULT_DNS: DnsInfo = {
  a: ["216.198.79.1", "64.29.17.1"],
  cname: "cname.vercel-dns.com",
};

export default function StoreDomainPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("");
  const [savedDomain, setSavedDomain] = useState<string | null>(null);
  const [status, setStatus] = useState("none");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainUrl, setSubdomainUrl] = useState("");
  const [verification, setVerification] = useState<VerificationRecord[]>([]);
  const [dns, setDns] = useState<DnsInfo>(DEFAULT_DNS);
  const [automated, setAutomated] = useState(true);
  const [busy, setBusy] = useState<"save" | "verify" | "remove" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    const res = await fetch(`/api/stores/${storeId}/domain`);
    const data = await res.json();
    if (res.ok) {
      setSavedDomain(data.customDomain || null);
      setDomain(data.customDomain || "");
      setStatus(data.status || "none");
      setSubdomain(data.subdomain || "");
      setSubdomainUrl(data.subdomainUrl || "");
      setVerification(Array.isArray(data.verification) ? data.verification : []);
      if (data.dns) setDns({ a: data.dns.a || DEFAULT_DNS.a, cname: data.dns.cname || DEFAULT_DNS.cname });
      setAutomated(Boolean(data.automated));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/stores/${storeId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نضيف الدومين.");
        return;
      }
      setSavedDomain(data.customDomain);
      setStatus(data.status);
      setVerification(Array.isArray(data.verification) ? data.verification : []);
      if (data.dns) setDns({ a: data.dns.a || DEFAULT_DNS.a, cname: data.dns.cname || DEFAULT_DNS.cname });
      setNotice(
        data.warning ||
          (data.status === "active"
            ? "الدومين متفعّل وجاهز ✅"
            : "الدومين اتضاف. كمّل إعدادات DNS عند مزوّد الدومين وبعدها اضغط «تحقق الآن».")
      );
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    setBusy("verify");
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/stores/${storeId}/domain`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "لسه الدومين مش متأكد.");
        return;
      }
      setStatus(data.status);
      setVerification(Array.isArray(data.verification) ? data.verification : []);
      if (data.dns) setDns({ a: data.dns.a || DEFAULT_DNS.a, cname: data.dns.cname || DEFAULT_DNS.cname });
      setNotice(
        data.status === "active"
          ? "تمام! الدومين متفعّل وجاهز ✅"
          : "الدومين لسه محتاج وقت لنشر DNS. جرّب تاني بعد شوية."
      );
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("تحب تفصل الدومين المخصص؟ المتجر هيفضل شغال على السب دومين.")) return;
    setBusy("remove");
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/stores/${storeId}/domain`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "مش قادرين نفصل الدومين.");
        return;
      }
      setSavedDomain(null);
      setDomain("");
      setStatus("none");
      setVerification([]);
      setNotice("تم فصل الدومين. متجرك شغال على السب دومين.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-72 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  const active = status === "active";
  const pending = status === "pending";

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}/settings`}
        backLabel="إعدادات المتجر"
        eyebrow="رابط المتجر والدومين"
        title="خلي متجرك باسمك"
        subtitle="كل متجر له سب دومين مجاني على beepanal.store، وتقدر تربط دومينك الخاص."
        icon={<Globe2 className="h-6 w-6" />}
      />

      <div className="space-y-5">
        {/* Free subdomain */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-l from-amber-500/[0.08] via-transparent to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                <Globe2 className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-extrabold text-foreground">السب دومين المجاني</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  رابط جاهز على طول، مفعّل تلقائيًا مع المتجر — مفيش أي إعدادات مطلوبة.
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              فعّال
            </span>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 overflow-hidden rounded-xl border border-border bg-surface px-4 py-3" dir="ltr">
                <span className="truncate font-mono text-sm font-bold text-foreground">{subdomain}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => copy(`https://${subdomain}`, "sub")} className={secondaryBtn}>
                  {copied === "sub" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "sub" ? "اتنسخ" : "نسخ"}
                </button>
                <a href={subdomainUrl} target="_blank" rel="noreferrer" className={primaryBtn}>
                  افتح
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Custom domain */}
        <section className={`${cardClass} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Server className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-extrabold text-foreground">دومينك الخاص</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  اربط زي <span className="font-mono text-[11px]">shop.yourbrand.com</span> أو الدومين الأساسي
                  <span className="font-mono text-[11px]"> yourbrand.com</span>.
                </p>
              </div>
            </div>
            {savedDomain && (
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                  active
                    ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                    : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
                }`}
              >
                {active ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {active ? "متصل" : "بانتظار DNS"}
              </span>
            )}
          </div>

          <form onSubmit={connect} className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className={labelClass}>الدومين</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="mystore.com"
                className={inputClass}
                dir="ltr"
                disabled={Boolean(savedDomain)}
              />
            </div>
            {savedDomain ? (
              <div className="flex gap-2">
                <button type="button" onClick={verify} disabled={busy === "verify"} className={secondaryBtn}>
                  {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  تحقق الآن
                </button>
                <button type="button" onClick={remove} disabled={busy === "remove"} className={dangerBtn}>
                  {busy === "remove" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  فصل
                </button>
              </div>
            ) : (
              <button type="submit" disabled={busy === "save" || !domain.trim()} className={primaryBtn}>
                {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                ربط الدومين
              </button>
            )}
          </form>

          {!automated && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              الربط التلقائي عبر Vercel مش مفعّل على السيرفر حاليًا. الدومين هيتحفظ، وفريق Bee Panal هيكمّل
              التفعيل يدويًا.
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </div>
          )}

          {savedDomain && pending && (
            <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
              <h3 className="text-sm font-extrabold text-foreground">خطوات ربط DNS عند مزوّد الدومين</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                افتح لوحة إدارة الدومين (GoDaddy / Namecheap / Cloudflare…) وأضف السجلات دي. النشر بياخد من
                دقايق لساعات حسب المزوّد.
              </p>

              <div className="mt-4 space-y-2.5">
                {dns.a.map((value, index) => (
                  <DnsRow
                    key={`a-${index}`}
                    type="A"
                    name="@"
                    value={value}
                    onCopy={() => copy(value, `a-${index}`)}
                    copied={copied === `a-${index}`}
                  />
                ))}
                <DnsRow
                  type="CNAME"
                  name="www"
                  value={dns.cname}
                  onCopy={() => copy(dns.cname, "cname")}
                  copied={copied === "cname"}
                />
              </div>

              {verification.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-extrabold text-foreground">سجلات التحقق المطلوبة من Vercel</h4>
                  <div className="mt-2 space-y-2">
                    {verification.map((record, index) => (
                      <DnsRow
                        key={index}
                        type={record.type || "TXT"}
                        name={record.domain || "_vercel"}
                        value={record.value || ""}
                        onCopy={() => copy(record.value || "", `v-${index}`)}
                        copied={copied === `v-${index}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[11px] leading-relaxed text-muted">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                بديل أسرع: غيّر Nameservers الدومين إلى
                <span className="font-mono"> ns1.vercel-dns.com</span> و
                <span className="font-mono"> ns2.vercel-dns.com</span>.
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-[11px] leading-relaxed text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          بنتحقق من ملكية الدومين عند مزوّد DNS قبل تفعيله — محدش هيقدر يربط دومين مش بتاعه.
        </div>

        <Link href={`/dashboard/stores/${storeId}/settings`} className="inline-flex text-xs font-bold text-primary hover:underline">
          رجوع لإعدادات المتجر
        </Link>
      </div>
    </div>
  );
}

function DnsRow({
  type,
  name,
  value,
  onCopy,
  copied,
}: {
  type: string;
  name: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center" dir="ltr">
      <span className="w-16 shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-center font-mono text-[10px] font-extrabold text-primary">
        {type}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted">{name}</span>
      <span className="min-w-0 flex-[2] truncate font-mono text-[11px] font-bold text-foreground">{value}</span>
      <button type="button" onClick={onCopy} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "اتنسخ" : "نسخ"}
      </button>
    </div>
  );
}
