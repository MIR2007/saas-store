"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eraser,
  ExternalLink,
  Globe2,
  ListPlus,
  Loader2,
  Lock,
  MousePointerClick,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, dangerBtn, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

type VerificationRecord = { type?: string; domain?: string; value?: string; reason?: string };
type DnsInfo = { a: string[]; cname: string };
/** `host` is the short name registrars ask for ("@", "www", "_beepanal-verify"). */
type DnsRecord = { type: string; name: string; value: string; host?: string };
type DomainRecords = {
  apex: boolean;
  root?: string;
  txt: DnsRecord;
  cname: DnsRecord;
  www: DnsRecord;
};

/** Where each popular registrar keeps its DNS records. */
const PROVIDERS = [
  {
    id: "hostinger",
    name: "Hostinger",
    url: "https://hpanel.hostinger.com/domains",
    path: "Domains ← اختار الدومين ← DNS / Nameservers ← Manage DNS records",
  },
  {
    id: "godaddy",
    name: "GoDaddy",
    url: "https://dcc.godaddy.com/control/portfolio",
    path: "My Products ← جنب الدومين دوس DNS",
  },
  {
    id: "namecheap",
    name: "Namecheap",
    url: "https://ap.www.namecheap.com/domains/list/",
    path: "Domain List ← Manage ← Advanced DNS",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    url: "https://dash.cloudflare.com/",
    path: "اختار الدومين ← DNS ← Records. خلي السحابة رمادي (DNS only)",
  },
  {
    id: "other",
    name: "شركة تانية",
    url: "",
    path: "ادخل حسابك وابحث عن كلمة DNS أو DNS Records أو Zone Editor",
  },
];

/** Background re-check interval while the domain is not live yet. */
const AUTO_CHECK_MS = 60_000;
const AUTO_CHECK_LIMIT = 60;
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
  const [provider, setProvider] = useState("hostinger");
  const checking = useRef(false);

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

  /**
   * Re-checks DNS and SSL. `silent` is the automatic background check: it does
   * not show a spinner or clear messages, and network errors are ignored.
   */
  async function verify(silent = false) {
    if (checking.current) return;
    checking.current = true;
    if (!silent) {
      setBusy("verify");
      setError("");
      setNotice("");
    }
    try {
      const res = await fetch(`/api/stores/${storeId}/domain`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        if (!silent) setError(data.error || "مش قادرين نتحقق من الدومين دلوقتي.");
        return;
      }
      apply(data);
      if (data.status === "active") {
        setNoticeTone("success");
        setNotice("تمام! الدومين متفعّل وجاهز ✅");
      } else if (!silent && data.message) {
        // The server message knows the mode (free proxy vs Cloudflare) and what is missing.
        setNoticeTone(data.verified ? "success" : "info");
        setNotice(data.message);
      }
    } catch {
      if (!silent) setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      checking.current = false;
      if (!silent) setBusy(null);
    }
  }

  // Keep checking in the background so the merchant does not have to keep pressing «تحقق الآن».
  const verifyRef = useRef(verify);
  useEffect(() => {
    verifyRef.current = verify;
  });
  const waiting = Boolean(savedDomain) && status !== "active";
  useEffect(() => {
    if (!waiting) return;
    let runs = 0;
    const tick = () => {
      if (document.hidden || runs >= AUTO_CHECK_LIMIT) return;
      runs += 1;
      void verifyRef.current(true);
    };
    const first = setTimeout(tick, 3000);
    const timer = setInterval(tick, AUTO_CHECK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [waiting, savedDomain]);

  /** Plain-text copy of every record, to paste to whoever manages the domain. */
  function allRecordsText() {
    if (!records) return "";
    const rows = [records.cname, ...(records.apex ? [records.www] : []), records.txt];
    return rows
      .map((r) => `Type: ${r.type}\nName / Host: ${r.host || r.name}\nValue: ${r.value}`)
      .join("\n\n");
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

  const baseMeta = STATUS_META[status] || STATUS_META.pending;
  // In free proxy mode "verified" means DNS is fine and the SSL certificate is being issued automatically.
  const meta =
    status === "verified" && mode === "proxy" ? { ...baseMeta, label: "بنجهّز شهادة الأمان" } : baseMeta;
  const StatusIcon = meta.icon;
  const active = status === "active";
  const verified = status === "verified" || active;
  const ownershipDone = Boolean(checks?.ownership);
  const routingDone = Boolean(checks?.routing);
  const checked = Boolean(checks?.checkedAt);
  const checkedTime = checks?.checkedAt
    ? new Date(checks.checkedAt).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })
    : "";
  const routingName = records?.cname.host || "@";
  const wwwName = records?.www.host || "www";
  const oldNames = records?.apex ? `${routingName} و ${wwwName}` : routingName;
  const currentProvider = PROVIDERS.find((item) => item.id === provider) || PROVIDERS[0];

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

                  {/* Step 1: open the registrar DNS page */}
                  <StepCard n={1} icon={MousePointerClick} title="افتح صفحة الـDNS عند الشركة اللي اشتريت منها الدومين">
                    <div className="flex flex-wrap gap-2">
                      {PROVIDERS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setProvider(item.id)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 transition ${
                            provider === item.id
                              ? "bg-primary text-white ring-primary"
                              : "bg-surface text-foreground ring-border hover:ring-primary/40"
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[12px] leading-relaxed text-foreground">{currentProvider.path}</p>
                      {currentProvider.url && (
                        <a
                          href={currentProvider.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                        >
                          افتح {currentProvider.name}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </StepCard>

                  {/* Step 2: remove conflicting records */}
                  <StepCard n={2} icon={Eraser} title="امسح السجلات القديمة">
                    <p className="text-[12px] leading-relaxed text-muted">
                      لو لقيت أي سجل نوعه <b className="font-mono text-foreground">A</b> أو{" "}
                      <b className="font-mono text-foreground">AAAA</b> أو <b className="font-mono text-foreground">CNAME</b>{" "}
                      واسمه <b className="font-mono text-foreground" dir="ltr">{oldNames}</b> امسحه.
                      لو مفيش، كمّل على الخطوة اللي بعدها.
                    </p>
                  </StepCard>

                  {/* Step 3: add the records */}
                  <StepCard n={3} icon={ListPlus} title={`ضيف ${records?.apex ? "3" : "2"} سجلات بالظبط زي ما هي`}>
                    <p className="mb-3 text-[12px] leading-relaxed text-muted">
                      دوس <b className="text-foreground">Add record</b> لكل سجل، واختار النوع، وانسخ الاسم والقيمة من هنا بزرار النسخ.
                    </p>
                    <div className="space-y-2.5">
                      <DnsRow
                        type={records?.cname.type || "CNAME"}
                        host={routingName}
                        value={records?.cname.value || dns.cname}
                        hint="ده اللي بيوصّل الدومين بمتجرك"
                        state={checked ? (routingDone ? "done" : "missing") : "idle"}
                        copy={copy}
                        copied={copied}
                        id="cname"
                      />
                      {records?.apex && (
                        <DnsRow
                          type={records?.www.type || "CNAME"}
                          host={wwwName}
                          value={records?.www.value || dns.cname}
                          hint="عشان الدومين يفتح كمان لما حد يكتب www"
                          state="idle"
                          copy={copy}
                          copied={copied}
                          id="www"
                        />
                      )}
                      <DnsRow
                        type="TXT"
                        host={records?.txt.host || "_beepanal-verify"}
                        value={records?.txt.value || ""}
                        hint="كود بيثبت إن الدومين ملكك"
                        state={checked ? (ownershipDone ? "done" : "missing") : "idle"}
                        copy={copy}
                        copied={copied}
                        id="txt"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => copy(allRecordsText(), "all")} className={secondaryBtn}>
                        {copied === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied === "all" ? "اتنسخ" : "انسخ كل السجلات"}
                      </button>
                      <span className="text-[11px] text-muted">لو حد تاني بيظبطلك الدومين، ابعتهاله.</span>
                    </div>

                    <ul className="mt-4 space-y-1.5 rounded-xl border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
                      <li>• لو الخانة مكتوب جنبها <span dir="ltr">.{records?.root || savedDomain}</span> اكتب الاسم بس من غير الدومين.</li>
                      <li>• خانة <b>TTL</b> سيبها زي ما هي.</li>
                      {mode === "proxy" ? (
                        <li>
                          • لو دومينك على <b>Cloudflare</b>: خلي السحابة <b>رمادي (DNS only)</b> مش برتقالي.
                        </li>
                      ) : (
                        records?.apex && (
                          <li>
                            • لو الشركة مش بتسمح بـ CNAME على <span dir="ltr">@</span> استخدم <b>ALIAS</b> أو <b>ANAME</b>.
                          </li>
                        )
                      )}
                    </ul>
                  </StepCard>

                  {/* Step 4: wait, the page checks by itself */}
                  <StepCard n={4} icon={Clock} title="استنى، والصفحة هتتأكد لوحدها" done={verified}>
                    <p className="text-[12px] leading-relaxed text-muted">
                      التغييرات بتاخد من 5 دقايق لساعة عشان تشتغل. سيب الصفحة دي مفتوحة وإحنا بنتحقق كل دقيقة،
                      أو دوس «تحقق الآن» في أي وقت.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <ProgressItem label="الدومين موجّه لمتجرك" ok={routingDone} checked={checked} />
                      <ProgressItem label="كود الملكية" ok={ownershipDone} checked={checked} />
                      <ProgressItem
                        label={mode === "proxy" ? "شهادة الأمان (القفل 🔒)" : "التفعيل النهائي"}
                        ok={active}
                        checked={verified}
                        waitingLabel={verified ? "بتتجهز…" : "بعد الخطوتين"}
                      />
                    </div>
                    {verified && mode === "proxy" && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.07] px-4 py-3 text-[12px] leading-relaxed text-sky-800 dark:text-sky-200">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                        السجلات تمام ✅ بنعمل شهادة الأمان دلوقتي، ودي بتاخد حوالي 10 دقايق. مش محتاج تعمل حاجة.
                      </div>
                    )}
                    {verified && mode !== "proxy" && (
                      <p className="mt-3 text-[12px] leading-relaxed text-muted">
                        السجلات تمام ✅ فريق Bee Panal هيكمّل التفعيل، والحالة هنا هتتغير لـ «متصل» أول ما يخلص.
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => verify()} disabled={busy === "verify"} className={primaryBtn}>
                        {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        تحقق الآن
                      </button>
                      {checkedTime && <span className="text-[11px] text-muted">آخر تحقق: {checkedTime}</span>}
                    </div>
                  </StepCard>
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
                        host={record.domain || "_cf-custom-hostname"}
                        value={record.value || ""}
                        state="idle"
                        copy={copy}
                        copied={copied}
                        id={`v-${index}`}
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

function StepCard({
  n,
  icon: Icon,
  title,
  done = false,
  children,
}: {
  n: number;
  icon: typeof Check;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white ${
            done ? "bg-emerald-500" : "bg-primary"
          }`}
        >
          {done ? <Check className="h-4 w-4" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 pt-1 text-sm font-extrabold text-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </h3>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ProgressItem({
  label,
  ok,
  checked,
  waitingLabel = "لسه",
}: {
  label: string;
  ok: boolean;
  checked: boolean;
  waitingLabel?: string;
}) {
  const tone = ok
    ? "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300"
    : checked
      ? "border-amber-500/25 bg-amber-500/[0.06] text-amber-800 dark:text-amber-200"
      : "border-border bg-surface text-muted";
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold ${tone}`}>
      {ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
      <span className="min-w-0 flex-1">{label}</span>
      <span className="shrink-0 text-[10px] font-semibold opacity-80">{ok ? "تمام" : checked ? waitingLabel : "مستني"}</span>
    </div>
  );
}

/** One DNS record with separate copy buttons for the name and the value. */
function DnsRow({
  type,
  host,
  value,
  hint,
  state,
  copy,
  copied,
  id,
}: {
  type: string;
  host: string;
  value: string;
  hint?: string;
  state: "idle" | "done" | "missing";
  copy: (value: string, key: string) => void;
  copied: string;
  id: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-3 ${
        state === "done" ? "border-emerald-500/30" : state === "missing" ? "border-amber-500/30" : "border-border"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-extrabold text-primary">
          النوع: {type}
        </span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
        {state === "done" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            <Check className="h-3 w-3" />
            اتضاف صح
          </span>
        )}
        {state === "missing" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            لسه مش ظاهر
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
        <CopyField label="الاسم (Name / Host)" value={host} onCopy={() => copy(host, `${id}-name`)} copied={copied === `${id}-name`} />
        <CopyField label="القيمة (Value / Points to)" value={value} onCopy={() => copy(value, `${id}-value`)} copied={copied === `${id}-value`} />
      </div>
    </div>
  );
}

function CopyField({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[10px] font-bold text-muted">{label}</div>
      <button
        type="button"
        onClick={onCopy}
        title="اضغط للنسخ"
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-start transition ${
          copied ? "border-emerald-500/40 bg-emerald-500/[0.07]" : "border-border bg-surface hover:border-primary/40"
        }`}
      >
        <span dir="ltr" className="min-w-0 flex-1 break-all text-left font-mono text-[12px] font-bold text-foreground">
          {value}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "اتنسخ" : "نسخ"}
        </span>
      </button>
    </div>
  );
}
