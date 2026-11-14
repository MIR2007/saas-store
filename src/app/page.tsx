import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">E</span>
            <span className="font-bold text-xl text-foreground">ايزي اوردر</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
            <a href="#features" className="hover:text-foreground">المميزات</a>
            <a href="#pricing" className="hover:text-foreground">الأسعار</a>
            <a href="#themes" className="hover:text-foreground">الثيمات</a>
            <a href="#faq" className="hover:text-foreground">الأسئلة الشائعة</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-foreground">تسجيل دخول</Link>
            <Link href="/register" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition">
              اشترك مجاناً الآن
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
              أنشئ متجرك الإلكتروني بنفسك في أقل من 10 دقايق، بدون خبرة برمجية.
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              كل ما تحتاجه لإدارة متجرك .. بضغطة واحدة فقط. منصة متكاملة لإنشاء المتاجر، إدارة الطلبات، الشحن، الدفع، والتسويق.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-dark transition">
                انشئ متجرك في أقل من 10 دقايق
              </Link>
              <a href="#features" className="border border-border text-foreground font-medium px-6 py-3 rounded-lg hover:bg-surface transition">
                اكتشف المميزات
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">200,000+</div>
                <div className="text-sm text-muted">متجر مسجل</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">300,000+</div>
                <div className="text-sm text-muted">طلب يومياً</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">10</div>
                <div className="text-sm text-muted">دول</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 border border-border">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold">M</span>
                  <div>
                    <div className="font-bold">متجرك</div>
                    <div className="text-xs text-muted">my-store.easyorder.app</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="border border-border rounded-xl p-3">
                      <div className="aspect-square bg-surface rounded-lg mb-2" />
                      <div className="text-sm font-medium">منتج {i}</div>
                      <div className="text-sm text-primary font-bold">15,000 د.ع</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">كل ما تحتاجه لإدارة متجرك</h2>
            <p className="mt-3 text-muted">بنظام ذكي وسهل الاستخدام</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "بناء سريع وسهل", desc: "لا تحتاج كود. Drag & Drop لتصميم متجرك." },
              { title: "نظام ذكي للطلبات", desc: "إدارة الطلبات والشحن بضغطة زر." },
              { title: "صفحات هبوط جاهزة", desc: "صفحات هبوط احترافية تزيد مبيعاتك." },
              { title: "+15 بوابات دفع", desc: "ربط مباشر مع أكثر من 15 بوابة دفع." },
              { title: "طلبات غير محدودة", desc: "عدد غير محدود من المنتجات والطلبات." },
              { title: "حاجب الطلبات الوهمية", desc: "فلترة الطلبات الوهمية تلقائياً." },
              { title: "Easy AI", desc: "صمّم صفحات بالذكاء الاصطناعي في ثواني." },
              { title: "Conversion API", desc: "تتبع التحويلات بدقة." },
              { title: "خاصية الداون سيل", desc: "زيادة متوسط قيمة الطلب." },
            ].map((f, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">الأسعار</h2>
            <p className="mt-3 text-muted">بدون خبرة برمجية أو الاستعانة بمطوّر</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-border rounded-2xl p-8">
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
            <div className="border-2 border-primary rounded-2xl p-8 relative">
              <div className="absolute -top-3 right-6 bg-primary text-white text-xs px-3 py-1 rounded-full">الأكثر شعبية</div>
              <div className="text-sm text-muted mb-2">الباقة الاحترافية</div>
              <div className="text-3xl font-bold text-foreground">$100</div>
              <div className="text-sm text-muted mb-6">شهرياً - بدون عمولة</div>
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

      {/* Themes */}
      <section id="themes" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">ثيمات جاهزة وقابلة للتعديل</h2>
            <p className="mt-3 text-muted">ابدأ متجرك بسهولة مع ثيمات جاهزة</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {["مستحضرات تجميل", "إلكترونيات", "ملابس وأزياء", "طعام ومشروبات"].map((t, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5" />
                <div className="p-4">
                  <div className="font-medium text-foreground">{t}</div>
                  <div className="text-xs text-muted mt-1">مجاني</div>
                </div>
              </div>
            ))}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="font-bold text-xl mb-2">ايزي اوردر</div>
          <p className="text-sm text-white/60">Copyright © EasyOrders | 2026</p>
        </div>
      </footer>
    </div>
  );
}