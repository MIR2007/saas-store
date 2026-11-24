"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
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
type DnsRecord = { type: string; name: string; value: string };
type DomainRecords = { apex: boolean; txt: DnsRecord; cname: DnsRecord; www: DnsRecord };
type Checks = {
  ownership?: boolean;
  routing?: boolean;
  checkedAt?: string;
  txtName?: string;
  cnameTarget?: string;
  cnameFound?: string | null;
  aRecords?: string[];
  error?: string;
};

const DEFAULT_DNS: DnsInfo = {
  a: [],
  cname: "customers.beepanal.store",
};

const STATUS_META: Record<string, { label: string; tone: string; icon: typeof Check }> = {
  active: {
    label: "متصل وشغال",
    tone: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  verified: {
    label: "تم التحقق — بانتظار التفعيل",
    tone: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    icon: ShieldCheck,
  },
  pending: {
    label: "بانتظار إعدادات DNS",
    tone: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    icon: Clock,
  },
  none: {
    label: "غير مربوط",
    tone: "bg-surface text-muted ring-border",
    icon: Globe2,
  },
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
  const [records, setRecords] = useState<DomainRecords | null>(null);
  const [checks, setChecks] = useState<Checks | null>(null);
  const [automated, setAutomated] = useState(true);
  const [warning, setWarning] = useState("");
  const [mode, setMode] = useState<"proxy" | "cloudflare">("cloudflare");
  const [busy, setBusy] = useState<"save" | "verify" | "remove" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "info">("info");
  const [copied, setCopied] = useState("");

  function apply(data: {
    customDomain?: string | null;
    status?: string;
    subdomain?: string;
    subdomainUrl?: string;
    verification?: VerificationRecord[];
    dns?: DnsInfo;
    records?: DomainRecords | null;
    checks?: Checks | null;
    automated?: boolean;
    warning?: string;
    mode?: "proxy" | "cloudflare";
  }) {
    setSavedDomain(data.customDomain || null);
    setDomain(data.customDomain || "");
    setStatus(data.status || "none");
    if (data.subdomain) setSubdomain(data.subdomain);
    if (data.subdomainUrl) setSubdomainUrl(data.subdomainUrl);
    setVerification(Array.isArray(data.verification) ? data.verification : []);
    if (data.dns) {
      setDns({ a: data.dns.a || DEFAULT_DNS.a, cname: data.dns.cname || DEFAULT_DNS.cname });
    }
    setRecords(data.records || null);
    setChecks(data.checks || null);
    setAutomated(Boolean(data.automated));
    setWarning(data.warning || "");
    if (data.mode) setMode(data.mode);
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/stores/${storeId}/domain`)
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (active && ok) apply(data);
      })
      .catch(() => {
        if (active) setError("مش قادرين نحمّل بيانات الدومين. جرّب تحديث الصفحة.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  async function copy(value: string, key: string) {
    let copiedOk = false;
    try {
      await navigator.clipboard.writeText(value);
      copiedOk = true;
    } catch {
      copiedOk = false;
    }
    if (!copiedOk) {
      try {
        const input = document.createElement("textarea");
        input.value = value;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        copiedOk = document.execCommand("copy");
        input.remove();
      } catch {
        copiedOk = false;
      }
    }
    if (copiedOk) {
      setCopied(key);
      setTimeout(() => setCopied(""), 1800);
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
      apply(data);
      setNoticeTone(data.status === "active" ? "success" : "info");
      setNotice(
        data.status === "active"
          ? "الدومين متفعّل وجاهز ✅"
          : "الدومين اتحفظ. ضيف سجلات DNS اللي تحت، وبعدها اضغط «تحقق الآن»."
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
        setError(data.error || "مش قادرين نتحقق من الدومين دلوقتي.");
        return;
      }
      apply(data);
      if (data.status === "active") {
        setNoticeTone("success");
        setNotice("تمام! الدومين متفعّل وجاهز ✅");
      } else if (data.verified) {
        setNoticeTone("success");
        setNotice("تم التحقق من الدومين ✅ فريق Bee Panal هيكمّل التفعيل النهائي.");
      } else if (data.message) {
        setNoticeTone("info");
        setNotice(data.message);
      }
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
      setRecords(null);
      setChecks(null);
      setWarning("");
      setNoticeTone("success");
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

  const meta = STATUS_META[status] || STATUS_META.pending;
  const StatusIcon = meta.icon;
  const active = status === "active";
  const verified = status === "verified" || active;
  const ownershipDone = Boolean(checks?.ownership);
  const routingDone = Boolean(checks?.routing);
  const checked = Boolean(checks?.checkedAt);

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}/settings`}
        backLabel="إعدادات المتجر"
        eyebrow="رابط المتجر والدومين"
        title="خلي متجرك باسمك"
        subtitle="كل متجر له سب دومين مجاني على beepanal.store، وتقدر تربط دومينك الخاص كمان."
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${meta.tone}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
            )}
          </div>

          {savedDomain ? (
            <div className="mt-6 space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted">الدومين المربوط</div>
                  <div className="mt-1 truncate font-mono text-sm font-extrabold text-foreground" dir="ltr">
                    {savedDomain}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!active && (
                    <button type="button" onClick={verify} disabled={busy === "verify"} className={primaryBtn}>
                      {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      تحقق الآن
                    </button>
                  )}
                  <button type="button" onClick={remove} disabled={busy === "remove"} className={dangerBtn}>
                    {busy === "remove" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    فصل
                  </button>
                </div>
              </div>

              {active && (
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-extrabold text-foreground">دومينك شغال على Bee Panal</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        العملاء يقدروا يفتحوا متجرك من الدومين ده مباشرة، وشهادة الأمان مفعّلة.
                      </p>
                    </div>
                  </div>
                  <a href={`https://${savedDomain}`} target="_blank" rel="noreferrer" className={primaryBtn}>
                    افتح الدومين
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {!active && (
                <>
                  {warning && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {warning}
                    </div>
                  )}

                  {/* Step 1 */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">1</span>
                        <div>
                          <h3 className="text-sm font-extrabold text-foreground">ضيف سجلات DNS عند مزوّد الدومين</h3>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted">
                            افتح لوحة إدارة الدومين (GoDaddy / Namecheap / Cloudflare…) وأضف السجلين دول.
                            النشر بياخد من دقايق لساعات حسب المزوّد.
                          </p>
                        </div>
                      </div>
                      {checked && ownershipDone && routingDone && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-3 w-3" />
                          تمام
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2.5">
                      <DnsRow
                        type="TXT"
                        name={records?.txt.name || `_beepanal-verify.${savedDomain}`}
                        value={records?.txt.value || ""}
                        hint="لإثبات إنك مالك الدومين"
                        state={checked ? (ownershipDone ? "done" : "missing") : "idle"}
                        onCopy={() => copy(records?.txt.value || "", "txt")}
                        copied={copied === "txt"}
                      />
                      <DnsRow
                        type={records?.cname.type || "CNAME"}
                        name={records?.cname.name || savedDomain}
                        value={records?.cname.value || dns.cname}
                        hint="لتوجيه الدومين لمتجرك على Bee Panal"
                        state={checked ? (routingDone ? "done" : "missing") : "idle"}
                        onCopy={() => copy(records?.cname.value || dns.cname, "cname")}
                        copied={copied === "cname"}
                      />
                      {records?.apex && (
                        <DnsRow
                          type={records?.www.type || "CNAME"}
                          name={records?.www.name || `www.${savedDomain}`}
                          value={records?.www.value || dns.cname}
                          hint="اختياري — لنسخة www من الدومين"
                          state="idle"
                          onCopy={() => copy(records?.www.value || dns.cname, "www")}
                          copied={copied === "www"}
                        />
                      )}
                    </div>

                    {mode === "proxy" ? (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>
                          امسح أي سجلات A أو AAAA أو CNAME قديمة على نفس الاسم قبل ما تضيف السجلات دي.
                          لو دومينك على Cloudflare خلي السجلات <b>DNS only</b> (السحابة الرمادي) — مش Proxied —
                          عشان شهادة الأمان تتعمل.
                        </span>
                      </div>
                    ) : (
                      records?.apex && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>
                            لأن ده الدومين الأساسي، بعض المزوّدين مش بيسمحوا بـ CNAME عليه. استخدم
                            <b> ALIAS / ANAME / CNAME Flattening</b> لو متاح، أو اربط سب دومين زي
                            <span className="font-mono"> shop.{savedDomain}</span>.
                            لو دومينك على Cloudflare خلي السجل <b>Proxied</b>.
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${verified ? "bg-emerald-500 text-white" : "bg-primary text-white"}`}>
                        {verified ? <Check className="h-4 w-4" /> : "2"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-extrabold text-foreground">اتحقق من الدومين</h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted">
                          بعد ما تضيف السجلات، اضغط «تحقق الآن». بنتأكد من ملكية الدومين ومن إنه موجه
                          لـ Bee Panal.
                        </p>
                        {checked && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <CheckChip label="ملكية الدومين (TXT)" ok={ownershipDone} />
                            <CheckChip label={`توجيه الدومين (${records?.cname.type || "CNAME"})`} ok={routingDone} />
                          </div>
                        )}
                        {!active && (
                          <button type="button" onClick={verify} disabled={busy === "verify"} className={`${secondaryBtn} mt-3`}>
                            {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            تحقق الآن
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${verified ? "bg-emerald-500 text-white" : "bg-surface text-muted"}`}>
                        {verified ? <Check className="h-4 w-4" /> : "3"}
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-foreground">التفعيل النهائي وشهادة الأمان</h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted">
                          {verified
                            ? "الدومين اتأكد ✅ فريق Bee Panal هيكمّل تفعيل شهادة SSL وتشغيل الدومين. هتلاقي الحالة هنا اتغيرت لـ «متصل» أول ما يخلص."
                            : "بعد التحقق من السجلات، فريق Bee Panal بيكمّل شهادة الأمان (SSL) وتشغيل الدومين على المتجر."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {verification.length > 0 && !active && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-sm font-extrabold text-foreground">سجلات تحقق إضافية من Cloudflare</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    لو ظهرت لك السجلات دي في لوحة Cloudflare، ضيفها زي ما هي.
                  </p>
                  <div className="mt-3 space-y-2">
                    {verification.map((record, index) => (
                      <DnsRow
                        key={index}
                        type={record.type || "TXT"}
                        name={record.domain || "_cf-custom-hostname"}
                        value={record.value || ""}
                        state="idle"
                        onCopy={() => copy(record.value || "", `v-${index}`)}
                        copied={copied === `v-${index}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!automated && !warning && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  الربط التلقائي عبر Cloudflare مش مفعّل على السيرفر حاليًا. الدومين هيتحفظ ويتحقق منه،
                  وفريق Bee Panal هيكمّل التفعيل يدويًا.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={connect} className="mt-6">
              <label className={labelClass}>الدومين</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="mystore.com"
                  className={`${inputClass} flex-1`}
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="submit" disabled={busy === "save" || !domain.trim()} className={primaryBtn}>
                  {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                  ربط الدومين
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                اكتب الدومين من غير <span className="font-mono">https://</span> ومن غير <span className="font-mono">www</span>.
                مثال: <span className="font-mono">mystore.com</span> أو <span className="font-mono">shop.mystore.com</span>.
              </p>
            </form>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {notice && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                noticeTone === "success"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              }`}
            >
              {noticeTone === "success" ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {notice}
            </div>
          )}
        </section>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-[11px] leading-relaxed text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          بنتحقق من ملكية الدومين بسجل TXT قبل تفعيله — محدش هيقدر يربط دومين مش بتاعه.
        </div>

        <Link href={`/dashboard/stores/${storeId}/settings`} className="inline-flex text-xs font-bold text-primary hover:underline">
          رجوع لإعدادات المتجر
        </Link>
      </div>
    </div>
  );
}

function CheckChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        ok
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {ok ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

function DnsRow({
  type,
  name,
  value,
  hint,
  state,
  onCopy,
  copied,
}: {
  type: string;
  name: string;
  value: string;
  hint?: string;
  state: "idle" | "done" | "missing";
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center" dir="ltr">
        <span className="w-16 shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-center font-mono text-[10px] font-extrabold text-primary">
          {type}
        </span>
        <span className="min-w-0 flex-1 break-all font-mono text-[11px] text-muted">{name}</span>
        <span className="min-w-0 flex-[2] break-all font-mono text-[11px] font-bold text-foreground">{value}</span>
        <button type="button" onClick={onCopy} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "اتنسخ" : "نسخ"}
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
        {state === "done" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
            <Check className="h-2.5 w-2.5" />
            موجود
          </span>
        )}
        {state === "missing" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
            <Clock className="h-2.5 w-2.5" />
            لسه مش ظاهر
          </span>
        )}
      </div>
    </div>
  );
}
