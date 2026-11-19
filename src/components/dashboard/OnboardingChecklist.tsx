"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  Copy,
  MessageCircle,
  Package,
  Palette,
  Share2,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OnboardingStep } from "@/lib/onboarding";

const STEP_ICONS: Record<OnboardingStep["id"], LucideIcon> = {
  product: Package,
  whatsapp: MessageCircle,
  shipping: Truck,
  design: Palette,
  order: ShoppingBag,
  share: Share2,
};

export default function OnboardingChecklist({
  storeId,
  storeName,
  storeUrl,
  steps,
  done,
  total,
  percent,
}: {
  storeId: string;
  storeName: string;
  storeUrl: string;
  steps: OnboardingStep[];
  done: number;
  total: number;
  percent: number;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  if (hidden) return null;

  const nextStep = steps.find((step) => !step.done);
  const shareText = `شوف متجر ${storeName} على Bee Panal: ${storeUrl}`;

  async function markShare() {
    try {
      await fetch(`/api/stores/${storeId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "share" }),
        keepalive: true,
      });
      router.refresh();
    } catch {
      // The next visit will retry; sharing still works.
    }
  }

  async function copyLink() {
    let copiedOk = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(storeUrl);
        copiedOk = true;
      }
    } catch {
      copiedOk = false;
    }

    if (!copiedOk) {
      try {
        const input = document.createElement("textarea");
        input.value = storeUrl;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.focus();
        input.select();
        copiedOk = document.execCommand("copy");
        input.remove();
      } catch {
        copiedOk = false;
      }
    }

    if (copiedOk) {
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2200);
      void markShare();
    } else {
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 6000);
    }
  }

  async function dismiss() {
    setHidden(true);
    try {
      await fetch(`/api/stores/${storeId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: true }),
        keepalive: true,
      });
      router.refresh();
    } catch {
      // It will reappear on reload if the request failed.
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-l from-primary/[0.08] via-primary/[0.04] to-transparent px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-foreground sm:text-lg">
              خلّي متجرك جاهز للبيع
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              كمّل الخطوات دي عشان تبدأ تستقبل طلبات وتستفيد من كل مميزات Bee Panal.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="إخفاء قائمة الإعداد"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted">
          <span>
            {done} من {total} خطوات
          </span>
          <span className="text-primary">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-l from-amber-500 to-orange-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-border/70 px-5 pb-2">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.id];
          const isNext = nextStep?.id === step.id;

          return (
            <li key={step.id} className="flex items-start gap-3 py-3.5">
              <span
                className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  step.done
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isNext
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface text-muted"
                }`}
              >
                {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <div
                  className={`flex flex-wrap items-center gap-2 text-sm font-bold ${
                    step.done
                      ? "text-muted line-through decoration-border"
                      : "text-foreground"
                  }`}
                >
                  {step.title}
                  {isNext && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold text-primary no-underline">
                      الخطوة الجاية
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {step.description}
                </p>

                {!step.done && step.id === "share" && (
                  <>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyLink}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "تم النسخ" : "نسخ الرابط"}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => void markShare()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      واتساب
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => void markShare()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-bold text-sky-700 transition-colors hover:bg-sky-500/15 dark:text-sky-300"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      فيسبوك
                    </a>
                  </div>
                  {copyFailed && (
                    <p
                      dir="ltr"
                      className="mt-2 break-all rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                    >
                      {storeUrl}
                    </p>
                  )}
                  </>
                )}

                {!step.done && step.id !== "share" && step.href
                  ? step.external
                    ? (
                        <a
                          href={step.href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:underline"
                        >
                          {step.action}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )
                    : (
                        <Link
                          href={`/dashboard/stores/${storeId}${step.href}`}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:underline"
                        >
                          {step.action}
                          <ChevronLeft className="h-3 w-3" />
                        </Link>
                      )
                  : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
