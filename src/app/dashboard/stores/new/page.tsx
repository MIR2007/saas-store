"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Globe, Sparkles, Store } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export default function NewStorePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugTouched) {
      setSlug(
        v
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 40)
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!slug.trim()) {
      setError("اكتب رابط المتجر بالإنجليزي (مثال: my-store).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حصلت مشكلة في إنشاء المتجر");
        return;
      }
      router.push(`/dashboard/stores/${data.store.id}`);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  const initial = name.trim().charAt(0) || "B";

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref="/dashboard/stores"
        backLabel="كل المتاجر"
        eyebrow="متجر جديد"
        title="ابدأ متجرك الجديد"
        subtitle="اختار اسم ولينك، وإحنا جاهزين نطلع متجرك أونلاين في دقايق."
        icon={<Store className="h-6 w-6" />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className={`${cardClass} p-6 lg:col-span-3`}>
          <div className="space-y-5">
            <div>
              <label htmlFor="store-name" className={labelClass}>
                اسم المتجر
              </label>
              <input
                id="store-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="مثال: نور ستور"
                required
                className={inputClass}
              />
              <p className="mt-1.5 text-[11px] text-muted">ده الاسم اللي هيظهر لعملائك في المتجر.</p>
            </div>

            <div>
              <label htmlFor="store-slug" className={labelClass}>
                رابط المتجر
              </label>
              <div className="flex items-center overflow-hidden rounded-xl border border-border bg-card shadow-sm focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
                <span className="shrink-0 border-e border-border bg-surface px-3 py-2.5 text-xs font-semibold text-muted" dir="ltr">
                  beepanal.store/
                </span>
                <input
                  id="store-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  placeholder="my-store"
                  required
                  pattern="[a-z0-9-]+"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/60"
                  dir="ltr"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                حروف إنجليزية صغيرة وأرقام وشرطة بس — مينفعش يتغير بعد كده.
              </p>
            </div>

            <div>
              <label htmlFor="store-desc" className={labelClass}>
                وصف المتجر <span className="font-normal text-muted">(اختياري)</span>
              </label>
              <textarea
                id="store-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="اكتب سطرين عن متجرك — بتبيع إيه ومميزاتك إيه؟"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "بنجهّز متجرك..." : "إنشاء المتجر"}
                {!loading && <ArrowUpRight className="h-4 w-4" />}
              </button>
              <Link href="/dashboard/stores" className={secondaryBtn}>
                إلغاء
              </Link>
            </div>
          </div>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative h-28 overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600">
              <span className="absolute -end-8 -top-10 h-28 w-28 rounded-full bg-white/15" />
              <span className="absolute -bottom-10 start-12 h-24 w-24 rounded-full bg-black/10 blur-md" />
              <span className="absolute bottom-4 start-4 grid h-12 w-12 place-items-center rounded-xl border border-white/25 bg-white/15 text-lg font-extrabold text-white backdrop-blur-md">
                {initial}
              </span>
            </div>
            <div className="p-5">
              <h3 className="truncate text-base font-extrabold text-foreground">{name || "اسم المتجر"}</h3>
              <p className="mt-0.5 truncate text-[11px] text-muted" dir="ltr">
                beepanal.store/{slug || "my-store"}
              </p>
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                {description || "وصف المتجر هيظهر هنا لعملائك."}
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-[11px] font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                معاينة شكل متجرك
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Globe className="h-4 w-4 text-primary" />
              جاهز من أول لحظة
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                متجرك بيشتغل فورًا على لينك beepanal.store
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                العملة الافتراضية الجنيه المصري (ج.م)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                تقدر تغيّر اللون والعملة من الإعدادات في أي وقت
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
