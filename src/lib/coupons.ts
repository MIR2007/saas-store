export type CouponLike = {
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: Date | null;
};

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateCoupon(coupon: CouponLike | null, subtotal: number) {
  if (!coupon) {
    return { ok: false as const, error: "كود الخصم غير صحيح." };
  }
  if (!coupon.active) {
    return { ok: false as const, error: "كود الخصم غير مفعّل حاليًا." };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "كود الخصم منتهي." };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { ok: false as const, error: "كود الخصم وصل للحد الأقصى للاستخدام." };
  }
  if (coupon.minSubtotal > 0 && subtotal < coupon.minSubtotal) {
    return { ok: false as const, error: "قيمة الطلب أقل من الحد الأدنى لتفعيل الكود." };
  }

  const raw = coupon.type === "percent" ? subtotal * (coupon.value / 100) : coupon.value;
  const discount = Math.round(Math.min(subtotal, Math.max(0, raw)) * 100) / 100;
  return { ok: true as const, discount };
}

export function couponTypeLabel(type: string) {
  return type === "percent" ? "نسبة مئوية" : "مبلغ ثابت";
}
