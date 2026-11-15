"use client";

import { useEffect, useState } from "react";
import { Users, Store, Phone, Edit, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn, dangerBtn } from "@/lib/ui";
import { formatDate } from "@/lib/format";

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edited, setEdited] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; email: string; phone: string; role: string }>({
    name: "", email: "", phone: "", role: "MERCHANT",
  });

  useEffect(() => {
    loadMerchants();
  }, []);

  async function loadMerchants() {
    const res = await fetch("/api/admin/merchants");
    if (res.ok) {
      const data = await res.json();
      setMerchants(data.merchants || []);
    }
    setLoading(false);
  }

  async function saveMerchant(userId: string) {
    setSaving(userId);
    try {
      const res = await fetch("/api/admin/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...formData }),
      });
      if (res.ok) {
        setEdited(null);
        await loadMerchants();
      }
    } catch {
      // error
    } finally {
      setSaving(null);
    }
  }

  function openEdit(m: any) {
    setFormData({ name: m.name, email: m.email, phone: m.phone || "", role: m.role });
    setEdited(m.id);
  }

  return (
    <div className="min-h-screen bg-surface" dir="rtl">
      <header className="border-b border-border bg-card/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-extrabold text-foreground">لوحة المطور</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/merchants"
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              <Users className="h-3 w-3" /> التجار
            </Link>
            <button className="flex items-center gap-2 text-sm font-semibold text-foreground hover:underline">
              خروج <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">إدارة التجار</h1>
            <p className="text-sm text-muted">شوف قائمة التجار، أرقام هواتفهم، وعدّل بياناتهم وصلاحياتهم.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center text-sm text-muted">بنحمّل التجار…</div>
        ) : (
          <div className={`${cardClass} p-6`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 text-start font-bold">التاجر</th>
                    <th className="px-5 py-3 text-start font-bold">البريد</th>
                    <th className="px-5 py-3 text-start font-bold">التليفون</th>
                    <th className="px-5 py-3 text-start font-bold">متاجره</th>
                    <th className="px-5 py-3 text-start font-bold">تاريخ الانضمام</th>
                    <th className="px-5 py-3 text-start font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {merchants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                        مفيش تجار مسجلين بعد.
                      </td>
                    </tr>
                  ) : (
                    merchants.map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-surface/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">
                              {m.name.charAt(0)}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground">{m.name}</div>
                              <div className="text-[10px] text-muted">{m.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-foreground">
                          {m.email}
                        </td>
                        <td className="px-5 py-3.5">
                          {m.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted shrink-0" />
                              <span className="font-mono text-[11px] text-foreground">{m.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted">محددش</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {m._count.stores} متجر
                          </span>
                          <div className="mt-1 flex gap-1">
                            {m.stores.map((s: any) => (
                              <span key={s.id} className="text-[10px] text-muted truncate max-w-[120px]">
                                {s.name} {s.active ? "" : "(مقفول)"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[11px] text-muted">
                          {formatDate(m.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          {edited === m.id ? (
                            <div className="flex flex-col gap-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  className={inputClass}
                                />
                                <input
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className={inputClass}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className={inputClass}
                                />
                                <select
                                  value={formData.role}
                                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                  className={inputClass}
                                >
                                  <option value="MERCHANT">تاجر</option>
                                  <option value="CUSTOMER">عميل</option>
                                  <option value="ADMIN">أدمن</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveMerchant(m.id)}
                                  disabled={saving === m.id}
                                  className={`${primaryBtn} text-[10px] px-3 py-1.5`}
                                >
                                  {saving === m.id ? "جارٍ..." : "حفظ"}
                                </button>
                                <button
                                  onClick={() => setEdited(null)}
                                  className={`${secondaryBtn} text-[10px] px-3 py-1.5`}
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => openEdit(m)}
                                className="flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-white hover:border-primary"
                              >
                                <Edit className="h-3 w-3" /> تعديل
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
