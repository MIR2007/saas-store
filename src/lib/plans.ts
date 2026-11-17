export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: "monthly",
    label: "شهري",
    amount: 1500,
    perMonth: 1500,
    months: 1,
    note: "دفعة واحدة كل شهر",
  },
  yearly: {
    id: "yearly",
    label: "سنوي",
    amount: 9000,
    perMonth: 750,
    months: 12,
    note: "وفّر 25% — بتدفع 9000 جنيه للسنة",
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

export const PAYMENT_NUMBER = "01005419148";

export const PAYMENT_METHODS = [
  {
    id: "instapay",
    name: "إنستاباي",
    desc: "حوّل من تطبيق بنكك على الرقم ده",
  },
  {
    id: "vodafone",
    name: "فودافون كاش",
    desc: "حوّل من محفظتك على نفس الرقم",
  },
] as const;
