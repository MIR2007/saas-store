"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NewProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
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
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    fetch(`/api/stores/${storeId}/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
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
        setError(data.error || "فشل إضافة المنتج");
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

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">إضافة منتج جديد</h1>
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
            <label className="block text-sm font-medium text-foreground mb-1">سعر المقارنة (اختياري)</label>
            <input type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">المخزون</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">التصنيف</label>
          <div className="flex gap-2">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="flex-1 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">— بدون تصنيف —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="تصنيف جديد" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button type="button" onClick={addCategory} className="text-sm bg-surface border border-border px-3 py-2 rounded-lg hover:bg-gray-100">إضافة</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">رابط صورة المنتج</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm text-foreground">نشط (ظاهر في المتجر)</label>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <button type="submit" disabled={loading} className="bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-60">
          {loading ? "جاري الحفظ..." : "حفظ المنتج"}
        </button>
      </form>
    </div>
  );
}