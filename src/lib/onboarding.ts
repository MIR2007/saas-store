import {
  DEFAULT_SHIPPING_RATES,
  defaultShippingRates,
  parseShippingRates,
} from "@/lib/shipping";
import { DEFAULT_STORE_COLOR, DEFAULT_STORE_THEME } from "@/lib/themes";

export type OnboardingFlags = {
  shipping?: boolean;
  design?: boolean;
  share?: boolean;
  hidden?: boolean;
};

export type OnboardingStore = {
  phone: string;
  theme: string;
  themeColor: string;
  logo: string;
  themeConfig: string;
  onboarding: string;
  freeShippingThreshold: number;
  shippingRates: string;
};

export type OnboardingStepId =
  | "product"
  | "whatsapp"
  | "shipping"
  | "design"
  | "order"
  | "share";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  action: string;
  href: string;
  external: boolean;
  done: boolean;
};

export function parseOnboarding(raw?: string | null): OnboardingFlags {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const source = parsed as Record<string, unknown>;
    const flags: OnboardingFlags = {};
    if (source.shipping === true) flags.shipping = true;
    if (source.design === true) flags.design = true;
    if (source.share === true) flags.share = true;
    if (source.hidden === true) flags.hidden = true;
    return flags;
  } catch {
    return {};
  }
}

export function serializeOnboarding(flags: OnboardingFlags) {
  return JSON.stringify(flags);
}

/** True when the merchant changed the default governorate rates. */
function hasCustomShipping(store: OnboardingStore) {
  if (store.freeShippingThreshold > 0) return true;
  const rates = parseShippingRates(store.shippingRates);
  const defaults = defaultShippingRates();
  const keys = Object.keys(rates);
  if (keys.length !== Object.keys(defaults).length) return true;
  return keys.some((key) => {
    const fallback = defaults[key] ?? DEFAULT_SHIPPING_RATES[key] ?? 0;
    return rates[key] !== fallback;
  });
}

/** True when the merchant changed the theme, color, logo, or theme config. */
function hasCustomDesign(store: OnboardingStore) {
  if ((store.logo || "").trim()) return true;
  if (store.theme !== DEFAULT_STORE_THEME) return true;
  if ((store.themeColor || "").trim().toLowerCase() !== DEFAULT_STORE_COLOR.toLowerCase()) {
    return true;
  }
  const config = (store.themeConfig || "").trim();
  return config !== "" && config !== "{}";
}

export function buildOnboardingSteps({
  store,
  productCount,
  orderCount,
  storeUrl,
}: {
  store: OnboardingStore;
  productCount: number;
  orderCount: number;
  storeUrl: string;
}): OnboardingStep[] {
  const flags = parseOnboarding(store.onboarding);

  return [
    {
      id: "product",
      title: "أضف أول منتج",
      description: "منتج واحد كفاية عشان المتجر يبدأ يستقبل طلبات.",
      action: "إضافة منتج",
      href: "/products/new",
      external: false,
      done: productCount > 0,
    },
    {
      id: "whatsapp",
      title: "ضيف رقم واتساب المتجر",
      description: "خلي العميل يقدر يتواصل معاك بضغطة من صفحة المتجر.",
      action: "ضيف الرقم",
      href: "/settings",
      external: false,
      done: (store.phone || "").trim().length > 0,
    },
    {
      id: "shipping",
      title: "راجع إعدادات الشحن",
      description: "حدد سعر التوصيل لكل محافظة، أو سيب الافتراضي لو مناسب.",
      action: "إعدادات الشحن",
      href: "/settings",
      external: false,
      done: flags.shipping === true || hasCustomShipping(store),
    },
    {
      id: "design",
      title: "خصص شكل المتجر",
      description: "اختار ثيم ولون ولوجو يعبروا عن براندك.",
      action: "تعديل التصميم",
      href: "/design",
      external: false,
      done: flags.design === true || hasCustomDesign(store),
    },
    {
      id: "order",
      title: "جرّب أول طلب",
      description: "اعمل طلب تجريبي من المتجر وتأكد إن الشحن والدفع شغالين.",
      action: "افتح المتجر",
      href: storeUrl,
      external: true,
      done: orderCount > 0,
    },
    {
      id: "share",
      title: "شارك متجرك",
      description: "ابعت رابط المتجر لعملائك على واتساب أو السوشيال ميديا.",
      action: "شارك الرابط",
      href: "",
      external: false,
      done: flags.share === true,
    },
  ];
}

export function onboardingProgress(steps: OnboardingStep[]) {
  const done = steps.filter((step) => step.done).length;
  return {
    done,
    total: steps.length,
    percent: steps.length ? Math.round((done / steps.length) * 100) : 0,
  };
}
