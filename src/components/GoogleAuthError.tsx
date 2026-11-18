"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

const MESSAGES: Record<string, string> = {
  google_not_configured:
    "الدخول بجوجل مش متاح حاليًا. جرّب التسجيل بالبريد أو تواصل مع الدعم.",
  google_cancelled: "تم إلغاء تسجيل الدخول بجوجل.",
  google_state: "انتهت صلاحية محاولة الدخول. جرّب تاني.",
  google_failed: "تعذّر إكمال الدخول بجوجل. جرّب تاني.",
  google_email: "حساب جوجل ده مفيهوش بريد إلكتروني موثّق.",
  google_no_account: "مفيش حساب مرتبط بالبريد ده. سجّل حساب جديد بجوجل من صفحة التسجيل.",
};

export default function GoogleAuthError() {
  const params = useSearchParams();
  const key = params.get("error");
  if (!key) return null;

  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs font-semibold leading-relaxed text-rose-700 dark:text-rose-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {MESSAGES[key] || "تعذّر إكمال الدخول بجوجل. جرّب تاني."}
        {key === "google_no_account" && (
          <Link href="/register" className="ms-1 underline decoration-dotted underline-offset-4">
            سجّل من هنا
          </Link>
        )}
      </span>
    </div>
  );
}
