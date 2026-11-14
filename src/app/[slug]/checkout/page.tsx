"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type CartItem = { productId: string; name: string; price: number; quantity: number };

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("IQD");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(`cart:${slug}`);
    setCart(raw ? JSON.parse(raw) : []);
    fetch(`/api/public/stores/${slug}`)
      .then((r) => r.json())
      .then((d) => setCurrency(d.store?.currency || "IQD"));
  }, [slug]);

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (cart.length === 0) {
      setError("السلة فارغة");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: slug,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          notes,
          items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إتمام الطلب");
        return;
      }
      localStorage.removeItem(`cart:${slug}`);
      router.push(`/${slug}/order/${data.order.id}`);
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link href={`/${slug}/cart`} className="text-muted hover:text-foreground">← العودة للسلة</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 grid md:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="md:col-span-3 bg-white border border-border rounded-2xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-foreground mb-2">معلومات التوصيل</h1>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">الاسم</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">رقم الهاتف</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">العنوان</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">ملاحظات</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary-dark transition disabled:opacity-60">
            {loading ? "جاري إرسال الطلب..." : "تأكيد الطلب"}
          </button>
        </form>
        <div className="md:col-span-2 bg-white border border-border rounded-2xl p-6 h-fit">
          <h2 className="font-bold text-foreground mb-4">ملخص الطلب</h2>
          <ul className="divide-y divide-border text-sm">
            {cart.map((c) => (
              <li key={c.productId} className="py-2 flex justify-between">
                <span>{c.name} × {c.quantity}</span>
                <span>{(c.price * c.quantity).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-border flex justify-between font-bold text-foreground">
            <span>المجموع</span>
            <span>{total.toLocaleString()} {currency}</span>
          </div>
        </div>
      </main>
    </div>
  );
}