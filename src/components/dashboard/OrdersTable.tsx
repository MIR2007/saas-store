"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatDate, formatMoney, ORDER_STATUS, type OrderStatus } from "@/lib/format";
import { cardClass, inputClass, secondaryBtn } from "@/lib/ui";

export type OrderRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCountry: string;
  customerRegion: string;
  customerAddress: string;
  notes: string;
  status: string;
  subtotal: number;
  discount: number;
  couponCode: string;
  shipping: number;
  total: number;
  createdAt: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    product: { images: string } | null;
  }[];
};

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const MAX_PRINT = 60;

function firstImage(raw: string | undefined | null) {
  try {
    const images = JSON.parse(raw || "[]");
    return Array.isArray(images) ? images[0] || "" : "";
  } catch {
    return "";
  }
}

function csvCell(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function OrdersTable({
  storeId,
  currency,
  orders,
}: {
  storeId: string;
  currency: string;
  orders: OrderRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (q) {
        const haystack = `${order.customerName} ${order.customerPhone} ${order.id}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      const created = new Date(order.createdAt).getTime();
      if (fromTime !== null && created < fromTime) return false;
      if (toTime !== null && created > toTime) return false;
      return true;
    });
  }, [orders, query, status, from, to]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selected.has(order.id)),
    [orders, selected]
  );
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((order) => selected.has(order.id));

  function resetSelection() {
    setSelected(new Set());
  }

  function toggleOne(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) filtered.forEach((order) => next.delete(order.id));
      else filtered.forEach((order) => next.add(order.id));
      return next;
    });
  }

  async function applyBulkStatus() {
    if (!selected.size) return;
    if (
      bulkStatus === "cancelled" &&
      !confirm("تغيير حالة الطلبات المحددة إلى «ملغي»؟ لو فيه طلبات تم تسليمها هيتخصم مبلغها من المحفظة.")
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/stores/${storeId}/orders/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [...selected], status: bulkStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "مش قادرين نحدّث الطلبات.");
        return;
      }
      const parts = [`تم تحديث ${data.updated || 0} طلب`];
      if (data.skipped) parts.push(`${data.skipped} بدون تغيير`);
      if (data.failed?.length) parts.push(`${data.failed.length} فشل`);
      setMessage(parts.join(" · "));
      resetSelection();
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  function openPrint(doc: "invoice" | "label") {
    if (!selected.size) return;
    if (selected.size > MAX_PRINT) {
      setError(`الحد الأقصى ${MAX_PRINT} طلب في عملية الطباعة الواحدة. قلّل التحديد وجرّب تاني.`);
      return;
    }
    setError("");
    const ids = selectedOrders.map((order) => order.id);
    window.open(
      `/print/${storeId}/orders?ids=${encodeURIComponent(ids.join(","))}&doc=${doc}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function exportCsv() {
    const rows = selected.size ? selectedOrders : filtered;
    if (!rows.length) {
      setError("مفيش طلبات للتصدير.");
      return;
    }
    setError("");

    const header = [
      "رقم الطلب",
      "التاريخ",
      "العميل",
      "الموبايل",
      "المحافظة",
      "العنوان",
      "الحالة",
      "المنتجات",
      "المنتجات قبل الخصم",
      "الخصم",
      "الكوبون",
      "الشحن",
      "الإجمالي",
      "ملاحظات",
    ];
    const lines = rows.map((order) =>
      [
        order.id,
        formatDate(order.createdAt),
        order.customerName,
        order.customerPhone,
        order.customerRegion,
        order.customerAddress,
        ORDER_STATUS[order.status as OrderStatus]?.label || order.status,
        order.items.map((item) => `${item.name} ×${item.quantity}`).join(" | "),
        order.subtotal,
        order.discount,
        order.couponCode,
        order.shipping,
        order.total,
        order.notes,
      ]
        .map(csvCell)
        .join(",")
    );

    const blob = new Blob([`\uFEFF${header.map(csvCell).join(",")}\n${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetSelection();
            }}
            placeholder="ابحث باسم العميل أو رقم الموبايل أو رقم الطلب..."
            className={`${inputClass} ps-10`}
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted shadow-sm">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span className="whitespace-nowrap">من</span>
          <input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              resetSelection();
            }}
            className="w-full bg-transparent text-xs font-bold text-foreground outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted shadow-sm">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span className="whitespace-nowrap">إلى</span>
          <input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              resetSelection();
            }}
            className="w-full bg-transparent text-xs font-bold text-foreground outline-none"
          />
        </label>
        <div className="flex items-center gap-2">
          {(query || from || to || status !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFrom("");
                setTo("");
                setStatus("all");
                resetSelection();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold text-muted transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              مسح
            </button>
          )}
          <button type="button" onClick={exportCsv} className={`${secondaryBtn} px-3 py-2.5 text-xs`}>
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ key: "all" as const, label: "كل الطلبات" }, ...STATUS_ORDER.map((key) => ({ key, label: ORDER_STATUS[key].label }))].map(
          (filter) => {
            const active = status === filter.key;
            const count =
              filter.key === "all"
                ? orders.length
                : orders.filter((order) => order.status === filter.key).length;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  setStatus(filter.key);
                  resetSelection();
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? "bg-primary text-white shadow-sm shadow-amber-500/20"
                    : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    active ? "bg-white/20 text-white" : "bg-surface text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {selected.size > 0 && (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-gradient-to-l from-amber-500/10 via-card to-orange-500/5 p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              تم تحديد {selected.size} طلب
              <button
                type="button"
                onClick={resetSelection}
                className="text-[11px] font-bold text-muted underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                إلغاء التحديد
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value as OrderStatus)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-sm outline-none focus:border-primary/60"
              >
                {STATUS_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {ORDER_STATUS[value].label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyBulkStatus}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                تغيير الحالة
              </button>
              <button
                type="button"
                onClick={() => openPrint("invoice")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-surface"
              >
                <FileText className="h-3.5 w-3.5" />
                فواتير
              </button>
              <button
                type="button"
                onClick={() => openPrint("label")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-surface"
              >
                <Truck className="h-3.5 w-3.5" />
                بوالص
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-surface"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted">
            الطباعة بتفتح تاب جديد وفيه كل المستندات المحددة، كل مستند في صفحة منفصلة.
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={`${cardClass} p-10 text-center`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-muted">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <h3 className="mt-3 font-extrabold text-foreground">
            {orders.length === 0 ? "لسه مفيش طلبات" : "مفيش طلبات مطابقة"}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {orders.length === 0
              ? "أول ما عميل يطلب من متجرك، الطلب هيظهر هنا وهتقدر تتابعه خطوة بخطوة."
              : "جرّب تغير البحث أو الفلاتر."}
          </p>
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-surface/80 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="w-10 px-3 py-3 text-start">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="تحديد كل الطلبات الظاهرة"
                      className="h-4 w-4 cursor-pointer rounded border-border accent-amber-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-start font-bold">العميل</th>
                  <th className="px-4 py-3 text-start font-bold">المنتجات</th>
                  <th className="px-4 py-3 text-start font-bold">المبلغ</th>
                  <th className="px-4 py-3 text-start font-bold">الحالة</th>
                  <th className="px-4 py-3 text-start font-bold">التاريخ</th>
                  <th className="px-4 py-3 text-start font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => {
                  const checked = selected.has(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        checked ? "bg-amber-500/5" : "hover:bg-surface/60"
                      }`}
                    >
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(order.id)}
                          aria-label={`تحديد طلب ${order.customerName}`}
                          className="h-4 w-4 cursor-pointer rounded border-border accent-amber-500"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">
                            {order.customerName.charAt(0)}
                          </span>
                          <div>
                            <div className="font-semibold text-foreground">{order.customerName}</div>
                            <div className="text-[10px] text-muted" dir="ltr">
                              {order.customerPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[240px] px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface text-muted">
                            {firstImage(order.items[0]?.product?.images) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={firstImage(order.items[0]?.product?.images)}
                                alt={order.items[0]?.name || ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-muted">{order.items[0]?.name || "—"}</div>
                            <div className="text-[10px] text-muted">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)} قطعة
                              {order.items.length > 1 && ` · ${order.items.length} منتجات`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-bold text-foreground">
                        {formatMoney(order.total, currency)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/stores/${storeId}/orders/${order.id}`}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          تفاصيل
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface/40 px-4 py-3 text-[11px] text-muted">
            <span>
              ظاهر {filtered.length} من {orders.length} طلب
            </span>
            {selected.size > 0 && <span>محدد {selected.size}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
