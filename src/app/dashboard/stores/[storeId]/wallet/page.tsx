import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Wallet, CreditCard, Banknote, ArrowRight } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { formatMoney, formatNumber } from "@/lib/format";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export default async function WalletPage(props: { params: Promise<{ storeId: string }> }) {
  const session = await getSession();
  const { storeId } = await props.params;

  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session!.userId },
  });
  if (!store) notFound();

  // Recent wallet activity (mocked from orders for now — real transactions can be added later)
  const orders = await prisma.order.findMany({
    where: { storeId, status: "delivered" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, total: true, createdAt: true, customerName: true },
  });

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel={store.name}
        eyebrow="محفظتك"
        title="رصيد متجرك"
        subtitle="مجموع المبيعات اللي اتصلحت واتسلمت للعملاء."
        icon={<Wallet className="h-6 w-6" />}
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
            يتم تحديث الرصيد تلقائيًا जब يتم تسليم الطلب.
          </p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">مبيعات مسلمة</p>
              <div className="mt-1 text-2xl font-extrabold text-foreground">
                {formatNumber(orders.length)}
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CreditCard className="h-7 w-7" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            من إجمالي متجرك "{store.name}".
          </p>
        </div>

        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">إجمالي الإيرادات</p>
              <div className="mt-1 text-2xl font-extrabold text-foreground">
                {formatMoney(
                  orders.reduce((s, o) => s + o.total, 0),
                  store.currency
                )}
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <ArrowRight className="h-7 w-7" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            الطلبات اللي حالتها "تم التوصيل".
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

      {/* Recent activity */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold text-foreground">آخر الحركات</h2>
          {orders.length === 0 && (
            <span className="text-[11px] text-muted">مفيش حركات بعد</span>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/50 p-10 text-center text-sm text-muted">
            لسه مفيش طلبات تم تسليمها. أول ما يتسلم طلب من عميلك، هتظهر هنا حركة الرصيد.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-start font-bold">الطلب</th>
                  <th className="px-5 py-3 text-start font-bold">العميل</th>
                  <th className="px-5 py-3 text-start font-bold">المبلغ</th>
                  <th className="px-5 py-3 text-start font-bold">الحالة</th>
                  <th className="px-5 py-3 text-start font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface/60">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-foreground">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 text-foreground">{order.customerName}</td>
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      {formatMoney(order.total, store.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        تم التوصيل
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
