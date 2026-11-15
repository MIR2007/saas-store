"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Palette, Store, Eye, ArrowRight } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

const THEMES = [
  { id: "modern", name: "حديث", desc: "ثيم عصري نظيف يناسب جميع المجالات", color: "#d97706" },
  { id: "fashion", name: "أزياء وموضة", desc: "ثيم أنيق خاص بالملابس والإكسسوارات", color: "#be185d" },
  { id: "electronics", name: "إلكترونيات", desc: "ثيم تقني للأجهزة والهواتف", color: "#0ea5e9" },
  { id: "food", name: "مأكولات ومطاعم", desc: "ثيم مفتوح وجذاب للمطاعم والمأكولات", color: "#dc2626" },
  { id: "beauty", name: "عطور وتجميل", desc: "ثيم ناعم للالعطور والمستحضرات", color: "#7c3aed" },
  { id: "furniture", name: "أثاث وديكور", desc: "ثيم دافئ للأثاث المنزلي", color: "#b45309" },
  { id: "sports", name: "رياضة ولياقة", desc: "ثيم نشيط للمعدات الرياضية", color: "#059669" },
  { id: "kids", name: "أطفال ورضع", desc: "ثيم ملون ومرح لمنتجات الأطفال", color: "#f59e0b" },
] as const;

export default function DesignPage() {
  const params = useParams();
  const router = useRouter();
  const { storeId } = params as { storeId: string };

  const [store, setStore] = useState<any>(null);
  const [updated, setUpdated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.store) setStore(data.store);
      });
  }, [storeId]);

  if (!store) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          themeColor: formData.get("themeColor") as string,
          theme: formData.get("theme") as string,
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      setUpdated(true);
      setTimeout(() => setUpdated(false), 2000);
    } catch {
      // error handled by UI
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel={store.name}
        eyebrow="تصميم المتجر"
        title="شكل متجرك على الإنترنت"
        subtitle="اختار الثيم المناسب لنشاطك، وضبط لون ورمز المتجر."
        icon={<Palette className="h-6 w-6" />}
      />

      {updated && (
        <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          تم حفظ التصميم بنجاح ✅
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-12">
        {/* Basic info */}
        <div className="lg:col-span-4 space-y-4">
          <section className={`${cardClass} p-5`}>
            <h2 className="mb-4 font-extrabold text-foreground">بيانات المتجر</h2>
            <div className="space-y-3">
              <label className={labelClass}>اسم المتجر</label>
              <input
                defaultValue={store.name}
                name="name"
                required
                className={inputClass}
              />
              <label className={labelClass}>الوصف المختصر</label>
              <textarea
                defaultValue={store.description}
                name="description"
                rows={3}
                className={inputClass}
              />
            </div>
          </section>
        </div>

        {/* Color picker */}
        <div className="lg:col-span-4 space-y-4">
          <section className={`${cardClass} p-5`}>
            <h2 className="mb-4 font-extrabold text-foreground">اللون الأساسي</h2>
            <div className="space-y-3">
              <label className={labelClass}>لون العلامة التجارية</label>
              <input
                type="color"
                defaultValue={store.themeColor}
                name="themeColor"
                className="w-full h-10 rounded-xl border-0 bg-transparent cursor-pointer"
              />
            </div>
          </section>
        </div>

        {/* Themes grid */}
        <div className="lg:col-span-4 space-y-4">
          <section className={`${cardClass} p-5`}>
            <h2 className="mb-4 font-extrabold text-foreground">اختر الثيم</h2>
            <div className="space-y-2">
              {THEMES.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                    store.theme === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={t.id}
                    defaultChecked={store.theme === t.id}
                    className="h-4 w-4 shrink-0 text-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{t.name}</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Preview */}
        <div className="lg:col-span-12">
          <section className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-foreground">معاينة واجهة المتجر</h2>
              <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                افتح المتجر <ArrowRight className="h-3 w-3" />
              </a>
            </div>
            <div className={`rounded-2xl border p-6 bg-surface text-center min-h-[320px] flex flex-col items-center justify-center gap-4 border-border`}>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                {store.name.charAt(0)}
              </div>
              <h3 className="text-xl font-extrabold text-foreground">{store.name}</h3>
              <p className="text-sm text-muted max-w-md mx-auto">
                {store.description || "وصف المتجر يظهر هنا."}
              </p>
              <div className="mt-4 flex gap-2">
                <button className={primaryBtn} disabled>
                  اطلب الآن
                </button>
                <button className={secondaryBtn} disabled>
                  تصفح المنتجات
                </button>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
