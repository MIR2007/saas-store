export type Locale = "ar" | "en";

export const LOCALES: Locale[] = ["ar", "en"];

export const dictionaries = {
  ar: {
    brand: "Bee Panal",
    tagline: "منصة المتاجر الإلكترونية المصرية",
    nav: { features: "المزايا", pricing: "الأسعار", showcase: "شوف المنصة", faq: "الأسئلة", login: "تسجيل دخول", signup: "ابدأ مجانًا" },
    hero: {
      badge: "منصة المتاجر #1 في مصر",
      title: "اعمل متجرك الأونلاين بنفسك في",
      highlight: "أقل من 10 دقايق",
      desc: "كل اللي محتاجه عشان تدير متجرك — منتجات، طلبات، شحن، دفع، وتسويق — بضغطة واحدة، ومن غير أي خبرة برمجية.",
      cta1: "ابدأ متجرك دلوقتي",
      cta2: "شوف الديمو",
      stats: { stores: "متجر مسجل", orders: "طلب يوميًا", countries: "محافظات" },
    },
    showcase: { title: "متجرك على مزاجك", desc: "ثيمات جاهزة وتقدر تعدّلها بالكامل", store: "واجهة المتجر (للعملاء)", storeDesc: "منتجات، سلة، ودفع — سريعة ومتجاوبة.", dash: "لوحة التحكم (لصاحب المتجر)", dashDesc: "منتجات، طلبات، وإحصائيات — كل حاجة بضغطة." },
    features: { title: "كل اللي محتاجه لإدارة متجرك", desc: "منصة متكاملة ونظام ذكي" },
    pricing: { title: "الأسعار", desc: "من غير خبرة برمجية ومن غير مبرمج", plan1: "الباقة الأساسية", plan2: "الباقة الاحترافية", popular: "الأكثر شعبية", subscribe: "اشترك دلوقتي", perOrder: "2 ج.م لكل طلب", perMonth: "شهريًا — بدون عمولة" },
    faq: { title: "الأسئلة الشائعة" },
    footer: { rights: "© 2026 Bee Panal — كل الحقوق محفوظة" },
    auth: { login: "تسجيل الدخول", register: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", name: "الاسم", submit: "دخول", submitReg: "إنشاء حساب", noAccount: "لسه معندكش حساب؟", hasAccount: "عندك حساب بالفعل؟", signupFree: "سجّل مجانًا", welcome: "نوّرت تاني 👋", start: "ابدأ متجرك في أقل من 10 دقايق" },
    dash: { overview: "نظرة عامة", stores: "متاجري", newStore: "+ متجر جديد", products: "المنتجات", orders: "الطلبات", settings: "الإعدادات", logout: "تسجيل خروج", noStores: "لسه مفيش متاجر." },
    common: { save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", loading: "بنحمّل...", error: "خطأ", success: "تم بنجاح" },
    version: "الإصدار",
  },
  en: {
    brand: "Bee Panal",
    tagline: "E-commerce Store Platform",
    nav: { features: "Features", pricing: "Pricing", showcase: "Showcase", faq: "FAQ", login: "Login", signup: "Start Free" },
    hero: {
      badge: "#1 E-commerce Platform",
      title: "Build your online store yourself in",
      highlight: "less than 10 minutes",
      desc: "Everything you need to manage your store — products, orders, shipping, payments, marketing — in one click, no coding required.",
      cta1: "Create Your Store Now",
      cta2: "See Demo",
      stats: { stores: "Stores registered", orders: "Orders daily", countries: "Countries" },
    },
    showcase: { title: "Your store, your way", desc: "Ready themes, fully customizable", store: "Storefront (for customers)", storeDesc: "Products, cart, checkout — fast and responsive.", dash: "Dashboard (for owner)", dashDesc: "Products, orders, analytics — everything in one click." },
    features: { title: "Everything you need to manage your store", desc: "Integrated platform, smart system" },
    pricing: { title: "Pricing", desc: "No coding or developer needed", plan1: "Standard Plan", plan2: "Professional Plan", popular: "Most Popular", subscribe: "Subscribe Now", perOrder: "2 EGP per order", perMonth: "monthly — no commission" },
    faq: { title: "Frequently Asked Questions" },
    footer: { rights: "Copyright © 2026 Bee Panal" },
    auth: { login: "Login", register: "Create Account", email: "Email", password: "Password", name: "Name", submit: "Sign In", submitReg: "Create Account", noAccount: "Don't have an account?", hasAccount: "Already have an account?", signupFree: "Sign up free", welcome: "Welcome back", start: "Start your store in less than 10 minutes" },
    dash: { overview: "Overview", stores: "My Stores", newStore: "+ New Store", products: "Products", orders: "Orders", settings: "Settings", logout: "Logout", noStores: "No stores yet." },
    common: { save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", loading: "Loading...", error: "Error", success: "Success" },
    version: "Version",
  },
} as const;

export function getDict(locale: Locale) {
  return dictionaries[locale];
}

export function isLocale(v: string): v is Locale {
  return v === "ar" || v === "en";
}
