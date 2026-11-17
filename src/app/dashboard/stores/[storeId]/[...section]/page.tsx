import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, primaryBtn, secondaryBtn } from "@/lib/ui";
import { storePublicUrl } from "@/lib/domains";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Check,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Globe2,
  Layers,
  LifeBuoy,
  Megaphone,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Truck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ModuleInfo = {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "soon" | "info";
  highlights: string[];
  note?: string;
};

const modules: Record<string, ModuleInfo> = {
  subscription: {
    title: "اشتراكك في Bee Panal",
    eyebrow: "الاشتراكات",
    description: "خطة الإطلاق المجانية شغالة على متجرك: منتجات وطلبات غير محدودة بدون رسوم شهرية.",
    icon: CreditCard,
    status: "active",
    highlights: [
      "منتجات وطلبات غير محدودة",
      "سب دومين مجاني على beepanal.store",
      "لوحة تحكم كاملة ومحفظة مبيعات",
      "دعم فني على مدار الأسبوع",
    ],
    note: "خطط الاشتراك المدفوعة (Pro / Business) هتكون متاحة قريبًا مع مزايا إضافية.",
  },
  reviews: {
    title: "تقييمات العملاء",
    eyebrow: "المنتجات",
    description: "اجمع تقييمات العملاء لكل منتج واعرضها في واجهة المتجر لزيادة الثقة ومعدل التحويل.",
    icon: Star,
    status: "soon",
    highlights: [
      "تقييم بالنجوم لكل منتج",
      "تعليقات وصور من العملاء",
      "تقييم المتجر بشكل عام",
      "الموافقة على التقييمات قبل نشرها",
    ],
  },
  coupons: {
    title: "كوبونات الخصم",
    eyebrow: "أدوات التسويق",
    description: "اعمل كوبونات خصم بالنسبة المئوية أو مبلغ ثابت، وحدد مدة الصلاحية وحد الاستخدام.",
    icon: Ticket,
    status: "soon",
    highlights: [
      "خصم نسبة % أو مبلغ ثابت",
      "حد أدنى لقيمة الطلب",
      "تاريخ بداية ونهاية",
      "تتبع عدد مرات الاستخدام",
    ],
  },
  "marketing/cross-selling": {
    title: "Cross Selling",
    eyebrow: "أدوات التسويق",
    description: "اقترح منتجات مكمّلة للعميل وقت الشراء — «اشتري معاه» — وارفع متوسط قيمة الطلب.",
    icon: Layers,
    status: "soon",
    highlights: [
      "ربط منتجات مكمّلة ببعضها",
      "اقتراحات تلقائية في صفحة المنتج",
      "اقتراحات في السلة وصفحة الشراء",
      "تتبع تأثير الاقتراحات على المبيعات",
    ],
  },
  "marketing/tracking": {
    title: "أدوات تتبع الحملات",
    eyebrow: "أدوات التسويق",
    description: "قِس نتائج حملاتك الإعلانية واعرف إعلان إيه اللي بيجيب طلبات فعلية.",
    icon: BarChart3,
    status: "soon",
    highlights: [
      "تتبع مصادر الزيارات",
      "ربط كل طلب بالحملة الإعلانية",
      "تقارير تكلفة الاستحواذ",
      "مقارنة أداء القنوات",
    ],
  },
  "marketing/retargeting": {
    title: "إعادة الاستهداف",
    eyebrow: "أدوات التسويق",
    description: "ارجّع العملاء اللي سابوا السلة أو زاروا المتجر من غير شراء بحملات ذكية.",
    icon: Zap,
    status: "soon",
    highlights: [
      "سلات متروكة تلقائيًا",
      "جمهور مخصص من زوار المتجر",
      "حملات واتساب وماسنجر",
      "رسائل استرجاع جاهزة",
    ],
  },
  "marketing/services": {
    title: "خدمات التسويق",
    eyebrow: "أدوات التسويق",
    description: "فريق Bee Panal يقدر يجهّز لك حملة إعلانية كاملة أو يدير صفحتك الإعلانية.",
    icon: Megaphone,
    status: "info",
    highlights: [
      "إدارة حملات فيسبوك وإنستجرام",
      "تصميم إعلانات وصفحات هبوط",
      "كتابة إعلانات بالعامية المصرية",
      "تقارير شهرية للأداء",
    ],
    note: "خدمات التسويق متاحة بالطلب — تواصل مع فريق Bee Panal لمعرفة الباقات.",
  },
  "marketing/google-tag": {
    title: "الربط مع جوجل تاج",
    eyebrow: "أدوات التسويق",
    description: "اربط Google Tag Manager وGoogle Analytics 4 لمتابعة كل حدث على متجرك.",
    icon: Globe2,
    status: "soon",
    highlights: [
      "Google Tag Manager",
      "Google Analytics 4",
      "Google Ads Conversion",
      "أحداث إضافة للسلة والشراء",
    ],
  },
  notifications: {
    title: "إشعارات الطلبات",
    eyebrow: "الطلبات",
    description: "تابع كل طلب جديد أول ما يوصل، وتأكد إن مفيش طلب ضايع أو مستني رد.",
    icon: Bell,
    status: "info",
    highlights: [
      "تنبيه لكل طلب جديد",
      "تنبيه للطلبات اللي بانتظار التأكيد",
      "إشعارات واتساب للتاجر",
      "ملخص يومي بالمبيعات",
    ],
    note: "تقدر تشوف كل الطلبات دلوقتي من صفحة «كل الطلبات».",
  },
  "wallet/transactions": {
    title: "معاملات المحفظة",
    eyebrow: "محفظتك",
    description: "سجل كامل لكل حركة على رصيد متجرك: مبيعات مسلمة، تسويات، وسحوبات.",
    icon: Wallet,
    status: "info",
    highlights: [
      "رصيد متجدد تلقائيًا مع كل طلب مسلّم",
      "تفاصيل كل معاملة",
      "طلبات السحب",
      "تصدير كشف الحساب",
    ],
    note: "آخر الحركات متاحة دلوقتي في صفحة «رصيدك».",
  },
  affiliate: {
    title: "نظام التسويق بالعمولة",
    eyebrow: "اربح معنا",
    description: "اربح عمولة على كل تاجر جديد ينضم لـ Bee Panal من خلال رابطك.",
    icon: Coins,
    status: "info",
    highlights: [
      "رابط إحالة خاص بك",
      "عمولة على الاشتراكات المدفوعة",
      "لوحة تتبع الأرباح",
      "سحب الأرباح للمحفظة",
    ],
    note: "نظام العمولة هيتفعّل مع إطلاق الخطط المدفوعة.",
  },
  alerts: {
    title: "الإشعارات",
    eyebrow: "مركز الإشعارات",
    description: "كل تنبيهات متجرك في مكان واحد: طلبات، مخزون، ورسائل النظام.",
    icon: Bell,
    status: "info",
    highlights: [
      "تنبيهات الطلبات الجديدة",
      "تنبيهات نفاذ المخزون",
      "رسائل من فريق Bee Panal",
      "تحديثات المنصة",
    ],
    note: "مركز الإشعارات المتقدم قيد التجهيز — طلباتك متاحة الآن من صفحة الطلبات.",
  },
  "apps/payment-gateways": {
    title: "بوابات الدفع",
    eyebrow: "التطبيقات",
    description: "الدفع عند الاستلام شغال دلوقتي. بوابات الدفع الإلكترونية هتتفعّل قريبًا.",
    icon: CreditCard,
    status: "active",
    highlights: [
      "الدفع عند الاستلام (COD) — فعّال",
      "إنستاباي — قريبًا",
      "فوري — قريبًا",
      "فودافون كاش — قريبًا",
    ],
    note: "كل الطلبات الحالية بتتحصّل عند الاستلام. هتوصلك رسالة أول ما بوابات الدفع تتاح.",
  },
  "apps/pages": {
    title: "صفحات المتجر",
    eyebrow: "التطبيقات",
    description: "اعمل صفحات مخصصة: من نحن، اتصل بنا، سياسة الاستبدال، وأسئلة شائعة.",
    icon: FileText,
    status: "soon",
    highlights: [
      "من نحن",
      "اتصل بنا",
      "سياسة الاستخدام والخصوصية",
      "أسئلة شائعة",
    ],
  },
  "apps/integrations": {
    title: "ربط بمنصات أخرى",
    eyebrow: "التطبيقات",
    description: "وصّل متجرك بأنظمة المخزون والشحن والمحاسبة والذكاء الاصطناعي.",
    icon: Share2,
    status: "soon",
    highlights: [
      "Google Sheets",
      "WooCommerce / Shopify",
      "شركات الشحن المصرية",
      "Webhooks وPublic API",
    ],
  },
  "settings/shipping": {
    title: "مناطق الشحن",
    eyebrow: "الإعدادات",
    description: "حدد المحافظات اللي بتشحن لها ورسوم التوصيل لكل منطقة.",
    icon: Truck,
    status: "info",
    highlights: [
      "الشحن لكل محافظات مصر",
      "رسوم مختلفة لكل محافظة",
      "شحن مجاني بعد مبلغ معين",
      "مدة التوصيل المتوقعة",
    ],
    note: "الشحن الافتراضي حاليًا لكل المحافظات بنفس الرسوم. التخصيص قيد التجهيز.",
  },
  "settings/thank-you": {
    title: "صفحة الشكر",
    eyebrow: "الإعدادات",
    description: "خصّص رسالة ما بعد الشراء وحفّز العميل إنه يشتري تاني أو يتابعك.",
    icon: Sparkles,
    status: "soon",
    highlights: [
      "رسالة شكر مخصصة",
      "كود خصم للطلب القادم",
      "روابط السوشيال ميديا",
      "متابعة الطلب",
    ],
  },
  "settings/social": {
    title: "روابط التواصل الاجتماعي",
    eyebrow: "الإعدادات",
    description: "ضيف صفحات متجرك على فيسبوك وإنستجرام وتيك توك عشان العميل يتابعك.",
    icon: Share2,
    status: "soon",
    highlights: [
      "Facebook",
      "Instagram",
      "TikTok",
      "WhatsApp",
    ],
  },
  "settings/moderators": {
    title: "المديرين",
    eyebrow: "الإعدادات",
    description: "ضيف أعضاء فريقك بصلاحيات محددة: إدارة الطلبات، المنتجات، أو التقارير.",
    icon: Users,
    status: "soon",
    highlights: [
      "دعوة بالبريد الإلكتروني",
      "صلاحيات لكل قسم",
      "سجل نشاط المديرين",
      "إيقاف الوصول فورًا",
    ],
  },
  support: {
    title: "طلب تطويرات",
    eyebrow: "الدعم",
    description: "محتاج ميزة معينة في متجرك؟ ابعتلنا وصفها وفريق Bee Panal هيراجعها.",
    icon: LifeBuoy,
    status: "info",
    highlights: [
      "طلب ميزة جديدة",
      "تعديل في التصميم",
      "ربط خدمة خارجية",
      "استشارة نمو المتجر",
    ],
    note: "الميزة دي هتتحول لنموذج طلبات مباشر خلال التحديث القادم.",
  },
};

const statusStyle = {
  active: {
    label: "فعّال دلوقتي",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    icon: Check,
  },
  soon: {
    label: "قيد التجهيز",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    icon: Clock,
  },
  info: {
    label: "متاح بالطلب",
    className: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    icon: ShieldCheck,
  },
} as const;

export default async function StoreModulePage(props: PageProps<"/dashboard/stores/[storeId]/[...section]">) {
  const session = await getSession();
  const { storeId, section } = await props.params;

  const store = await prisma.store.findFirst({ where: { id: storeId, userId: session!.userId } });
  if (!store) notFound();

  const key = (section || []).join("/");
  if (key === "themes") redirect(`/dashboard/stores/${storeId}/design`);

  const info = modules[key];
  if (!info) notFound();

  const status = statusStyle[info.status];
  const StatusIcon = status.icon;
  const backHref =
    key.startsWith("settings/") ? `/dashboard/stores/${storeId}/settings` : `/dashboard/stores/${storeId}`;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={backHref}
        backLabel={key.startsWith("settings/") ? "إعدادات المتجر" : store.name}
        eyebrow={info.eyebrow}
        title={info.title}
        subtitle={info.description}
        icon={<info.icon className="h-6 w-6" />}
        action={
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ${status.className}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <section className={`${cardClass} relative overflow-hidden p-7 lg:col-span-7`}>
          <div className="absolute -end-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.07] blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Bee Panal Modules</p>
            <h2 className="mt-2 text-xl font-extrabold text-foreground">إيه اللي هيتفعّل مع الميزة دي؟</h2>
            <ul className="mt-5 space-y-3">
              {info.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
            {info.note && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-surface/60 px-4 py-3 text-[11px] leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {info.note}
              </div>
            )}
          </div>
        </section>

        <div className="space-y-5 lg:col-span-5">
          <section className={`${cardClass} p-6`}>
            <h2 className="font-extrabold text-foreground">متجرك جاهز يشتغل</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              كل الأساسيات شغالة دلوقتي: المنتجات، الطلبات، المحفظة، التصميم، والسب دومين المجاني.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link href={`/dashboard/stores/${storeId}`} className={`${primaryBtn} justify-center`}>
                <ArrowLeft className="h-4 w-4" />
                رجوع للوحة المتجر
              </Link>
              <Link href={`/dashboard/stores/${storeId}/products`} className={`${secondaryBtn} justify-center`}>
                إدارة المنتجات
              </Link>
              <a href={storePublicUrl(store.slug, store.customDomain)} target="_blank" rel="noreferrer" className={`${secondaryBtn} justify-center`}>
                <Globe2 className="h-4 w-4" />
                فتح المتجر
              </a>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/20">
            <Sparkles className="h-5 w-5 text-white/80" />
            <h3 className="mt-2 text-base font-extrabold">الميزة دي جزء من خطة Bee Panal</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/85">
              بنطوّر المنصة باستمرار. أول ما الميزة تتاح، هتلاقيها مفعّلة في لوحتك تلقائيًا.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">2026</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">Bee Panal</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
