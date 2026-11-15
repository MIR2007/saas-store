"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Package, Plus, Tags, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { currencySymbol, formatMoney } from "@/lib/format";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export default function NewProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/stores/${storeId}/categories`).then((r) => r.json()),
      fetch(`/api/stores/${storeId}`).then((r) => r.json()),
    ]).then(([cats, storeData]) => {
      setCategories(cats.categories || []);
      if (storeData.store?.currency) setCurrency(storeData.store.currency);
    });
  }, [storeId]);

  async function addCategory() {
    if (!newCat.trim()) return;
    const res = await fetch(`/api/stores/${storeId}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((c) => [...c, data.category]);
      setCategoryId(data.category.id);
      setNewCat("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          comparePrice: comparePrice ? Number(comparePrice) : null,
          stock: Number(stock),
          categoryId: categoryId || null,
          images: imageUrl ? [imageUrl] : [],
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نضيف المنتج");
        return;
      }
      router.push(`/dashboard/stores/${storeId}/products`);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}/products`}
        backLabel="المنتجات"
        eyebrow="منتج جديد"
        title="ضيف منتج للكتالوج"
        subtitle="اكتب تفاصيل المنتج والسعر والمخزون، واختار صورة تليق بيه."
        icon={<Package className="h-6 w-6" />}
      />

      <form onSubmit={handleSubmit} className="grid max-w-5xl gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <section className={`${cardClass} p-6`}>
            <h2 className="mb-5 font-extrabold text-foreground">تفاصيل المنتج</h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>اسم المنتج</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="مثال: تيشيرت قطن أوفر سايز"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>الوصف</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="اكتب تفاصيل المنتج، المقاسات، الخامة…"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className={`${cardClass} p-6`}>
            <div className="mb-5 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="font-extrabold text-foreground">السعر والمخزون</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>السعر ({currencySymbol(currency)})</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  سعر قبل الخصم <span className="font-normal text-muted">(اختياري)</span>
                </label>
                <input
                  type="number"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>المخزون</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                  className={inputClass}
                />
                <p className="mt-1.5 text-[11px] text-muted">لو خلص المخزون، المنتج هيظهر «نفذ» ومش هيتضاف للسلة.</p>
              </div>
            </div>
          </section>

          <section className={`${cardClass} p-6`}>
            <div className="mb-5 flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              <h2 className="font-extrabold text-foreground">التصنيف</h2>
            </div>
            <label className={labelClass}>تصنيف المنتج</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">بدون تصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="mt-3 flex gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="تصنيف جديد…"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addCategory}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                إضافة
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <section className={`${cardClass} p-6`}>
            <div className="mb-4 flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-primary" />
              <h2 className="font-extrabold text-foreground">صورة المنتج</h2>
            </div>
            <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-surface">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="معاينة المنتج" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-muted">
                  <ImagePlus className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-xs">معاينة الصورة هتظهر هنا</p>
                </div>
              )}
            </div>
            <label className={`${labelClass} mt-4`}>رابط الصورة</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
              dir="ltr"
            />
            <p className="mt-1.5 text-[11px] text-muted">حدد رابط صورة مباشر (jpg / png / webp).</p>
          </section>

          <section className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-foreground">ظاهر في المتجر</h2>
                <p className="mt-1 text-[11px] text-muted">لو قفلته، المنتج هيتخزن بس مش هيظهر للعملاء.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive((v) => !v)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  active ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
                    active ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </section>

          {price && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
              <p className="text-[11px] font-bold text-primary">معاينة السعر</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-foreground">{formatMoney(Number(price), currency)}</span>
                {comparePrice && Number(comparePrice) > Number(price) && (
                  <span className="text-sm text-muted line-through">{formatMoney(Number(comparePrice), currency)}</span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
              {loading ? "بنحفظ المنتج..." : "حفظ المنتج"}
            </button>
            <Link href={`/dashboard/stores/${storeId}/products`} className={`${secondaryBtn} w-full`}>
              إلغاء
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
