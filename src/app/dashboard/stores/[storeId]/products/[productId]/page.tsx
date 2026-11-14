"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const productId = params.productId as string;
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/stores/${storeId}/categories`).then((r) => r.json()),
      fetch(`/api/stores/${storeId}/products/${productId}`).then((r) => r.json()),
    ]).then(([cats, prod]) => {
      setCategories(cats.categories || []);
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
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل تحديث المنتج");
        return;
      }
      router.push(`/dashboard/stores/${storeId}/products`);
      router.refresh();
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">تعديل المنتج</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">اسم المنتج</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">السعر</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">سعر المقارنة</label>
            <input type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">المخزون</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">التصنيف</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">— بدون تصنيف —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">رابط صورة المنتج</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm text-foreground">نشط</label>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <button type="submit" disabled={loading} className="bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-60">
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </div>
  );
}