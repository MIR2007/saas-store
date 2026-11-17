"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FolderTree, ImagePlus, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count?: { products: number };
};

export default function CategoriesPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageTarget, setImageTarget] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File, category?: Category) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      if (category?.image) body.append("previousUrl", category.image);
      const uploadRes = await fetch("/api/upload/image", { method: "POST", body });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error || "فشل رفع صورة القسم");
        return;
      }
      if (!category) {
        setImage(uploadData.url);
        return;
      }
      const res = await fetch(`/api/stores/${storeId}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, image: uploadData.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نحفظ صورة القسم");
        return;
      }
      setCategories((previous) =>
        previous.map((item) => (item.id === category.id ? { ...item, image: uploadData.url } : item))
      );
    } catch {
      setError("فشل رفع صورة القسم، جرّب تاني.");
    } finally {
      setUploading(false);
      setImageTarget(null);
    }
  }

  async function load() {
    const res = await fetch(`/api/stores/${storeId}/categories`);
    const data = await res.json();
    if (res.ok) setCategories(Array.isArray(data.categories) ? data.categories : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/stores/${storeId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نضيف القسم.");
        return;
      }
      setName("");
      setImage("");
      await load();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSaving(false);
    }
  }

  async function renameCategory(category: Category) {
    const next = prompt("اسم القسم الجديد:", category.name);
    if (!next || !next.trim() || next.trim() === category.name) return;
    setBusyId(category.id);
    setError("");
    try {
      const res = await fetch(`/api/stores/${storeId}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, name: next.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "مش قادرين نعدّل القسم.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCategory(category: Category) {
    if (!confirm(`حذف قسم «${category.name}»؟ المنتجات هتفضل موجودة من غير قسم.`)) return;
    setBusyId(category.id);
    setError("");
    try {
      const res = await fetch(`/api/stores/${storeId}/categories?id=${category.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "مش قادرين نحذف القسم.");
        return;
      }
      setCategories((previous) => previous.filter((item) => item.id !== category.id));
    } finally {
      setBusyId(null);
    }
  }

  const totalProducts = categories.reduce((sum, category) => sum + (category._count?.products || 0), 0);

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel="لوحة المتجر"
        eyebrow="المنتجات"
        title="أقسام المتجر"
        subtitle="قسّم منتجاتك على أقسام واضحة عشان العميل يوصل للي بيدور عليه أسرع."
        icon={<FolderTree className="h-6 w-6" />}
        action={
          <Link href={`/dashboard/stores/${storeId}/products`} className={secondaryBtn}>
            <Package className="h-4 w-4" />
            كل المنتجات
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className={`${cardClass} p-5`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">عدد الأقسام</p>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{categories.length}</div>
        </div>
        <div className={`${cardClass} p-5`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">منتجات في الأقسام</p>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{totalProducts}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className={`${cardClass} p-6 lg:col-span-4`}>
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold text-foreground">قسم جديد</h2>
          </div>
          <form onSubmit={addCategory} className="space-y-3">
            <div>
              <label className={labelClass}>اسم القسم</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="مثال: عطور رجالية"
                className={inputClass}
                maxLength={60}
              />
            </div>
            <div>
              <label className={labelClass}>صورة القسم (اختياري)</label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface/60 p-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-card text-primary ring-1 ring-border">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="صورة القسم" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImageTarget(null);
                      fileInput.current?.click();
                    }}
                    disabled={uploading}
                    className="text-xs font-bold text-primary hover:underline disabled:opacity-60"
                  >
                    {uploading && imageTarget === null ? "بنرفع..." : image ? "تغيير الصورة" : "رفع صورة للقسم"}
                  </button>
                  <p className="mt-1 text-[10px] text-muted">بتظهر في كروت الأقسام على المتجر.</p>
                </div>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="text-[11px] font-bold text-rose-600 hover:underline dark:text-rose-400"
                  >
                    إزالة
                  </button>
                )}
              </div>
            </div>
            {error && (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </p>
            )}
            <button type="submit" disabled={saving || !name.trim()} className={`${primaryBtn} w-full justify-center`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إضافة القسم
            </button>
          </form>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const target = imageTarget ? categories.find((item) => item.id === imageTarget) : undefined;
                uploadImage(file, target);
              }
              e.target.value = "";
            }}
          />
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            الأقسام بتظهر للعميل كفلاتر فوق المنتجات في واجهة المتجر.
          </p>
        </section>

        <section className="lg:col-span-8">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl bg-surface" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="لسه مفيش أقسام"
              description="ابدأ بإضافة قسمين أو تلاتة يساعدوا عملاءك يلاقوا المنتجات أسرع."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <div key={category.id} className={`${cardClass} flex items-center gap-3 p-4`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {category.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                    ) : (
                      <FolderTree className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-foreground">{category.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {category._count?.products || 0} منتج
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImageTarget(category.id);
                        fileInput.current?.click();
                      }}
                      disabled={uploading}
                      title="صورة القسم"
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {uploading && imageTarget === category.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => renameCategory(category)}
                      disabled={busyId === category.id}
                      title="تعديل"
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {busyId === category.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category)}
                      disabled={busyId === category.id}
                      title="حذف"
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
