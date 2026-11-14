"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";
import Logo from "@/components/Logo";
import { VERSION } from "@/lib/version";

const HERO_IMG = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80&auto=format&fit=crop";
const STORE_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop";
const DASH_IMG = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop";

export default function Home() {
  const { t, locale } = useLang();
  const f = t.features;
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
            <a href="#features" className="hover:text-foreground transition">{t.nav.features}</a>
            <a href="#pricing" className="hover:text-foreground transition">{t.nav.pricing}</a>
            <a href="#showcase" className="hover:text-foreground transition">{t.nav.showcase}</a>
            <a href="#faq" className="hover:text-foreground transition">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/login" className="text-sm text-muted hover:text-foreground">{t.nav.login}</Link>
            <Link href="/register" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition shadow-sm">
              {t.nav.signup}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
              {t.hero.badge}
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
              {t.hero.title} <span className="text-primary">{t.hero.highlight}</span>
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">{t.hero.desc}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="bg-primary text-white font-medium px-7 py-3.5 rounded-lg hover:bg-primary-dark transition shadow-md">
                {t.hero.cta1}
              </Link>
              <a href="#showcase" className="border border-border text-foreground font-medium px-7 py-3.5 rounded-lg hover:bg-surface transition">
                {t.hero.cta2}
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { n: "200,000+", l: t.hero.stats.stores },
                { n: "300,000+", l: t.hero.stats.orders },
                { n: "10", l: t.hero.stats.countries },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-bold text-foreground">{s.n}</div>
                  <div className="text-sm text-muted">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERO_IMG} alt="Bee Panal Dashboard" className="w-full h-auto" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white border border-border rounded-xl shadow-lg p-3 text-sm">
              <div className="font-bold text-foreground">+23% {t.hero.stats.stores === "متجر مسجل" ? "مبيعات" : "Sales"}</div>
              <div className="text-xs text-muted">via AI</div>
            </div>
          </div>
        </div>
      </section>

      <section id="showcase" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{t.showcase.title}</h2>
            <p className="mt-3 text-muted">{t.showcase.desc}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={STORE_IMG} alt="store" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="font-bold text-foreground mb-1">{t.showcase.store}</h3>
                <p className="text-sm text-muted">{t.showcase.storeDesc}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DASH_IMG} alt="dashboard" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="font-bold text-foreground mb-1">{t.showcase.dash}</h3>
                <p className="text-sm text-muted">{t.showcase.dashDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{t.features.title}</h2>
            <p className="mt-3 text-muted">{t.features.desc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: locale === "ar" ? "بناء سريع (Drag & Drop)" : "Fast Builder (Drag & Drop)", d: locale === "ar" ? "لا تحتاج كود. صمّم متجرك بحرية كاملة." : "No code needed. Design your store freely." },
              { t: locale === "ar" ? "نظام ذكي للطلبات" : "Smart Order System", d: locale === "ar" ? "إدارة الطلبات والشحن بضغطة زر." : "Manage orders and shipping in one click." },
              { t: locale === "ar" ? "صفحات هبوط جاهزة" : "Ready Landing Pages", d: locale === "ar" ? "صفحات هبوط احترافية تزيد مبيعاتك." : "Professional landing pages that boost sales." },
              { t: locale === "ar" ? "+15 بوابات دفع" : "+15 Payment Gateways", d: locale === "ar" ? "ربط مباشر مع أكثر من 15 بوابة دفع." : "Direct integration with 15+ payment gateways." },
              { t: locale === "ar" ? "طلبات غير محدودة" : "Unlimited Orders", d: locale === "ar" ? "عدد غير محدود من المنتجات والطلبات." : "Unlimited products and orders." },
              { t: locale === "ar" ? "حاجب الطلبات الوهمية" : "Fake Order Blocker", d: locale === "ar" ? "فلترة الطلبات الوهمية تلقائياً." : "Filter fake orders automatically." },
              { t: locale === "ar" ? "Bee AI" : "Bee AI", d: locale === "ar" ? "صمّم صفحات بالذكاء الاصطناعي في ثواني." : "Design pages with AI in seconds." },
              { t: locale === "ar" ? "Conversion API" : "Conversion API", d: locale === "ar" ? "تتبع التحويلات بدقة." : "Track conversions accurately." },
              { t: locale === "ar" ? "داون سيل / كروس سيل" : "Down-sell / Cross-sell", d: locale === "ar" ? "زيادة متوسط قيمة الطلب." : "Increase average order value." },
            ].map((f, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.t}</h3>
                <p className="text-sm text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{t.pricing.title}</h2>
            <p className="mt-3 text-muted">{t.pricing.desc}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-border rounded-2xl p-8">
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
            <div className="bg-white border-2 border-primary rounded-2xl p-8 relative shadow-lg">
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

      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">{t.faq.title}</h2>
          </div>
          <div className="space-y-4">
            {(locale === "ar"
              ? [
                  { q: "ما وسائل الدفع التي تدعمونها؟", a: "نحن ندعم جميع وسائل الدفع الرئيسية بما في ذلك بطاقات الائتمان والمحافظ الإلكترونية والدفع عند الاستلام." },
                  { q: "هل هناك مصاريف خفية؟", a: "لا، نحن نؤمن بالشفافية الكاملة. جميع التكاليف واضحة ومعلنة مسبقاً دون أي رسوم خفية." },
                  { q: "هل أحتاج دومين؟", a: "نحن لا نوفر دومين لك ولكن يمكنك شراء أي دومين وربطه بمتجرك بكل سهولة." },
                  { q: "هل يمكنني البيع في أي دولة؟", a: "نعم، يمكنك البيع في أي دولة. منصتنا تدعم البيع الدولي مع خيارات شحن متعددة." },
                  { q: "هل يوجد دعم بالعربية؟", a: "نعم، فريق الدعم لدينا متاح باللغة العربية على مدار الساعة." },
                ]
              : [
                  { q: "What payment methods do you support?", a: "We support all major payment methods including credit cards, e-wallets, and cash on delivery." },
                  { q: "Are there hidden fees?", a: "No, we believe in full transparency. All costs are clear and announced in advance with no hidden fees." },
                  { q: "Do I need a domain?", a: "We don't provide a domain, but you can buy any domain and connect it to your store easily." },
                  { q: "Can I sell in any country?", a: "Yes, you can sell in any country. Our platform supports international sales with multiple shipping options." },
                  { q: "Is Arabic support available?", a: "Yes, our support team is available in Arabic 24/7." },
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

      <footer className="bg-foreground text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <p className="text-sm text-white/60">{t.footer.rights} | {t.version} {VERSION}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}