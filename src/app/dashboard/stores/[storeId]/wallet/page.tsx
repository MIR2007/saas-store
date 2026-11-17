import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { formatMoney, formatNumber } from "@/lib/format";
import { cardClass, secondaryBtn } from "@/lib/ui";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function WalletPage(props: { params: Promise<{ storeId: string }> }) {
  const session = await getSession();
  const { storeId } = await props.params;

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session!.userId },
  });
  if (!store) notFound();

  const [transactions, credits, debits] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { order: { select: { id: true, customerName: true } } },
    }),
    prisma.walletTransaction.aggregate({
      where: { storeId, type: "credit" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.walletTransaction.aggregate({
      where: { storeId, type: "debit" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalCredits = credits._sum.amount ?? 0;
  const totalDebits = debits._sum.amount ?? 0;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel={store.name}
        eyebrow="محفظتك"
        title="رصيد متجرك"
        subtitle="كل حركة على الرصيد بتتسجل هنا — الإضافة عند تسليم الطلب والخصم عند إلغاء التسليم."
        icon={<Wallet className="h-6 w-6" />}
        action={
          <Link href={`/dashboard/stores/${storeId}/orders`} className={secondaryBtn}>
            الطلبات
          </Link>
        }
      />

      <div className="mb-9 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">الرصيد الحالي</p>
              <div className="mt-1 text-3xl font-extrabold text-foreground">
                {formatMoney(store.walletBalance, store.currency)}
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Banknote className="h-7 w-7" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            بيتحدّث تلقائيًا لما حالة الطلب تتغيّر لـ «تم التوصيل».
          </p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">إجمالي الإيداعات</p>
              <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatMoney(totalCredits, store.currency)}
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-7 w-7" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {formatNumber(credits._count)} حركة إيداع.
          </p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">إجمالي الخصومات</p>
              <div className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {formatMoney(totalDebits, store.currency)}
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="h-7 w-7" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {formatNumber(debits._count)} حركة خصم (إلغاء تسليم).
          </p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">العملة</p>
              <div className="mt-1 text-xl font-bold text-foreground">
                {store.currency === "EGP" ? "ج.م" : store.currency}
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-surface/50 text-muted">
              <CreditCard className="h-7 w-7 opacity-50" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            يمكن تغييرها من إعدادات المتجر.
          </p>
        </div>
      </div>

      <div className={`${cardClass} p-6`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">آخر الحركات</h2>
          {transactions.length === 0 && (
            <span className="text-[11px] text-muted">مفيش حركات بعد</span>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/50 p-10 text-center text-sm text-muted">
            لسه مفيش حركات على الرصيد. أول ما تسلّم طلب، هيتضاف مبلغه هنا تلقائيًا.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 text-start font-bold">النوع</th>
                    <th className="px-5 py-3 text-start font-bold">البيان</th>
                    <th className="px-5 py-3 text-start font-bold">الطلب</th>
                    <th className="px-5 py-3 text-start font-bold">المبلغ</th>
                    <th className="px-5 py-3 text-start font-bold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((transaction) => {
                    const credit = transaction.type === "credit";
                    return (
                      <tr key={transaction.id} className="transition-colors hover:bg-surface/60">
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              credit
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {credit ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            {credit ? "إيداع" : "خصم"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-foreground">
                          {transaction.description || (credit ? "مبيعات طلب" : "إلغاء تسليم")}
                        </td>
                        <td className="px-5 py-3.5">
                          {transaction.order ? (
                            <Link
                              href={`/dashboard/stores/${storeId}/orders/${transaction.order.id}`}
                              className="font-mono text-[11px] font-bold text-primary hover:underline"
                            >
                              #{transaction.order.id.slice(-6).toUpperCase()}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-muted">—</span>
                          )}
                          {transaction.order?.customerName && (
                            <div className="text-[10px] text-muted">{transaction.order.customerName}</div>
                          )}
                        </td>
                        <td
                          className={`px-5 py-3.5 font-bold ${
                            credit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {credit ? "+" : "−"} {formatMoney(transaction.amount, store.currency)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted">{formatDate(transaction.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
