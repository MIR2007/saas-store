"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import { VERSION } from "@/lib/version";

const STORES = [
  { name: "أزياء", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80&auto=format&fit=crop", url: "#" },
  { name: "عطور", img: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80&auto=format&fit=crop", url: "#" },
  { name: "إلكترونيات", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80&auto=format&fit=crop", url: "#" },
  { name: "تجميل", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&auto=format&fit=crop", url: "#" },
  { name: "أثاث", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop", url: "#" },
  { name: "أطفال", img: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80&auto=format&fit=crop", url: "#" },
];

const FEATURES = [
  { icon: "📦", t: "إدارة الطلبات", d: "تابع كل طلب من لحظة إنشائه حتى التسليم، وغيّر حالته وأرسل إشعار للزبون." },
  { icon: "📊", t: "تقارير مبيعات", d: "اعرف أكثر منتج يُباع، وما يحقق أرباح، ومتى يزيد البيع." },
  { icon: "🛍️", t: "كتالوج منتجات مرن", d: "منتجات بسيطة ومتغيرات (مقاسات/ألوان) — حتى 3 خصائص و100 متغير." },
  { icon: "🗂️", t: "أقسام وماركات", d: "رتّب بضاعتك في أقسام متفرعة وماركات لسهولة العثور." },
  { icon: "👥", t: "سجل العملاء", d: "تاريخ طلبات كل عميل وتقييماته في مكان واحد." },
  { icon: "🎨", t: "مرونة في التصميم", d: "رتّب أقسام صفحتك الرئيسية بالسحب والإفلات." },
  { icon: "📥", t: "استيراد/تصدير Excel", d: "ارفع آلاف المنتجات دفعة واحدة من ملف Excel." },
  { icon: "💳", t: "بوابات دفع وشحن", d: "الدفع عند الاستلام في كل الباقات، والدفع أونلاين مع باقة احترافية." },
];

const GROWTH = [
  { icon: "🏷️", t: "كوبونات خصم", d: "اعمل كوبونات بنسبة أو بمبلغ ثابت، وحدّد مدتها وعدد مرات استخدامها." },
  { icon: "⭐", t: "نقاط الولاء", d: "الزبون يكسب نقاط مع كل طلب ويستبدلها خصم في طلبه الجاي." },
  { icon: "🎁", t: "اشترِ X واحصل على Y", d: "عروض تتطبّق في السلة أوتوماتيك من غير كوبون." },
  { icon: "📧", t: "حملات إيميل", d: "ابعت عروضك لعملائك المسجلين، وشوف مين فتح ومين اشترى." },
  { icon: "🤝", t: "مسوّقين بالعمولة", d: "ادّي كل مسوّق كود خصم باسمه، والنظام بيحسب مبيعات كل واحد." },
];

export default function Home() {
  const { t, locale } = useLang();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-foreground transition-colors">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-6 text-sm text-muted">
            <a href="#features" className="hover:text-foreground transition">{t.nav.features}</a>
            <a href="#themes" className="hover:text-foreground transition">{locale === "ar" ? "التصاميم" : "Themes"}</a>
            <a href="#growth" className="hover:text-foreground transition">{locale === "ar" ? "أدوات النمو" : "Growth"}</a>
            <a href="#pricing" className="hover:text-foreground transition">{t.nav.pricing}</a>
            <a href="#faq" className="hover:text-foreground transition">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="text-sm text-muted hover:text-foreground hidden sm:inline">{t.nav.login}</Link>
            <Link href="/register" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition shadow-sm">
              {locale === "ar" ? "ابدأ تجربتك المجانية" : "Start Free Trial"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
              {locale === "ar" ? "منصة متاجر إلكترونية" : "E-commerce Platform"}
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-foreground">
              {locale === "ar" ? "منصة متكاملة لإنشاء وإدارة متجرك الإلكتروني" : "All-in-one platform to create & manage your online store"}
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              {locale === "ar"
                ? "7 أيام تجربة مجانية كاملة، بكل إمكانيات متجرك، بدون شحن رصيد أو أي مصاريف مخفية. من غير مبرمج ومن غير سيرفر."
                : "7 days full free trial with all store features, no credit card, no hidden fees. No developer, no server needed."}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link href="/register" className="bg-primary text-white font-medium px-7 py-3.5 rounded-lg hover:bg-primary-dark transition shadow-md">
                {locale === "ar" ? "ابدأ تجربتك المجانية" : "Start Free Trial"}
              </Link>
            </div>
          </div>
          {/* Store mockup grid */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {STORES.map((s, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden border border-border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-lg transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.name} className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="py-20 bg-surface dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{locale === "ar" ? "طوّر أداء تجارتك الإلكترونية" : "Boost your e-commerce performance"}</h2>
            <p className="mt-3 text-muted">{locale === "ar" ? "كل اللي تحتاجه لإدارة البيع أونلاين في مكان واحد" : "Everything you need to manage online sales in one place"}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white dark:bg-zinc-800 border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{f.t}</h3>
                <p className="text-sm text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payments & shipping */}
      <section className="py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-sm font-semibold text-muted mb-6">{locale === "ar" ? "طرق الدفع" : "Payment methods"}</h3>
          <div className="flex flex-wrap justify-center items-center gap-6 mb-10 opacity-80">
            {["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay"].map((p) => (
              <span key={p} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted bg-surface">{p}</span>
            ))}
          </div>
          <h3 className="text-center text-sm font-semibold text-muted mb-6">{locale === "ar" ? "شركات الشحن" : "Shipping carriers"}</h3>
          <div className="flex flex-wrap justify-center items-center gap-6 opacity-80">
            {["DHL", "FedEx", "Aramex", "SMSA", "Zajil"].map((c) => (
              <span key={c} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted bg-surface">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Themes showcase */}
      <section id="themes" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{locale === "ar" ? "تصاميم تفهم طبيعة تجارتك" : "Themes that fit your business"}</h2>
            <p className="mt-3 text-muted">{locale === "ar" ? "كل تصميم جاهز بصفحاته وسلته وإتمام طلبه" : "Each theme comes with pages, cart, and checkout ready"}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {STORES.map((s, i) => (
              <a key={i} href={s.url} className="group block bg-white dark:bg-zinc-900 border border-border rounded-2xl overflow-hidden hover:shadow-lg transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.name} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
                <div className="p-4 flex items-center justify-between">
                  <span className="font-semibold text-foreground">{s.name}</span>
                  <span className="text-xs text-primary">{locale === "ar" ? "فتح المتجر ←" : "Open store →"}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 4 steps */}
      <section className="py-20 bg-surface dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{locale === "ar" ? "من الاشتراك للبيع في أربع خطوات" : "From signup to selling in 4 steps"}</h2>
            <p className="mt-3 text-muted">{locale === "ar" ? "مش محتاج خبرة تقنية" : "No technical experience needed"}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(locale === "ar"
              ? [
                  { n: "1", t: "اختار باقتك", d: "قارن الباقات واشترك باللي يناسب حجم متجرك." },
                  { n: "2", t: "ظبّط شكل متجرك", d: "اختار ثيم، ارفع شعارك، وحدّد ألوانك." },
                  { n: "3", t: "ارفع بضاعتك", d: "أضف المنتجات أو استوردها من Excel." },
                  { n: "4", t: "استقبل الطلبات", d: "الزبون يدفع عند الاستلام أو أونلاين." },
                ]
              : [
                  { n: "1", t: "Choose your plan", d: "Compare plans and subscribe to fit your store size." },
                  { n: "2", t: "Design your store", d: "Pick a theme, upload logo, set colors." },
                  { n: "3", t: "Upload products", d: "Add products or import from Excel." },
                  { n: "4", t: "Receive orders", d: "Customer pays COD or online." },
                ]
            ).map((s, i) => (
              <div key={i} className="bg-white dark:bg-zinc-800 border border-border rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">{s.n}</div>
                <h3 className="font-bold text-foreground mb-2">{s.t}</h3>
                <p className="text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth tools */}
      <section id="growth" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{locale === "ar" ? "أدوات ذكية لزيادة مبيعاتك" : "Smart tools to grow your sales"}</h2>
            <p className="mt-3 text-muted">{locale === "ar" ? "ارفع أرباحك اليومية وضمن ولاء عملائك" : "Boost daily profits and customer loyalty"}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GROWTH.map((g, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 hover:shadow-md transition">
                <div className="text-3xl mb-3">{g.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{g.t}</h3>
                <p className="text-sm text-muted">{g.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sales page */}
      <section className="py-20 bg-surface dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">{locale === "ar" ? "من الإعلان للطلب، في صفحة واحدة" : "From ad to order, on one page"}</h2>
          <p className="text-muted mb-10">{locale === "ar" ? "اعمل صفحة لمنتج واحد وحط رابطها في إعلانك" : "Create a single-product page and link it in your ad"}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(locale === "ar"
              ? ["اعمل الصفحة", "إعلانك على فيسبوك", "الزبون يطلب", "الطلب يوصلك"]
              : ["Create page", "Your Facebook ad", "Customer orders", "Order arrives"]
            ).map((s, i) => (
              <div key={i} className="bg-white dark:bg-zinc-800 border border-border rounded-2xl p-5">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-3 mx-auto">{i + 1}</div>
                <p className="text-sm font-medium text-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">{t.pricing.title}</h2>
            <p className="mt-3 text-muted">{t.pricing.desc}</p>
          </div>
          <div className="flex justify-center mb-10">
            <div className="inline-flex border border-border rounded-lg p-1 bg-surface">
              <button onClick={() => setBilling("monthly")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billing === "monthly" ? "bg-primary text-white" : "text-muted"}`}>
                {locale === "ar" ? "شهري" : "Monthly"}
              </button>
              <button onClick={() => setBilling("yearly")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billing === "yearly" ? "bg-primary text-white" : "text-muted"}`}>
                {locale === "ar" ? "سنوي" : "Yearly"} <span className="text-xs opacity-80">(-20%)</span>
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-8">
              <div className="text-sm text-muted mb-2">{t.pricing.plan1}</div>
              <div className="text-3xl font-bold text-foreground">$0.04</div>
              <div className="text-sm text-muted mb-6">{t.pricing.perOrder}</div>
              <ul className="space-y-3 text-sm text-muted mb-8">
                <li>✓ {locale === "ar" ? "عدد غير محدود من المنتجات" : "Unlimited products"}</li>
                <li>✓ {locale === "ar" ? "عدد غير محدود من الطلبات" : "Unlimited orders"}</li>
                <li>✓ {locale === "ar" ? "زيارات غير محدودة" : "Unlimited visits"}</li>
                <li>✓ {locale === "ar" ? "رابط مباشر للدفع الإلكتروني" : "Direct payment link"}</li>
                <li>✓ {locale === "ar" ? "متجرك يظل مفتوحًا" : "Store stays open"}</li>
                <li>✓ {locale === "ar" ? "دعم سريع على مدار الساعة" : "24/7 fast support"}</li>
              </ul>
              <Link href="/register" className="block text-center border border-primary text-primary font-medium px-6 py-3 rounded-lg hover:bg-primary/5 transition">
                {t.pricing.subscribe}
              </Link>
            </div>
            <div className="bg-white dark:bg-zinc-900 border-2 border-primary rounded-2xl p-8 relative shadow-lg">
              <div className="absolute -top-3 right-6 bg-primary text-white text-xs px-3 py-1 rounded-full">{t.pricing.popular}</div>
              <div className="text-sm text-muted mb-2">{t.pricing.plan2}</div>
              <div className="text-3xl font-bold text-foreground">$100</div>
              <div className="text-sm text-muted mb-6">{t.pricing.perMonth}</div>
              <ul className="space-y-3 text-sm text-muted mb-8">
                <li>✓ {locale === "ar" ? "عدد غير محدود من الطلبات بدون عمولة" : "Unlimited orders, no commission"}</li>
                <li>✓ {locale === "ar" ? "عدد غير محدود من المنتجات" : "Unlimited products"}</li>
                <li>✓ {locale === "ar" ? "زيارات غير محدودة" : "Unlimited visits"}</li>
                <li>✓ {locale === "ar" ? "رابط مباشر للدفع الإلكتروني" : "Direct payment link"}</li>
                <li>✓ {locale === "ar" ? "متجرك يظل مفتوحًا" : "Store stays open"}</li>
                <li>✓ {locale === "ar" ? "دعم سريع على مدار الساعة" : "24/7 fast support"}</li>
              </ul>
              <Link href="/register" className="block text-center bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-dark transition">
                {t.pricing.subscribe}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{t.faq.title}</h2>
          </div>
          <div className="space-y-4">
            {(locale === "ar"
              ? [
                  { q: "محتاج خبرة برمجة علشان أشغّل متجري؟", a: "لا، كل خطوة تتعمل من لوحة التحكم بدون أي خبرة تقنية." },
                  { q: "متجري هيبقى على أنهي رابط؟", a: "على رابط yourstore.beepanal.store أو على دومينك الخاص." },
                  { q: "إيه طرق الدفع المتاحة لعملائي؟", a: "الدفع عند الاستلام في كل الباقات، والدفع أونلاين مع باقة احترافية." },
                  { q: "الشحن بيتحسب إزاي؟", a: "ربط مع شركات شحن، التكلفة تُحسب حسب Zone والوزن." },
                  { q: "أقدر أرفع كل منتجاتي مرة واحدة؟", a: "نعم، استيراد من Excel متاح من باقة احترافي." },
                  { q: "أقدر أغيّر باقتي بعدين؟", a: "نعم، تقدر تترقّى في أي وقت." },
                ]
              : [
                  { q: "Do I need coding experience?", a: "No, every step is done from the dashboard without technical experience." },
                  { q: "What URL will my store have?", a: "yourstore.beepanal.store or your own custom domain." },
                  { q: "What payment methods are available?", a: "COD in all plans, online payments with Professional plan." },
                  { q: "How is shipping calculated?", a: "Integrated with shipping companies, cost by zone and weight." },
                  { q: "Can I upload all products at once?", a: "Yes, Excel import available from Professional plan." },
                  { q: "Can I change my plan later?", a: "Yes, you can upgrade anytime." },
                ]
            ).map((f, i) => (
              <details key={i} className="border border-border rounded-xl p-5 group">
                <summary className="font-medium text-foreground cursor-pointer list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-muted group-open:rotate-180 transition">▾</span>
                </summary>
                <p className="mt-3 text-sm text-muted leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{locale === "ar" ? "جاهز تبدأ؟" : "Ready to start?"}</h2>
          <p className="text-white/80 mb-8">{locale === "ar" ? "افتح متجرك على Bee Panal" : "Open your store on Bee Panal"}</p>
          <Link href="/register" className="inline-block bg-white text-primary font-bold px-8 py-3.5 rounded-lg hover:bg-amber-50 transition shadow-md">
            {locale === "ar" ? "ابدأ تجربتك المجانية" : "Start Free Trial"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" />
              <p className="text-sm text-white/60 mt-3">{locale === "ar" ? "منصة متكاملة تتيح لك إطلاق متجرك وإدارته." : "All-in-one platform to launch and manage your store."}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{locale === "ar" ? "المنصة" : "Platform"}</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#features" className="hover:text-white">{t.nav.features}</a></li>
                <li><a href="#pricing" className="hover:text-white">{t.nav.pricing}</a></li>
                <li><a href="#faq" className="hover:text-white">{t.nav.faq}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{locale === "ar" ? "السياسات" : "Policies"}</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white">{locale === "ar" ? "شروط الخدمة" : "Terms of Service"}</a></li>
                <li><a href="#" className="hover:text-white">{locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{locale === "ar" ? "اللغة" : "Language"}</h4>
              <LanguageToggle />
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-white/50">
            <span>© 2026 Bee Panal. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}</span>
            <span>v{VERSION}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}