import Link from "next/link";

const HERO_IMG = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80&auto=format&fit=crop";
const STORE_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop";
const DASH_IMG = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">B</span>
            <span className="font-bold text-xl text-foreground">Bee Panal</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
            <a href="#features" className="hover:text-foreground transition">المميزات</a>
            <a href="#pricing" className="hover:text-foreground transition">الأسعار</a>
            <a href="#showcase" className="hover:text-foreground transition">عرض</a>
            <a href="#faq" className="hover:text-foreground transition">الأسئلة</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-foreground">تسجيل دخول</Link>
            <Link href="/register" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition shadow-sm">
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
              منصة المتاجر الإلكترونية #1
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
              أنشئ متجرك الإلكتروني بنفسك في <span className="text-primary">أقل من 10 دقايق</span>
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              كل ما تحتاجه لإدارة متجرك — منتجات، طلبات، شحن، دفع، تسويق — بضغطة واحدة، بدون خبرة برمجية.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="bg-primary text-white font-medium px-7 py-3.5 rounded-lg hover:bg-primary-dark transition shadow-md">
                انشئ متجرك الآن
              </Link>
              <a href="#showcase" className="border border-border text-foreground font-medium px-7 py-3.5 rounded-lg hover:bg-surface transition">
                شاهد العرض
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { n: "200,000+", l: "متجر مسجل" },
                { n: "300,000+", l: "طلب يومياً" },
                { n: "10", l: "دول" },
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
              <div className="font-bold text-foreground">+23% مبيعات</div>
              <div className="text-xs text-muted">عبر AI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">متجرك، بطريقتك</h2>
            <p className="mt-3 text-muted">ثيمات جاهزة، قابلة للتعديل بالكامل</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={STORE_IMG} alt="متجر" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="font-bold text-foreground mb-1">واجهة المتجر (للعملاء)</h3>
                <p className="text-sm text-muted">عرض منتجات، سلة، دفع — سريعة ومتجاوبة.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DASH_IMG} alt="لوحة تحكم" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="font-bold text-foreground mb-1">لوحة التحكم (للمالك)</h3>
                <p className="text-sm text-muted">منتجات، طلبات، إحصائيات — كل شيء بضغطة.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">كل ما تحتاجه لإدارة متجرك</h2>
            <p className="mt-3 text-muted">منصة متكاملة، نظام ذكي</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: "بناء سريع (Drag & Drop)", d: "لا تحتاج كود. صمّم متجرك بحرية كاملة." },
              { t: "نظام ذكي للطلبات", d: "إدارة الطلبات والشحن بضغطة زر." },
              { t: "صفحات هبوط جاهزة", d: "صفحات هبوط احترافية تزيد مبيعاتك." },
              { t: "+15 بوابات دفع", d: "ربط مباشر مع أكثر من 15 بوابة دفع." },
              { t: "طلبات غير محدودة", d: "عدد غير محدود من المنتجات والطلبات." },
              { t: "حاجب الطلبات الوهمية", d: "فلترة الطلبات الوهمية تلقائياً." },
              { t: "Bee AI", d: "صمّم صفحات بالذكاء الاصطناعي في ثواني." },
              { t: "Conversion API", d: "تتبع التحويلات بدقة." },
              { t: "داون سيل / كروس سيل", d: "زيادة متوسط قيمة الطلب." },
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

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">الأسعار</h2>
            <p className="mt-3 text-muted">بدون خبرة برمجية أو الاستعانة بمطوّر</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-border rounded-2xl p-8">
              <div className="text-sm text-muted mb-2">الباقة العادية</div>
              <div className="text-3xl font-bold text-foreground">$0.04</div>
              <div className="text-sm text-muted mb-6">4 سنت لكل طلب</div>
              <ul className="space-y-3 text-sm text-muted mb-8">
                <li>✓ عدد غير محدود من المنتجات</li>
                <li>✓ عدد غير محدود من الطلبات</li>
                <li>✓ زيارات غير محدودة</li>
                <li>✓ رابط مباشر للدفع الإلكتروني</li>
                <li>✓ متجرك يظل مفتوحًا</li>
                <li>✓ دعم سريع على مدار الساعة</li>
              </ul>
              <Link href="/register" className="block text-center border border-primary text-primary font-medium px-6 py-3 rounded-lg hover:bg-primary/5 transition">
                اشترك الآن
              </Link>
            </div>
            <div className="bg-white border-2 border-primary rounded-2xl p-8 relative shadow-lg">
              <div className="absolute -top-3 right-6 bg-primary text-white text-xs px-3 py-1 rounded-full">الأكثر شعبية</div>
              <div className="text-sm text-muted mb-2">الباقة الاحترافية</div>
              <div className="text-3xl font-bold text-foreground">$100</div>
              <div className="text-sm text-muted mb-6">شهرياً — بدون عمولة</div>
              <ul className="space-y-3 text-sm text-muted mb-8">
                <li>✓ عدد غير محدود من الطلبات بدون عمولة</li>
                <li>✓ عدد غير محدود من المنتجات</li>
                <li>✓ زيارات غير محدودة</li>
                <li>✓ رابط مباشر للدفع الإلكتروني</li>
                <li>✓ متجرك يظل مفتوحًا</li>
                <li>✓ دعم سريع على مدار الساعة</li>
              </ul>
              <Link href="/register" className="block text-center bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-dark transition">
                اشترك الآن
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">الأسئلة الشائعة</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "ما وسائل الدفع التي تدعمونها؟", a: "نحن ندعم جميع وسائل الدفع الرئيسية بما في ذلك بطاقات الائتمان والمحافظ الإلكترونية والدفع عند الاستلام." },
              { q: "هل هناك مصاريف خفية؟", a: "لا، نحن نؤمن بالشفافية الكاملة. جميع التكاليف واضحة ومعلنة مسبقاً دون أي رسوم خفية." },
              { q: "هل أحتاج دومين؟", a: "نحن لا نوفر دومين لك ولكن يمكنك شراء أي دومين وربطه بمتجرك بكل سهولة." },
              { q: "هل يمكنني البيع في أي دولة؟", a: "نعم، يمكنك البيع في أي دولة. منصتنا تدعم البيع الدولي مع خيارات شحن متعددة." },
              { q: "هل يوجد دعم بالعربية؟", a: "نعم، فريق الدعم لدينا متاح باللغة العربية على مدار الساعة." },
            ].map((f, i) => (
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

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">B</span>
              <span className="font-bold">Bee Panal</span>
            </div>
            <p className="text-sm text-white/60">Copyright © Bee Panal | 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}