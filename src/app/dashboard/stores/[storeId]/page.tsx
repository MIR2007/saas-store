import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Clock,
  Eye,
  FolderTree,
  Globe2,
  Package,
  Palette,
  Phone,
  Plus,
  Settings,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { primaryBtn, secondaryBtn, cardClass } from "@/lib/ui";
import { storePublicUrl } from "@/lib/domains";
import { getStoreTheme } from "@/lib/themes";
import { daysUntil, subscriptionState } from "@/lib/store-status";
import { cairoStartOfDay, cairoWeekday } from "@/lib/dates";

function firstImage(raw: string | undefined | null) {
  try {
    const images = JSON.parse(raw || "[]");
    return Array.isArray(images) ? images[0] || "" : "";
  } catch {
    return "";
  }
}

export default async function StoreDetailPage(props: PageProps<"/dashboard/stores/[storeId]">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session!.userId },
    include: { _count: { select: { products: true, orders: true, categories: true } } },
  });
  if (!store) notFound();

  const now = new Date();
  const weekStart = cairoStartOfDay(6);

  const [recentOrders, weekOrders, orderItems, lowStock, lowStockCount, pendingCount, revenueAgg] =
    await Promise.all([
      prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: { include: { product: { select: { images: true } } } } },
      }),
      prisma.order.findMany({
        where: { storeId, createdAt: { gte: weekStart } },
        select: { id: true, total: true, status: true, createdAt: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { storeId, status: { not: "cancelled" } } },
        select: { name: true, quantity: true },
        take: 2000,
      }),
      prisma.product.findMany({
        where: { storeId, active: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
        select: { id: true, name: true, stock: true, images: true },
      }),
      prisma.product.count({ where: { storeId, active: true, stock: { lte: 5 } } }),
      prisma.order.count({ where: { storeId, status: "pending" } }),
      prisma.order.aggregate({
        where: { storeId, status: { not: "cancelled" } },
        _sum: { total: true },
      }),
    ]);

  const revenue = revenueAgg._sum.total ?? 0;
  const subState = subscriptionState(store);
  const daysLeft = daysUntil(store.planRenewsAt);

  const days = Array.from({ length: 7 }, (_, index) => {
    const daysAgo = 6 - index;
    const start = cairoStartOfDay(daysAgo);
    const end = daysAgo === 0 ? now : cairoStartOfDay(daysAgo - 1);
    return {
      start,
      end,
      label: daysAgo === 0 ? "النهاردة" : cairoWeekday(start),
      total: 0,
      orders: 0,
    };
  });

  for (const order of weekOrders) {
    if (order.status === "cancelled") continue;
    const created = order.createdAt.getTime();
    const bucket = days.find(
      (day) => created >= day.start.getTime() && created < day.end.getTime()
    );
    if (bucket) {
      bucket.total += order.total;
      bucket.orders += 1;
    }
  }

  const today = days[6];
  const weekRevenue = days.reduce((sum, day) => sum + day.total, 0);
  const chartMax = Math.max(1, ...days.map((day) => day.total));

  const productTotals = new Map<string, number>();
  for (const item of orderItems) {
    productTotals.set(item.name, (productTotals.get(item.name) || 0) + item.quantity);
  }
  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));
  const topMax = Math.max(1, ...topProducts.map((product) => product.quantity));

  const conversion =
    store.views > 0 ? (store._count.orders / store.views) * 100 : null;
  const conversionLabel =
    conversion === null
      ? "—"
      : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(conversion)}%`;

  const storeUrl = storePublicUrl(store.slug, store.customDomain, store.customDomainStatus);
  const storeLink = (path = "") => `/dashboard/stores/${store.id}${path}`;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref="/dashboard/stores"
        backLabel="كل المتاجر"
        eyebrow="لوحة المتجر"
        title={store.name}
        subtitle={`${store.slug}.beepanal.store`}
        icon={<Store className="h-6 w-6" />}
        action={
          <>
            <Link href={storeLink("/settings")} className={secondaryBtn}>
              <Settings className="h-4 w-4" />
              الإعدادات
            </Link>
            <a href={storeUrl} target="_blank" rel="noreferrer" className={primaryBtn}>
              عرض المتجر
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </>
        }
      />

      {/* Subscription reminders */}
      {subState === "expired" && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                اشتراك المتجر منتهي
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-700/80 dark:text-rose-300/80">
                المتجر متوقف للعملاء ومش بيستقبل طلبات جديدة. فعّل الاشتراك عشان ترجع تبيع.
              </p>
            </div>
          </div>
          <Link
            href={storeLink("/subscription")}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-rose-700"
          >
            تجديد الاشتراك
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {subState === "active" && daysLeft !== null && daysLeft <= 5 && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
                {daysLeft <= 0 ? "اشتراكك بينتهي النهاردة" : `اشتراكك بيتجدد خلال ${daysLeft} يوم`}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                جدّد دلوقتي عشان متوقفش استقبال الطلبات. التجديد بيمتد من تاريخ الانتهاء الحالي.
              </p>
            </div>
          </div>
          <Link
            href={storeLink("/subscription")}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-amber-600"
          >
            تجديد الاشتراك
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Store banner */}
      <div
        className="relative mb-7 overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-7"
        style={{
          background: `linear-gradient(135deg, ${store.themeColor}, ${store.themeColor}b3)`,
          boxShadow: `0 24px 60px -28px ${store.themeColor}aa`,
        }}
      >
        <div className="absolute -end-14 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-20 start-1/4 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-extrabold backdrop-blur-md">
              {store.name.charAt(0)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold sm:text-2xl">{store.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                    store.active
                      ? "bg-emerald-400/20 text-emerald-50 ring-emerald-200/30"
                      : "bg-black/20 text-white/80 ring-white/20"
                  }`}
                >
                  {store.active ? "شغال" : "متوقف"}
                </span>
              </div>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/80">
                {store.description || "ضيف وصف صغير لمتجرك من الإعدادات عشان عملاءك يعرفوك أكتر."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-bold backdrop-blur">
              {store.currency}
            </span>
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-bold backdrop-blur">
              ثيم {getStoreTheme(store.theme).name}
            </span>
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-bold backdrop-blur">
              اللون {store.themeColor}
            </span>
          </div>
        </div>
      </div>

      {/* Today */}
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-extrabold text-foreground">النهاردة</h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted">
          بتوقيت القاهرة
        </span>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="طلبات النهاردة"
          value={formatNumber(today.orders)}
          hint="بدون الطلبات الملغية"
          tone="amber"
        />
        <StatCard
          icon={Wallet}
          label="مبيعات النهاردة"
          value={formatMoney(today.total, store.currency)}
          hint="صافي مبيعات اليوم"
          tone="emerald"
        />
        <StatCard
          icon={Clock}
          label="مستنية التأكيد"
          value={formatNumber(pendingCount)}
          hint="محتاج متابعة"
          tone="rose"
        />
        <StatCard
          icon={AlertTriangle}
          label="مخزون منخفض"
          value={formatNumber(lowStockCount)}
          hint="5 قطع أو أقل"
          tone="violet"
        />
      </div>

      {/* Insights */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className={`${cardClass} p-5 lg:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                مبيعات آخر 7 أيام
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">إجمالي المبيعات بدون الطلبات الملغية.</p>
            </div>
            <div className="text-end">
              <div className="text-lg font-extrabold text-foreground">
                {formatMoney(weekRevenue, store.currency)}
              </div>
              <div className="text-[10px] text-muted">إجمالي الأسبوع</div>
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2 sm:gap-3">
            {days.map((day, index) => {
              const height = day.total > 0 ? Math.max(6, Math.round((day.total / chartMax) * 100)) : 3;
              const isToday = index === days.length - 1;
              return (
                <div key={day.label + index} className="flex flex-1 flex-col items-center">
                  <div
                    className="flex h-32 w-full items-end"
                    title={`${day.label}: ${formatMoney(day.total, store.currency)} · ${day.orders} طلب`}
                  >
                    <div
                      className={`relative w-full rounded-t-lg transition-all ${
                        isToday
                          ? "bg-gradient-to-t from-amber-600 to-orange-400"
                          : "bg-gradient-to-t from-amber-500/70 to-orange-300/70"
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      {day.total > 0 && (
                        <span className="absolute inset-x-0 -top-5 text-center text-[9px] font-bold text-muted">
                          {formatNumber(Math.round(day.total))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`mt-2 truncate text-center text-[10px] font-bold ${
                      isToday ? "text-primary" : "text-muted"
                    }`}
                  >
                    {day.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-extrabold text-foreground">
              <Package className="h-5 w-5 text-primary" />
              أفضل المنتجات
            </h2>
            <Link href={storeLink("/products")} className="text-[11px] font-bold text-primary hover:underline">
              الكل
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border bg-surface/50 p-4 text-center text-xs text-muted">
              لسه مفيش مبيعات كفاية لعرض أفضل المنتجات.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((product, index) => (
                <li key={product.name}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-amber-500/10 text-[10px] font-extrabold text-primary">
                        {index + 1}
                      </span>
                      <span className="truncate font-semibold text-foreground">{product.name}</span>
                    </span>
                    <span className="shrink-0 font-bold text-muted">{formatNumber(product.quantity)} قطعة</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-amber-500 to-orange-400"
                      style={{ width: `${Math.max(6, (product.quantity / topMax) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Alerts + quick actions */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className={`${cardClass} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-extrabold text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              مخزون محتاج متابعة
            </h2>
            <Link href={storeLink("/products")} className="text-[11px] font-bold text-primary hover:underline">
              إدارة المنتجات
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Package className="h-4 w-4" />
              كل المنتجات النشطة مخزونها كويس.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface">
                    {firstImage(product.images) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstImage(product.images)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-muted" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {product.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      product.stock === 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {product.stock === 0 ? "خلص" : `${formatNumber(product.stock)} متبقي`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {lowStockCount > lowStock.length && (
            <p className="mt-2 text-[10px] text-muted">
              و{formatNumber(lowStockCount - lowStock.length)} منتج آخر محتاج متابعة.
            </p>
          )}
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-extrabold text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            اختصارات سريعة
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={storeLink("/products/new")}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/50 px-3 py-3 text-center text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-4 w-4 text-primary" />
              إضافة منتج
            </Link>
            <Link
              href={storeLink("/orders")}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/50 px-3 py-3 text-center text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ShoppingBag className="h-4 w-4 text-primary" />
              الطلبات
            </Link>
            <Link
              href={storeLink("/design")}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/50 px-3 py-3 text-center text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Palette className="h-4 w-4 text-primary" />
              تعديل التصميم
            </Link>
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/50 px-3 py-3 text-center text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Globe2 className="h-4 w-4 text-primary" />
              عرض المتجر
            </a>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                <Eye className="h-3.5 w-3.5" />
                نسبة التحويل
              </span>
              <span className="text-lg font-extrabold text-foreground">{conversionLabel}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted">
              {formatNumber(store.views)} زيارة → {formatNumber(store._count.orders)} طلب
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        <StatCard icon={Package} label="المنتجات" value={formatNumber(store._count.products)} hint="منتج في المتجر" tone="amber" />
        <StatCard icon={ShoppingBag} label="الطلبات" value={formatNumber(store._count.orders)} hint="طلب إجمالي" tone="violet" />
        <StatCard icon={FolderTree} label="التصنيفات" value={formatNumber(store._count.categories)} hint="قسم في المتجر" tone="sky" />
        <StatCard icon={Eye} label="الزوار" value={formatNumber(store.views)} hint="زيارة للمتجر" tone="rose" />
        <StatCard icon={Wallet} label="صافي المبيعات" value={formatMoney(revenue, store.currency)} hint="بدون الطلبات الملغية" tone="emerald" />
      </div>

      {/* Basic info */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            رابط المتجر
          </div>
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 block truncate font-mono text-xs font-bold text-foreground hover:text-primary"
            dir="ltr"
          >
            {store.customDomain || `${store.slug}.beepanal.store`}
          </a>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            <Phone className="h-3.5 w-3.5 text-primary" />
            واتساب المتجر
          </div>
          <div className="mt-1.5 truncate text-sm font-bold text-foreground" dir="ltr">
            {store.phone || "لسه مضفتوش"}
          </div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            الاشتراك
          </div>
          <div className="mt-1.5 text-sm font-bold text-foreground">
            {store.plan === "yearly" ? "سنوي" : store.plan === "monthly" ? "شهري" : "تجربة مجانية"}
          </div>
          <div className="text-[10px] text-muted">
            {store.planStatus === "active" ? "نشط" : store.planStatus === "pending" ? "بانتظار التفعيل" : "منتهي"}
          </div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            تاريخ الإنشاء
          </div>
          <div className="mt-1.5 text-sm font-bold text-foreground">{formatDate(store.createdAt)}</div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-extrabold text-foreground">آخر الطلبات</h2>
        </div>
        {recentOrders.length > 0 && (
          <Link href={storeLink("/orders")} className="text-xs font-bold text-primary hover:underline">
            كل الطلبات
          </Link>
        )}
      </div>

      {recentOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted">
          لسه مفيش طلبات في المتجر ده. أول ما حد يشتري هتلاقي الطلب هنا على طول.
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface/80 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-start font-bold">العميل</th>
                  <th className="px-5 py-3 text-start font-bold">المنتجات</th>
                  <th className="px-5 py-3 text-start font-bold">المبلغ</th>
                  <th className="px-5 py-3 text-start font-bold">الحالة</th>
                  <th className="px-5 py-3 text-start font-bold">التاريخ</th>
                  <th className="px-5 py-3 text-start font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">
                          {order.customerName.charAt(0)}
                        </span>
                        <div>
                          <div className="font-semibold text-foreground">{order.customerName}</div>
                          <div className="text-[10px] text-muted">{order.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface text-muted">
                          {firstImage(order.items[0]?.product?.images) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImage(order.items[0]?.product?.images)}
                              alt={order.items[0]?.name || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                        </span>
                        <span className="truncate">
                          {order.items[0]?.name}
                          {order.items.length > 1 && (
                            <span className="text-[10px] text-muted"> +{order.items.length - 1}</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      {formatMoney(order.total, store.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={storeLink(`/orders/${order.id}`)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        تفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
