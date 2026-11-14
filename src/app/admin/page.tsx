"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VERSION } from "@/lib/version";

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-foreground text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">A</span>
            <span className="font-bold">Admin Panel — Bee Panal</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-white/80 hover:text-white">تسجيل خروج</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">لوحة تحكم المبرمج</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "المستخدمون", value: data.stats.users },
            { label: "المتاجر", value: data.stats.stores },
            { label: "المنتجات", value: data.stats.products },
            { label: "الطلبات", value: data.stats.orders },
            { label: "الإيرادات", value: data.stats.revenue.toLocaleString() },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-5">
              <div className="text-sm text-muted">{s.label}</div>
              <div className="text-2xl font-bold text-foreground mt-2">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4">آخر المستخدمين</h2>
            <ul className="divide-y divide-border text-sm">
              {data.recentUsers.map((u: any) => (
                <li key={u.id} className="py-2 flex justify-between">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted">{u.email}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4">آخر الطلبات</h2>
            <ul className="divide-y divide-border text-sm">
              {data.recentOrders.map((o: any) => (
                <li key={o.id} className="py-2 flex justify-between">
                  <span>{o.customerName} — {o.store.name}</span>
                  <span className="font-medium text-primary">{o.total.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-xs text-muted text-center">
          Bee Panal Admin · v{VERSION}
        </div>
      </main>
    </div>
  );
}

