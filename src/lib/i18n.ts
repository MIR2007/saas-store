export type Locale = "ar" | "en";

export const LOCALES: Locale[] = ["ar", "en"];

export const dictionaries = {
  ar: {
    brand: "Bee Panal",
    tagline: "منصة إنشاء المتاجر الإلكترونية",
    nav: { features: "المميزات", pricing: "الأسعار", showcase: "عرض", faq: "الأسئلة", login: "تسجيل دخول", signup: "ابدأ مجاناً" },
    hero: {
      badge: "منصة المتاجر الإلكترونية #1",
      title: "أنشئ متجرك الإلكتروني بنفسك في",
      highlight: "أقل من 10 دقايق",
      desc: "كل ما تحتاجه لإدارة متجرك — منتجات، طلبات، شحن، دفع، تسويق — بضغطة واحدة، بدون خبرة برمجية.",
      cta1: "انشئ متجرك الآن",
      cta2: "شاهد العرض",
      stats: { stores: "متجر مسجل", orders: "طلب يومياً", countries: "دول" },
    },
    showcase: { title: "متجرك، بطريقتك", desc: "ثيمات جاهزة، قابلة للتعديل بالكامل", store: "واجهة المتجر (للعملاء)", storeDesc: "عرض منتجات، سلة، دفع — سريعة ومتجاوبة.", dash: "لوحة التحكم (للمالك)", dashDesc: "منتجات، طلبات، إحصائيات — كل شيء بضغطة." },
    features: { title: "كل ما تحتاجه لإ管理 متجرك", desc: "منصة متكاملة، نظام ذكي" },
    pricing: { title: "الأسعار", desc: "بدون خبرة برمجية أو الاستعانة بمطوّر", plan1: "الباقة العادية", plan2: "الباقة الاحترافية", popular: "الأكثر شعبية", subscribe: "اشترك الآن", perOrder: "4 سنت لكل طلب", perMonth: "شهرياً — بدون عمولة" },
    faq: { title: "الأسئلة الشائعة" },
    footer: { rights: "Copyright © Bee Panal" },
    auth: { login: "تسجيل دخول", register: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", name: "الاسم", submit: "دخول", submitReg: "إنشاء حساب", noAccount: "ليس لديك حساب؟", hasAccount: "لديك حساب بالفعل؟", signupFree: "اشترك مجاناً", welcome: "مرحباً بعودتك", start: "ابدأ متجرك في أقل من 10 دقايق" },
    dash: { overview: "نظرة عامة", stores: "متاجري", newStore: "+ متجر جديد", products: "المنتجات", orders: "الطلبات", settings: "الإعدادات", logout: "تسجيل خروج", noStores: "لا توجد متاجر بعد." },
    common: { save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", loading: "جاري التحميل...", error: "خطأ", success: "تم بنجاح" },
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
    pricing: { title: "Pricing", desc: "No coding or developer needed", plan1: "Standard Plan", plan2: "Professional Plan", popular: "Most Popular", subscribe: "Subscribe Now", perOrder: "4 cents per order", perMonth: "monthly — no commission" },
    faq: { title: "Frequently Asked Questions" },
    footer: { rights: "Copyright © Bee Panal" },
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