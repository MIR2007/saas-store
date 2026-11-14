"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStorePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!slug) {
      setSlug(v.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إنشاء المتجر");
        return;
      }
      router.push(`/dashboard/stores/${data.store.id}`);
      router.refresh();
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">إنشاء متجر جديد</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">اسم المتجر</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">رابط المتجر (slug)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              className="flex-1 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <p className="text-xs text-muted mt-1">أحرف إنجليزية صغيرة وأرقام وشرطة فقط</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">وصف المتجر</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-60"
        >
          {loading ? "جاري الإنشاء..." : "إنشاء المتجر"}
        </button>
      </form>
    </div>
  );
}