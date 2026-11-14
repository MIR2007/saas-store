"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StoreSettingsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("#2563eb");
  const [currency, setCurrency] = useState("IQD");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((r) => r.json())
      .then((d) => {
        const s = d.store;
        if (s) {
          setName(s.name);
          setDescription(s.description || "");
          setThemeColor(s.themeColor);
          setCurrency(s.currency);
          setActive(s.active);
        }
        setLoaded(true);
      });
  }, [storeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, themeColor, currency, active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل الحفظ");
        return;
      }
      router.refresh();
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا المتجر وجميع بياناته؟")) return;
    await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
    router.push("/dashboard/stores");
    router.refresh();
  }

  if (!loaded) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">إعدادات المتجر</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">اسم المتجر</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">لون الثيم</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-12 h-10 border border-border rounded" />
              <input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="flex-1 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">العملة</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="IQD">IQD - دينار عراقي</option>
              <option value="USD">USD - دولار</option>
              <option value="SAR">SAR - ريال</option>
              <option value="AED">AED - درهم</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm text-foreground">المتجر نشط (ظاهر للعملاء)</label>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-60">
            {loading ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button type="button" onClick={handleDelete} className="text-red-600 border border-red-200 px-6 py-2.5 rounded-lg hover:bg-red-50 transition">
            حذف المتجر
          </button>
        </div>
      </form>
    </div>
  );
}