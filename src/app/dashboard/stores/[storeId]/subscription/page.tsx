import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CreditCard, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";
import { daysUntil, subscriptionState } from "@/lib/store-status";
import { cardClass, secondaryBtn } from "@/lib/ui";
import SubscriptionForm from "./SubscriptionForm";

const REQUEST_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "قيد المراجعة",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/25",
  },
  approved: {
    label: "متفعّل",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25",
  },
  rejected: {
    label: "مرفوض",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/25",
  },
};

const METHOD_LABEL: Record<string, string> = {
  instapay: "إنستاباي",
  vodafone: "فودافون كاش",
};

export default async function SubscriptionPage(props: PageProps<"/dashboard/stores/[storeId]/subscription">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session!.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      plan: true,
      planStatus: true,
      planRenewsAt: true,
    },
  });
  if (!store) notFound();

  const requests = await prisma.subscriptionRequest.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const pending = requests.some((request) => request.status === "pending");
  const state = subscriptionState(store);
  const daysLeft = daysUntil(store.planRenewsAt);
  const planLabel =
    store.plan === "monthly"
      ? SUBSCRIPTION_PLANS.monthly.label
      : store.plan === "yearly"
        ? SUBSCRIPTION_PLANS.yearly.label
        : "تجربة مجانية";

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel="لوحة المتجر"
        eyebrow="الاشتراكات"
        title="اشتراكك في Bee Panal"
        subtitle="اختار الخطة، حوّل على إنستاباي أو فودافون كاش، وسجّل الطلب — التفعيل خلال 24 ساعة."
        icon={<CreditCard className="h-6 w-6" />}
        action={
          <Link href={`/dashboard/stores/${storeId}/settings`} className={secondaryBtn}>
            إعدادات المتجر
          </Link>
        }
      />

      {state === "expired" && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-extrabold text-rose-700 dark:text-rose-300">الاشتراك منتهي والمتجر متوقف</div>
            <p className="mt-0.5 text-xs leading-relaxed text-rose-700/80 dark:text-rose-300/80">
              عملاءك مش هيقدروا يشوفوا المنتجات أو يعملوا طلبات لحد ما يتم التفعيل. حوّل قيمة الخطة وسجّل الطلب تحت.
            </p>
          </div>
        </div>
      )}

      {state === "active" && daysLeft !== null && daysLeft <= 5 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
              {daysLeft <= 0 ? "اشتراكك بينتهي النهاردة" : `فاضل ${daysLeft} يوم على تجديد الاشتراك`}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80 dark:text-amber-300/80">
              جدّد قبل تاريخ {formatDate(store.planRenewsAt!)} عشان المتجر يفضل شغال من غير توقف.
            </p>
          </div>
        </div>
      )}

      <div className={`${cardClass} mb-6 overflow-hidden`}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-foreground">خطة {planLabel}</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                    state === "active"
                      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                      : state === "pending"
                        ? "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300"
                        : "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300"
                  }`}
                >
                  {state === "active" ? "نشط" : state === "pending" ? "بانتظار التفعيل" : "منتهي"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {store.planRenewsAt
                  ? state === "expired"
                    ? `انتهى في ${formatDate(store.planRenewsAt)}`
                    : daysLeft !== null && daysLeft <= 5
                      ? `بيتجدد في ${formatDate(store.planRenewsAt)} — فاضل ${daysLeft} يوم`
                      : `بيتجدد في ${formatDate(store.planRenewsAt)}`
                  : "أول اشتراك بيبدأ من تاريخ تأكيد التحويل."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-xs font-bold text-foreground ring-1 ring-border">
            <CalendarClock className="h-4 w-4 text-primary" />
            {store.plan === "trial" ? "7 أيام تجربة" : "اشتراك مدفوع"}
          </div>
        </div>
      </div>

      <SubscriptionForm storeId={store.id} defaultPhone={store.phone} hasPending={pending} />

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-extrabold text-foreground">طلبات الاشتراك السابقة</h2>
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted">
            مفيش طلبات اشتراك لسه. اختار خطة وحوّل، وهنفعّل متجرك على طول.
          </div>
        ) : (
          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-surface/80 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 text-start font-bold">الخطة</th>
                    <th className="px-5 py-3 text-start font-bold">طريقة الدفع</th>
                    <th className="px-5 py-3 text-start font-bold">المبلغ</th>
                    <th className="px-5 py-3 text-start font-bold">المرجع</th>
                    <th className="px-5 py-3 text-start font-bold">الحالة</th>
                    <th className="px-5 py-3 text-start font-bold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((request) => {
                    const status = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending;
                    return (
                      <tr key={request.id} className="transition-colors hover:bg-surface/60">
                        <td className="px-5 py-3.5 font-bold text-foreground">
                          {request.plan === "yearly" ? "سنوي" : "شهري"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {METHOD_LABEL[request.method] || request.method}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground">
                          {formatMoney(request.amount, "EGP")}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted" dir="ltr">
                          {request.reference}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted">{formatDate(request.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
