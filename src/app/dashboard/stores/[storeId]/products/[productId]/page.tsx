"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Layers, Package, Pencil, Tags, Wallet } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import ProductOptionsEditor, { type ProductOption } from "@/components/dashboard/ProductOptionsEditor";
import { currencySymbol, formatMoney } from "@/lib/format";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export default function EditProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const productId = params.productId as string;
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
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [shippingPrice, setShippingPrice] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "فشل في رفع الصورة");
        return;
      }
      setImageUrl(data.url);
      e.target.value = "";
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/stores/${storeId}/categories`).then((r) => r.json()),
      fetch(`/api/stores/${storeId}/products/${productId}`).then((r) => r.json()),
      fetch(`/api/stores/${storeId}`).then((r) => r.json()),
    ]).then(([cats, prod, storeData]) => {
      setCategories(cats.categories || []);
      if (storeData.store?.currency) setCurrency(storeData.store.currency);
      const p = prod.product;
      if (p) {
        setName(p.name);
        setDescription(p.description || "");
        setPrice(String(p.price));
        setComparePrice(p.comparePrice ? String(p.comparePrice) : "");
        setStock(String(p.stock));
        setCategoryId(p.categoryId || "");
        try {
          const imgs = JSON.parse(p.images || "[]");
          setImageUrl(imgs[0] || "");
        } catch {
          setImageUrl("");
        }
        try {
          const parsedOptions = JSON.parse(p.options || "[]");
          setOptions(Array.isArray(parsedOptions) ? parsedOptions : []);
        } catch {
          setOptions([]);
        }
        setShippingPrice(p.shippingPrice ? String(p.shippingPrice) : "");
        setActive(p.active);
      }
      setLoaded(true);
    });
  }, [storeId, productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          comparePrice: comparePrice ? Number(comparePrice) : null,
          stock: Number(stock),
          categoryId: categoryId || null,
          images: imageUrl ? [imageUrl] : [],
          options: JSON.stringify(
            options
              .map((option) => ({
                ...option,
                name: option.name.trim(),
                values: option.values.filter((value) => value.label.trim() || value.image),
              }))
              .filter((option) => option.name && option.values.length)
          ),
          shippingPrice: shippingPrice ? Number(shippingPrice) : 0,
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نحدّث المنتج");
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

  if (!loaded) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}/products`}
        backLabel="المنتجات"
        eyebrow="تعديل منتج"
        title={name || "تعديل المنتج"}
        subtitle="حدّث التفاصيل والسعر والمخزون في أي وقت."
        icon={<Pencil className="h-6 w-6" />}
      />

      <form onSubmit={handleSubmit} className="grid max-w-5xl gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <section className={`${cardClass} p-6`}>
            <div className="mb-5 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-extrabold text-foreground">تفاصيل المنتج</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>اسم المنتج</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>الوصف</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
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
              </div>
              <div>
                <label className={labelClass}>
                  سعر الشحن <span className="font-normal text-muted">(اختياري)</span>
                </label>
                <input
                  type="number"
                  value={shippingPrice}
                  onChange={(e) => setShippingPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className={inputClass}
                />
                <p className="mt-1.5 text-[11px] text-muted">بيتضاف لسعر الشحن الإجمالي في صفحة الشراء.</p>
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
          </section>

          <section className={`${cardClass} p-6`}>
            <div className="mb-5 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-extrabold text-foreground">خيارات المنتج</h2>
            </div>
            <p className="mb-4 text-[11px] leading-relaxed text-muted">
              خيارات زي اللون أو المقاس أو صورة النقشة — العميل هيختار منها قبل الإضافة للسلة.
            </p>
            <ProductOptionsEditor options={options} onChange={setOptions} />
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
                  <p className="mt-2 text-xs">مفيش صورة للمنتج</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className={labelClass}>رفع صورة من جهازك</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                className={`block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 ${uploading ? "opacity-70 cursor-not-allowed" : ""}`}
              />
              {uploading && <p className="mt-1.5 text-[11px] text-muted">جارٍ رفع الصورة…</p>}
            </div>
            <div className="mt-3">
              <label className={labelClass}>أو أضف رابط صورة مباشر (اختياري)</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={inputClass}
                dir="ltr"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              جودة الصورة يفضل تكون مربعة (1:1) وأحجام أقل من 5 ميجابايت.
            </p>
          </section>

          <section className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-foreground">ظاهر في المتجر</h2>
                <p className="mt-1 text-[11px] text-muted">قفلها لو عايز تخفي المنتج مؤقتًا.</p>
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
              {loading ? "بنحفظ التغييرات..." : "حفظ التغييرات"}
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
