"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CreditCard,
  FileSpreadsheet,
  FolderTree,
  Footprints,
  Gem,
  Gift,
  Handshake,
  Headphones,
  Inbox,
  Laptop,
  Mail,
  Menu,
  Package,
  Paintbrush,
  Palette,
  Play,
  Quote,
  ShieldCheck,
  ShoppingBag,
  Shirt,
  Sofa,
  Sparkles,
  SprayCan,
  Star,
  Ticket,
  type LucideIcon,
  Upload,
  Users,
  Watch,
  X,
  Zap,
} from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";
import Counter from "@/components/Counter";
import HeroMockup from "@/components/landing/HeroMockup";
import { VERSION } from "@/lib/version";

const BRAND_MARKS = ["NOOR", "LAYALI", "TECHHUB", "ZAHRA", "CASA", "GLOW", "URBAN", "LITTLE ONE"];

const THEME_IMAGES = {
  fashion: "/images/theme-fashion.jpg",
  perfume: "/images/theme-perfume.jpg",
  electronics: "/images/theme-electronics.jpg",
  beauty: "/images/theme-beauty.jpg",
  furniture: "/images/theme-furniture.jpg",
  sports: "/images/theme-sports.jpg",
};

const PAYMENTS = ["فوري", "إنستاباي", "فودافون كاش", "ميزة", "Visa", "Mastercard"];

const SOCIALS = [
  {
    label: "Instagram",
    href: "#",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z",
  },
  {
    label: "Facebook",
    href: "#",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    label: "X",
    href: "#",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
];

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: ReactNode;
  desc?: string;
}) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary ring-1 ring-primary/15">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-balance text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 leading-relaxed text-muted">{desc}</p>}
    </div>
  );
}

function IconBox({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export default function Home() {
  const { locale } = useLang();
  const ar = locale === "ar";
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min((window.scrollY / total) * 100, 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: ar ? "المزايا" : "Features" },
    { href: "#themes", label: ar ? "التصاميم" : "Themes" },
    { href: "#growth", label: ar ? "أدوات النمو" : "Growth" },
    { href: "#pricing", label: ar ? "الأسعار" : "Pricing" },
    { href: "#faq", label: ar ? "الأسئلة" : "FAQ" },
  ];

  const trustAvatars = ar
    ? [
        { initial: "أ", bg: "from-amber-400 to-orange-500" },
        { initial: "س", bg: "from-rose-400 to-pink-500" },
        { initial: "م", bg: "from-sky-400 to-blue-500" },
        { initial: "ن", bg: "from-emerald-400 to-teal-500" },
      ]
    : [
        { initial: "A", bg: "from-amber-400 to-orange-500" },
        { initial: "S", bg: "from-rose-400 to-pink-500" },
        { initial: "M", bg: "from-sky-400 to-blue-500" },
        { initial: "N", bg: "from-emerald-400 to-teal-500" },
      ];

  const stats = [
    { value: 2, suffix: "K+", decimals: 0, label: ar ? "متجر نشط" : "Active stores" },
    { value: 300, suffix: "K+", decimals: 0, label: ar ? "طلب تمت معالجته" : "Orders processed" },
    { value: 27, suffix: "", decimals: 0, label: ar ? "محافظة بنوصلها" : "Governorates covered" },
    { value: 99.9, suffix: "%", decimals: 1, label: ar ? "وقت تشغيل" : "Uptime" },
  ];

  const stores = [
    {
      img: THEME_IMAGES.fashion,
      category: ar ? "أزياء" : "Fashion",
      name: ar ? "متجر النخبة" : "Elite Store",
      tag: ar ? "أزياء وموضة عصرية" : "Modern fashion & apparel",
      icon: Shirt,
      bg: "from-rose-400 via-orange-400 to-amber-500",
    },
    {
      img: THEME_IMAGES.perfume,
      category: ar ? "عطور" : "Perfume",
      name: ar ? "ليالي" : "Layali",
      tag: ar ? "عطور فاخرة" : "Luxury fragrances",
      icon: SprayCan,
      bg: "from-amber-600 via-orange-500 to-yellow-500",
    },
    {
      img: THEME_IMAGES.electronics,
      category: ar ? "إلكترونيات" : "Electronics",
      name: ar ? "تِك هَب" : "TechHub",
      tag: ar ? "أحدث الأجهزة" : "Latest gadgets",
      icon: Laptop,
      bg: "from-slate-700 via-slate-800 to-amber-500",
    },
    {
      img: THEME_IMAGES.beauty,
      category: ar ? "تجميل" : "Beauty",
      name: ar ? "جلو" : "Glow",
      tag: ar ? "العناية والجمال" : "Skincare & beauty",
      icon: Gem,
      bg: "from-pink-300 via-rose-300 to-amber-300",
    },
    {
      img: THEME_IMAGES.furniture,
      category: ar ? "أثاث" : "Furniture",
      name: ar ? "كازا" : "Casa",
      tag: ar ? "أثاث وديكور" : "Home & living",
      icon: Sofa,
      bg: "from-stone-500 via-amber-700 to-stone-800",
    },
    {
      img: THEME_IMAGES.sports,
      category: ar ? "رياضة" : "Sports",
      name: ar ? "أوربان" : "Urban",
      tag: ar ? "أحذية ومستلزمات رياضية" : "Sneakers & sportswear",
      icon: Footprints,
      bg: "from-orange-500 via-amber-500 to-stone-800",
    },
  ];

  const smallFeatures = [
    {
      icon: ShoppingBag,
      title: ar ? "كتالوج منتجات مرن" : "Flexible product catalog",
      desc: ar
        ? "منتجات بسيطة ومتغيرات (مقاسات وألوان) — لحد 3 خصائص و100 متغير لكل منتج."
        : "Simple products and variants (size, color) — up to 3 options and 100 variants.",
    },
    {
      icon: FolderTree,
      title: ar ? "أقسام وماركات" : "Categories & brands",
      desc: ar
        ? "رتّب بضاعتك في أقسام متفرعة وماركات عشان متجرك يفضل منظم وسهل التصفح."
        : "Organize products into nested categories and brands for easy browsing.",
    },
    {
      icon: Users,
      title: ar ? "سجل العملاء" : "Customer records",
      desc: ar
        ? "تاريخ طلبات كل عميل وتفضيلاته في مكان واحد، عشان تبني علاقة تدوم."
        : "Every customer's order history and preferences in one place.",
    },
    {
      icon: Paintbrush,
      title: ar ? "مرونة في التصميم" : "Design flexibility",
      desc: ar
        ? "خصّص الشعار والألوان ورتّب أقسام الصفحة الرئيسية بالسحب والإفلات."
        : "Customize your logo and colors, and reorder homepage sections with drag & drop.",
    },
  ];

  const steps = [
    {
      icon: CreditCard,
      title: ar ? "اختار باقتك" : "Choose your plan",
      desc: ar ? "ابدأ بتجربة مجانية 7 أيام — من غير بطاقة بنكية." : "Start a 7-day free trial — no credit card required.",
    },
    {
      icon: Palette,
      title: ar ? "ظبّط شكل متجرك" : "Design your store",
      desc: ar ? "اختار ثيم، ارفع شعارك، وحدّد ألوانك في دقايق." : "Pick a theme, upload your logo, set your colors in minutes.",
    },
    {
      icon: Upload,
      title: ar ? "ارفع منتجاتك" : "Upload products",
      desc: ar ? "ضيف منتجاتك بيدك أو استوردها كلها مرة واحدة من Excel." : "Add products manually or import them in bulk from Excel.",
    },
    {
      icon: Inbox,
      title: ar ? "استقبل الطلبات" : "Receive orders",
      desc: ar ? "ابدأ البيع واستلم الطلبات وحدّث حالتها بضغطة واحدة." : "Start selling, receive orders, and update statuses in one click.",
    },
  ];

  const growth = [
    {
      icon: Ticket,
      title: ar ? "كوبونات خصم" : "Discount coupons",
      desc: ar ? "كوبونات بنسبة أو مبلغ ثابت، مع تحديد المدة وعدد الاستخدامات." : "Percentage or fixed-amount coupons with limits and expiry.",
    },
    {
      icon: Star,
      title: ar ? "نقاط الولاء" : "Loyalty points",
      desc: ar ? "عملاؤك بيكسبوا نقاط مع كل طلب ويستبدلوها بخصومات." : "Customers earn points on every order and redeem them for discounts.",
    },
    {
      icon: Gift,
      title: ar ? "اشترِ X واحصل على Y" : "Buy X get Y",
      desc: ar ? "عروض بتتطبق تلقائي في السلة من غير كوبون." : "Automatic offers applied at cart without a coupon.",
    },
    {
      icon: Mail,
      title: ar ? "حملات بريدية" : "Email campaigns",
      desc: ar ? "ابعت عروضك لعملائك وتابع مين فتح الرسالة ومين اشترى." : "Send offers to customers and track opens and purchases.",
    },
    {
      icon: Handshake,
      title: ar ? "مسوّقون بالعمولة" : "Affiliates",
      desc: ar ? "كود خصم لكل مسوّق، والنظام بيحسب مبيعاته وعمولته تلقائي." : "A code for each affiliate, with sales and commissions calculated automatically.",
    },
  ];

  const testimonials = [
    {
      name: ar ? "أحمد عبد الرحمن" : "Ahmed Abdel Rahman",
      role: ar ? "صاحب متجر النخبة · القاهرة" : "Founder, Elite Store · Cairo",
      initial: ar ? "أ" : "A",
      gradient: "from-amber-400 to-orange-500",
      text: ar
        ? "خلال أسبوع واحد طلباتي اتضاعفت. لوحة التحكم سهلة لدرجة إني بيدير المتجر كله من الموبايل وأنا في الشغل."
        : "My orders doubled in one week. The dashboard is so simple I run the entire store from my phone.",
    },
    {
      name: ar ? "سارة المصري" : "Sara El-Masry",
      role: ar ? "صاحبة متجر ليالي · إسكندرية" : "Owner, Layali · Alexandria",
      initial: ar ? "س" : "S",
      gradient: "from-rose-400 to-pink-500",
      text: ar
        ? "أحسن قرار أخدته لمتجري. ربط الدفع والشحن كان أسهل بكتير مما توقعت، والدعم بيرد عليك في نفس اليوم."
        : "Best decision I made for my store. Payments and shipping were easier than expected, and support is always there.",
    },
    {
      name: ar ? "محمد الشربيني" : "Mohamed El-Sherbiny",
      role: ar ? "صاحب تِك هَب · المنصورة" : "TechHub · Mansoura",
      initial: ar ? "م" : "M",
      gradient: "from-sky-400 to-blue-500",
      text: ar
        ? "السرعة والاستقرار ممتازين. صفحة المتجر بتفتح على طول، وتقارير المبيعات ساعدتني أفهم عملائي أكتر."
        : "Speed and stability are excellent. The storefront loads instantly, and reports help me understand customers.",
    },
  ];

  const faqs = [
    {
      q: ar ? "محتاج خبرة برمجية عشان أدير متجري؟" : "Do I need coding experience?",
      a: ar
        ? "خالص. كل خطوة بتتعمل من لوحة التحكم: اختيار التصميم، رفع المنتجات، إدارة الطلبات، وربط الدفع والشحن — من غير ما تكتب سطر كود."
        : "Not at all. Everything happens from the dashboard: design, products, orders, payments and shipping — no code required.",
    },
    {
      q: ar ? "إزاي أستلم فلوس عملائي؟" : "How do I receive customer payments?",
      a: ar
        ? "الدفع عند الاستلام متاح في كل الباقات. ومع الباقة الاحترافية تقدر تفعّل فوري وإنستاباي وفودافون كاش وبطاقات ميزة، وتستلم المبالغ مباشرة."
        : "Cash on delivery is available on all plans. With the Professional plan you can enable online payment gateways (cards and wallets) to receive funds directly.",
    },
    {
      q: ar ? "أقدر أستخدم دومين خاص بيا؟" : "Can I use my own domain?",
      a: ar
        ? "أيوه. تقدر تربط أي دومين تملكه بمتجرك، أو تستخدم لينك فرعي مجاني على beepanal.store، وإحنا بنمشي معاك في خطوات الربط كاملة."
        : "Yes. Connect any domain you own, or use a free subdomain on beepanal.store. We provide the full setup steps.",
    },
    {
      q: ar ? "في رسوم مخفية؟" : "Are there hidden fees?",
      a: ar
        ? "لأ. الأسعار واضحة ومعلنة من الأول، ومفيش أي عمولة على مبيعاتك في الباقة الاحترافية. وتقدر تلغي الاشتراك في أي وقت."
        : "No. Pricing is clear and upfront, with no commission on your sales on the Professional plan. Cancel anytime.",
    },
    {
      q: ar ? "المتجر بياخد وقت قد إيه عشان يجهز؟" : "How long does setup take?",
      a: ar
        ? "أقل من 10 دقايق في المتوسط: اعمل حسابك، اختار التصميم، ضيف أول منتج، وابعت لينك متجرك لعملائك."
        : "Under 10 minutes on average: create an account, pick a theme, add your first product, and share your link.",
    },
    {
      q: ar ? "أقدر أغيّر باقتي بعدين؟" : "Can I change my plan later?",
      a: ar
        ? "أيوه، تقدر ترقّي أو تخفّض في أي وقت من لوحة التحكم، والفرق بيتحسب تلقائي."
        : "Yes, upgrade or downgrade anytime from your dashboard; the difference is prorated automatically.",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Announcement */}
      <div className="animate-gradient relative z-50 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-medium sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>
            {ar
              ? `إطلاق Bee Panal v${VERSION} — جرّبها 7 أيام ببلاش، ومن غير بطاقة بنكية`
              : `Bee Panal v${VERSION} is live — 7-day free trial, no credit card`}
          </span>
          <Link href="/register" className="hidden items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-bold hover:bg-white/25 sm:inline-flex">
            {ar ? "ابدأ الآن" : "Start now"}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? "border-border shadow-lg shadow-black/[0.04]" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline">
              {ar ? "تسجيل الدخول" : "Login"}
            </Link>
            <Link
              href="/register"
              className="hidden items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/35 sm:inline-flex"
            >
              {ar ? "ابدأ مجانًا" : "Start free"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {/* Scroll progress */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background/95 px-4 py-4 backdrop-blur-xl lg:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold"
                >
                  {ar ? "تسجيل الدخول" : "Login"}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-center text-sm font-bold text-white"
                >
                  {ar ? "ابدأ مجانًا" : "Start free"}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden pb-16 pt-12 sm:pt-16 lg:pb-28 lg:pt-24">
          <div className="bg-grid grid-mask absolute inset-0 -z-10" />
          <div className="animate-blob absolute -top-40 -end-32 -z-10 h-[34rem] w-[34rem] rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-500/10" />
          <div
            className="animate-blob absolute -bottom-48 -start-32 -z-10 h-[30rem] w-[30rem] rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-600/10"
            style={{ animationDelay: "-8s" }}
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-start">
                <Reveal y={16}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                    <Zap className="h-3.5 w-3.5" />
                    {ar ? "منصة المتاجر الأسرع نموًا في مصر" : "The fastest-growing store platform in the region"}
                  </span>
                </Reveal>

                <Reveal delay={80}>
                  <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                    {ar ? (
                      <>
                        متجرك الأونلاين جاهز{" "}
                        <span className="animate-gradient bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                          في دقايق
                        </span>
                        <br />
                        من غير مبرمج
                      </>
                    ) : (
                      <>
                        Your online store, ready{" "}
                        <span className="animate-gradient bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                          in minutes
                        </span>
                        <br />
                        no code required
                      </>
                    )}
                  </h1>
                </Reveal>

                <Reveal delay={160}>
                  <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
                    {ar
                      ? "كل اللي محتاجه عشان تدير منتجاتك وطلباتك وعملائك من لوحة تحكم واحدة. جرّبها 7 أيام ببلاش، ومن غير بطاقة بنكية."
                      : "Everything you need to manage products, orders and customers in one beautiful dashboard. 7-day free trial, no credit card."}
                  </p>
                </Reveal>

                <Reveal delay={240}>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                    <Link
                      href="/register"
                      className="shine group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-amber-500/35 sm:w-auto"
                    >
                      {ar ? "ابدأ تجربتك ببلاش" : "Start your free trial"}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      href="/livestore"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-bold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface sm:w-auto"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary">
                        <Play className="h-3 w-3 fill-current" />
                      </span>
                      {ar ? "شاهد متجرًا تجريبيًا" : "View a live demo"}
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={320}>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted lg:justify-start">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      {ar ? "بدون بطاقة بنكية" : "No credit card"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {ar ? "إلغاء في أي وقت" : "Cancel anytime"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {ar ? "دعم 24/7" : "24/7 support"}
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={380}>
                  <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                    <div className="flex -space-x-3 rtl:space-x-reverse">
                      {trustAvatars.map((a) => (
                        <span
                          key={a.initial}
                          className={`grid h-10 w-10 place-items-center rounded-full border-2 border-background bg-gradient-to-br ${a.bg} text-xs font-bold text-white shadow-sm`}
                        >
                          {a.initial}
                        </span>
                      ))}
                    </div>
                    <div className="text-center sm:text-start">
                      <div className="flex items-center justify-center gap-1 sm:justify-start">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="ms-1 text-xs font-bold text-foreground">4.9/5</span>
                      </div>
                      <p className="text-xs text-muted">
                        {ar ? "انضم لأكتر من 2,000 تاجر مصري بيثقوا فينا" : "Join 2,000+ merchants who trust us"}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={200} x={ar ? -24 : 24} y={32} className="relative">
                <HeroMockup />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= TRUST MARQUEE ================= */}
        <section className="border-y border-border bg-surface py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted">
              {ar ? "يثق بنا روّاد الأعمال في كل محافظات مصر" : "Trusted by entrepreneurs across industries"}
            </p>
            <div className="marquee-mask marquee-paused overflow-hidden">
              <div className="animate-marquee flex w-max items-center gap-14">
                {[...BRAND_MARKS, ...BRAND_MARKS].map((brand, i) => (
                  <span
                    key={i}
                    className="select-none whitespace-nowrap text-xl font-extrabold tracking-tight text-foreground/30 transition-colors hover:text-foreground/60"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="relative -mt-2 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-amber-500/[0.07] via-card to-orange-500/[0.07] shadow-sm sm:grid-cols-4 sm:divide-x sm:divide-border">
                {stats.map((s) => (
                  <div key={s.label} className="p-6 text-center sm:p-8">
                    <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                      <Counter to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                    </div>
                    <div className="mt-1.5 text-xs font-medium text-muted sm:text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section id="features" className="scroll-mt-24 bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow={ar ? "كل المزايا" : "All features"}
                title={
                  ar ? (
                    <>
                      كل اللي محتاجه لإدارة متجرك{" "}
                      <span className="text-primary">في مكان واحد</span>
                    </>
                  ) : (
                    <>
                      Everything you need to run your store{" "}
                      <span className="text-primary">in one place</span>
                    </>
                  )
                }
                desc={
                  ar
                    ? "من أول منتج لآخر طلب — أدوات احترافية بتوفر وقتك وتزوّد مبيعاتك."
                    : "From your first product to your last order — professional tools built to save time and grow sales."
                }
              />
            </Reveal>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Big: Orders */}
              <Reveal className="md:col-span-2 lg:col-span-2">
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgba(217,119,6,0.35)] sm:p-7">
                  <div className="absolute -end-16 -top-16 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <IconBox icon={Package} />
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {ar ? "إدارة الطلبات بذكاء" : "Smart order management"}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        {ar
                          ? "تابع كل طلب من لحظة وصوله لحد التسليم، وحدّث حالته وابعت إشعار للعميل بضغطة."
                          : "Track every order from creation to delivery, update statuses, and notify customers in one click."}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      {ar ? "مباشر" : "Live"}
                    </span>
                  </div>
                  <div className="mt-5 space-y-2">
                    {[
                      { name: ar ? "أحمد عبد الرحمن" : "Ahmed Abdel Rahman", status: ar ? "مكتمل" : "Completed", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", amount: ar ? "3,200 ج.م" : "EGP 3,200", icon: Headphones, tile: "from-amber-400 to-orange-500" },
                      { name: ar ? "سارة المصري" : "Sara El-Masry", status: ar ? "قيد الشحن" : "Shipping", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400", amount: ar ? "1,850 ج.م" : "EGP 1,850", icon: Watch, tile: "from-sky-400 to-blue-500" },
                      { name: ar ? "محمد الشربيني" : "Mohamed El-Sherbiny", status: ar ? "جديد" : "New", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400", amount: ar ? "980 ج.م" : "EGP 980", icon: Footprints, tile: "from-emerald-400 to-teal-500" },
                    ].map((o, i) => (
                      <div key={o.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 transition-colors group-hover:border-primary/20">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${o.tile} text-white`}>
                          <o.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-foreground">{o.name}</div>
                          <div className="text-[10px] text-muted">#BP-10{24 + i}</div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${o.cls}`}>{o.status}</span>
                        <span className="text-xs font-bold text-foreground">{o.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Big: Reports */}
              <Reveal delay={80} className="md:col-span-2 lg:col-span-2">
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgba(217,119,6,0.35)] sm:p-7">
                  <div className="absolute -end-16 -top-16 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <IconBox icon={BarChart3} />
                  <h3 className="mt-4 text-lg font-bold text-foreground">
                    {ar ? "تقارير وتحليلات فورية" : "Instant reports & analytics"}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {ar
                      ? "اعرف أكتر منتج بيتبيع، وإيه اللي بيجيب مكسب، وإمتى البيع بيزيد — قرارات مبنية على أرقام حقيقية."
                      : "See your best sellers, profit drivers, and peak sales times — decisions backed by real numbers."}
                  </p>
                  <div className="mt-5 rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{ar ? "إجمالي المبيعات" : "Total sales"}</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                        +23%
                      </span>
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-foreground">
                      {ar ? "48,250 ج.م" : "EGP 48,250"}
                    </div>
                    <div className="mt-3 flex h-16 items-end gap-1.5">
                      {[40, 62, 45, 78, 58, 92, 70, 84].map((h, i) => (
                        <div
                          key={i}
                          className="animate-bar w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-300"
                          style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>

              {smallFeatures.map((f, i) => (
                <Reveal key={f.title} delay={120 + i * 60}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgba(217,119,6,0.35)]">
                    <div className="absolute -end-12 -top-12 h-28 w-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                    <IconBox icon={f.icon} />
                    <h3 className="mt-4 font-bold text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.desc}</p>
                  </div>
                </Reveal>
              ))}

              <Reveal delay={360}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgba(217,119,6,0.35)]">
                  <IconBox icon={FileSpreadsheet} />
                  <h3 className="mt-4 font-bold text-foreground">
                    {ar ? "استيراد وتصدير Excel" : "Excel import & export"}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {ar
                      ? "ارفع آلاف المنتجات مرة واحدة من ملف Excel، وصدّر طلباتك بسهولة."
                      : "Upload thousands of products at once from Excel, and export orders easily."}
                  </p>
                </div>
              </Reveal>

              <Reveal delay={420}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgba(217,119,6,0.35)]">
                  <IconBox icon={CreditCard} />
                  <h3 className="mt-4 font-bold text-foreground">
                    {ar ? "بوابات دفع وشحن" : "Payments & shipping"}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {ar
                      ? "الدفع عند الاستلام في كل الباقات، وفوري وإنستاباي وفودافون كاش وتكامل الشحن مع الاحترافية."
                      : "Cash on delivery on all plans, plus online payments and shipping integrations on Pro."}
                  </p>
                </div>
              </Reveal>

              <Reveal delay={480} className="md:col-span-2">
                <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-7 text-white shadow-xl shadow-amber-500/20">
                  <div className="absolute -end-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-10 -start-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
                  <Sparkles className="h-7 w-7 text-white/80" />
                  <h3 className="mt-4 text-xl font-extrabold">
                    {ar ? "كل هذا وأكثر، في متجر واحد" : "All this and more, in one store"}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                    {ar
                      ? "ابدأ النهاردة واكتشف بنفسك ليه آلاف التجار المصريين بيختاروا Bee Panal لإدارة تجارتهم."
                      : "Start today and see why thousands of merchants choose Bee Panal."}
                  </p>
                  <Link
                    href="/register"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-amber-700 shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    {ar ? "ابدأ مجانًا" : "Start free"}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= THEMES ================= */}
        <section id="themes" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow={ar ? "التصاميم" : "Themes"}
                title={
                  ar ? (
                    <>
                      تصاميم جاهزة <span className="text-primary">لكل نوع تجارة</span>
                    </>
                  ) : (
                    <>
                      Ready themes <span className="text-primary">for every business</span>
                    </>
                  )
                }
                desc={
                  ar
                    ? "اختار قالب احترافي، وخصّص الشعار والألوان في ثواني. وكل تصميم متوافق مع الموبايل بالكامل."
                    : "Pick a professional theme and customize your logo and colors in seconds. Fully mobile-ready."
                }
              />
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((s, i) => (
                <Reveal key={s.name} delay={i * 70}>
                  <Link
                    href="/livestore"
                    className={`group relative block overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${s.bg} shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10`}
                  >
                    <div className="relative h-64 w-full overflow-hidden">
                      <span className="absolute -end-12 -top-12 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
                      <span className="absolute -bottom-12 -start-12 h-40 w-40 rounded-full bg-black/15 blur-2xl" />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid h-24 w-24 place-items-center rounded-3xl border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm">
                          <s.icon className="h-11 w-11" strokeWidth={1.3} />
                        </span>
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.img}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <span className="absolute start-4 top-4 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                      {s.category}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                      <div>
                        <h3 className="text-lg font-extrabold">{s.name}</h3>
                        <p className="mt-0.5 text-xs text-white/70">{s.tag}</p>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md transition-colors group-hover:border-primary group-hover:bg-primary">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= STEPS ================= */}
        <section className="bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow={ar ? "إزاي تبدأ" : "How it works"}
                title={
                  ar ? (
                    <>
                      من التسجيل لأول طلب <span className="text-primary">في 4 خطوات</span>
                    </>
                  ) : (
                    <>
                      From signup to first order <span className="text-primary">in 4 steps</span>
                    </>
                  )
                }
                desc={ar ? "مش محتاج خبرة تقنية — اتبع الخطوات وابدأ البيع." : "No technical experience needed — just follow the steps and start selling."}
              />
            </Reveal>

            <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="absolute inset-x-24 top-11 hidden border-t border-dashed border-primary/30 lg:block" />
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 90}>
                  <div className="group relative h-full rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                    <span className="pointer-events-none absolute end-5 top-4 text-5xl font-black text-foreground/[0.04]">
                      0{i + 1}
                    </span>
                    <div className="relative grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-bold text-foreground">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= GROWTH ================= */}
        <section id="growth" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow={ar ? "أدوات النمو" : "Growth tools"}
                title={
                  ar ? (
                    <>
                      أدوات ذكية <span className="text-primary">تزيد مبيعاتك</span>
                    </>
                  ) : (
                    <>
                      Smart tools <span className="text-primary">that grow sales</span>
                    </>
                  )
                }
                desc={ar ? "ارفع متوسط قيمة الطلب واكسب ولاء عملائك — كل ده من لوحة تحكم واحدة." : "Increase average order value and build loyalty — all from one dashboard."}
              />
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {growth.map((g, i) => (
                <Reveal key={g.title} delay={i * 70}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgba(217,119,6,0.35)]">
                    <div className="absolute -end-12 -top-12 h-28 w-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                    <IconBox icon={g.icon} />
                    <h3 className="mt-4 font-bold text-foreground">{g.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{g.desc}</p>
                  </div>
                </Reveal>
              ))}

              <Reveal delay={350}>
                <div className="relative h-full overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-amber-500/10 via-card to-orange-500/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute -end-10 -bottom-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-amber-500/25">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">{ar ? "وأكثر من ذلك بكثير" : "And much more"}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {ar
                      ? "اكتشف كل أدوات التسويق والنمو أول ما تعمل حسابك — ببلاش لمدة 7 أيام."
                      : "Discover every marketing and growth tool when you sign up — free for 7 days."}
                  </p>
                  <Link href="/register" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                    {ar ? "جرّبها الآن" : "Try it now"}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS ================= */}
        <section className="relative overflow-hidden bg-surface py-20 sm:py-24">
          <div className="bg-grid grid-mask absolute inset-0 opacity-50" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow={ar ? "قصص نجاح" : "Success stories"}
                title={
                  ar ? (
                    <>
                      تجّار يحققون النمو <span className="text-primary">مع Bee Panal</span>
                    </>
                  ) : (
                    <>
                      Merchants growing <span className="text-primary">with Bee Panal</span>
                    </>
                  )
                }
                desc={ar ? "أكتر من 2,000 متجر بيبيع كل يوم عبر المنصة. دي بعض تجاربهم." : "Over 2,000 stores sell every day on the platform. Here are some of their stories."}
              />
            </Reveal>

            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 90}>
                  <figure className="relative h-full overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <Quote className="absolute end-5 top-5 h-10 w-10 text-primary/10" />
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <blockquote className="mt-4 text-sm leading-relaxed text-muted">“{t.text}”</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                      <span className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white ring-2 ring-primary/20`}>
                        {t.initial}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted">{t.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= PRICING ================= */}
        <section id="pricing" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow={ar ? "الأسعار" : "Pricing"}
                title={
                  ar ? (
                    <>
                      أسعار واضحة، <span className="text-primary">بدون مفاجآت</span>
                    </>
                  ) : (
                    <>
                      Clear pricing, <span className="text-primary">no surprises</span>
                    </>
                  )
                }
                desc={ar ? "ابدأ بتجربة 7 أيام ببلاش — من غير بطاقة بنكية، ومن غير رسوم إعداد." : "Start with a 7-day free trial — no credit card, no setup fees."}
              />
            </Reveal>

            <Reveal>
              <div className="mb-10 flex justify-center">
                <div className="inline-flex items-center rounded-xl border border-border bg-surface p-1">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                      billing === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {ar ? "شهري" : "Monthly"}
                  </button>
                  <button
                    onClick={() => setBilling("yearly")}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                      billing === "yearly" ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {ar ? "سنوي" : "Yearly"}
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      -20%
                    </span>
                  </button>
                </div>
              </div>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic */}
              <Reveal delay={60}>
                <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-8">
                  <div className="text-sm font-bold text-muted">{ar ? "الباقة الأساسية" : "Basic plan"}</div>
                  <div className="mt-3 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold text-foreground">{ar ? "2 ج.م" : "EGP 2"}</span>
                    <span className="pb-1.5 text-sm text-muted">{ar ? "/ لكل طلب" : "/ per order"}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {ar ? "ادفع بس لما تبيع — من غير اشتراك شهري." : "Pay only when you sell — no monthly subscription."}
                  </p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {(ar
                      ? ["منتجات وطلبات من غير حدود", "زيارات من غير حدود", "لينك دفع إلكتروني مباشر", "متجرك شغال 24 ساعة", "دعم سريع على مدار اليوم"]
                      : ["Unlimited products and orders", "Unlimited visits", "Direct payment link", "Your store stays open always", "24/7 fast support"]
                    ).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="mt-8 block rounded-xl border-2 border-primary/30 px-6 py-3 text-center text-sm font-bold text-primary transition-all hover:border-primary hover:bg-primary/5"
                  >
                    {ar ? "اشترك الآن" : "Subscribe now"}
                  </Link>
                </div>
              </Reveal>

              {/* Pro */}
              <Reveal delay={140}>
                <div className="relative flex h-full flex-col rounded-3xl border-2 border-primary bg-card p-7 shadow-2xl shadow-amber-500/15 transition-all duration-300 hover:-translate-y-1 sm:p-8">
                  <div className="absolute -top-3.5 start-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-bold text-white shadow-md rtl:translate-x-1/2">
                    <Sparkles className="h-3.5 w-3.5" />
                    {ar ? "الأكثر شعبية" : "Most popular"}
                  </div>
                  <div className="text-sm font-bold text-primary">{ar ? "الباقة الاحترافية" : "Professional plan"}</div>
                  <div className="mt-3 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold text-foreground">
                      {billing === "monthly" ? "1,499" : "1,199"} {ar ? "ج.م" : "EGP"}
                    </span>
                    <span className="pb-1.5 text-sm text-muted">{ar ? "/ شهريًا" : "/ month"}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {billing === "monthly"
                      ? ar ? "من غير عمولة على مبيعاتك — كل الأرباح ليك." : "No commission on sales — keep every profit."
                      : ar ? "بتتدفع سنويًا — وفّر 20% عن الدفع الشهري." : "Billed yearly — save 20% vs monthly."}
                  </p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {(ar
                      ? ["كل مزايا الباقة الأساسية", "فوري وإنستاباي وفودافون كاش", "تكامل مع شركات الشحن", "استيراد وتصدير Excel", "كوبونات ونقاط ولاء", "دعم بأولوية"]
                      : ["Everything in Basic", "Online payments", "Shipping integrations", "Excel import/export", "Coupons & loyalty points", "Priority support"]
                    ).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="shine mt-8 block rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/35"
                  >
                    {ar ? "ابدأ تجربتك ببلاش" : "Start your free trial"}
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <p className="mt-8 text-center text-xs text-muted">
                {ar
                  ? "كل الباقات فيها تجربة 7 أيام ببلاش · من غير رسوم إعداد · وإلغاء في أي وقت"
                  : "All plans include a 7-day free trial · No setup fees · Cancel anytime"}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section id="faq" className="scroll-mt-24 bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow={ar ? "الأسئلة الشائعة" : "FAQ"}
                title={ar ? "عندك سؤال؟ عندنا الجواب" : "Got questions? We have answers"}
                desc={ar ? "أكتر الأسئلة اللي بتوصلنا من التجار الجدد." : "The questions new merchants ask us most."}
              />
            </Reveal>

            <Reveal>
              <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                {faqs.map((f, i) => (
                  <div key={f.q}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start transition-colors hover:bg-surface"
                      aria-expanded={openFaq === i}
                    >
                      <span className="text-sm font-bold text-foreground sm:text-base">{f.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-muted transition-transform duration-300 ${
                          openFaq === i ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-6 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="relative overflow-hidden py-20 sm:py-24">
          <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600" />
          <div className="dot-pattern absolute inset-0 opacity-30" />
          <div className="animate-blob absolute -top-24 end-10 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl" />
          <div className="animate-float-slow absolute -bottom-20 start-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                {ar ? "ابدأ النهاردة — ببلاش لمدة 7 أيام" : "Start today — free for 7 days"}
              </span>
              <h2 className="mt-6 text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                {ar ? "جاهز تفتح متجرك؟" : "Ready to open your store?"}
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/85">
                {ar
                  ? "انضم لآلاف التجار اللي بيبيعوا أونلاين كل يوم عبر Bee Panal. الإعداد مش بياخد أكتر من 10 دقايق."
                  : "Join thousands of merchants selling online every day with Bee Panal. Setup takes under 10 minutes."}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-extrabold text-amber-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
                >
                  {ar ? "ابدأ تجربتك ببلاش" : "Start your free trial"}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/20 sm:w-auto"
                >
                  {ar ? "تسجيل الدخول" : "Login"}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative overflow-hidden bg-zinc-950 text-zinc-400">
        <div className="dot-pattern absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo size="md" light />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
                {ar
                  ? "منصة متكاملة تخليك تطلق متجرك الأونلاين وتديره بسهولة — من غير مبرمج ولا سيرفر."
                  : "An all-in-one platform to launch and manage your online store — no developer, no server."}
              </p>
              <div className="mt-5 flex items-center gap-2">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
                <a
                  href="mailto:hello@beepanal.store"
                  aria-label="Email"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{ar ? "المنصة" : "Platform"}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { href: "#features", label: ar ? "المزايا" : "Features" },
                  { href: "#themes", label: ar ? "التصاميم" : "Themes" },
                  { href: "#growth", label: ar ? "أدوات النمو" : "Growth tools" },
                  { href: "#pricing", label: ar ? "الأسعار" : "Pricing" },
                  { href: "#faq", label: ar ? "الأسئلة" : "FAQ" },
                ].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{ar ? "الحساب" : "Account"}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/register" className="transition-colors hover:text-white">{ar ? "إنشاء حساب" : "Create account"}</Link></li>
                <li><Link href="/login" className="transition-colors hover:text-white">{ar ? "تسجيل الدخول" : "Login"}</Link></li>
                <li><Link href="/dashboard" className="transition-colors hover:text-white">{ar ? "لوحة التحكم" : "Dashboard"}</Link></li>
                <li><Link href="/livestore" className="transition-colors hover:text-white">{ar ? "متجر تجريبي" : "Demo store"}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{ar ? "تواصل معنا" : "Contact us"}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:hello@beepanal.store" className="transition-colors hover:text-white">hello@beepanal.store</a>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden>🇪🇬</span>
                  {ar ? "القاهرة، مصر" : "Cairo, Egypt"}
                </li>
              </ul>
              <div className="mt-5">
                <div className="text-xs font-semibold text-zinc-500">{ar ? "طرق الدفع" : "Payments"}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PAYMENTS.map((p) => (
                    <span key={p} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-zinc-400">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row">
            <span>
              © 2026 Bee Panal. {ar ? "كل الحقوق محفوظة." : "All rights reserved."}
            </span>
            <span className="flex items-center gap-3">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[10px] text-zinc-400">
                v{VERSION}
              </span>
              <span>{ar ? "صُنع بـ ❤️ في مصر" : "Made with ❤️ in Egypt"}</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
