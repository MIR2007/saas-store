"use client";

import {
  BarChart3,
  Bell,
  Footprints,
  Headphones,
  LayoutDashboard,
  Lock,
  Package,
  Plus,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
  Watch,
} from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

const BARS = [42, 58, 37, 70, 52, 88, 64];

export default function HeroMockup() {
  const { locale } = useLang();
  const ar = locale === "ar";

  const menu = [
    { icon: LayoutDashboard, label: ar ? "نظرة عامة" : "Overview", active: true },
    { icon: ShoppingCart, label: ar ? "الطلبات" : "Orders" },
    { icon: Package, label: ar ? "المنتجات" : "Products" },
    { icon: Users, label: ar ? "العملاء" : "Customers" },
    { icon: BarChart3, label: ar ? "التقارير" : "Reports" },
  ];

  const stats = [
    { label: ar ? "المبيعات" : "Sales", value: "48,250", suffix: ar ? "ر.س" : "SAR", up: "+12%" },
    { label: ar ? "الطلبات" : "Orders", value: "326", suffix: "", up: "+8%" },
    { label: ar ? "العملاء" : "Customers", value: "1,204", suffix: "", up: "+23%" },
  ];

  const orders = [
    {
      name: ar ? "أحمد العبيدي" : "Ahmed Al-Obaidi",
      product: ar ? "سماعات لاسلكية" : "Wireless Headphones",
      amount: ar ? "3,200 ر.س" : "SAR 3,200",
      status: ar ? "جديد" : "New",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: Headphones,
      tile: "from-amber-400 to-orange-500",
    },
    {
      name: ar ? "سارة الحسيني" : "Sara Al-Husseini",
      product: ar ? "ساعة ذكية" : "Smart Watch",
      amount: ar ? "1,850 ر.س" : "SAR 1,850",
      status: ar ? "قيد الشحن" : "Shipping",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: Watch,
      tile: "from-sky-400 to-blue-500",
    },
    {
      name: ar ? "محمد الكناني" : "Mohammed Al-Kinani",
      product: ar ? "حذاء رياضي" : "Running Shoes",
      amount: ar ? "980 ر.س" : "SAR 980",
      status: ar ? "مكتمل" : "Completed",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: Footprints,
      tile: "from-emerald-400 to-teal-500",
    },
  ];

  return (
    <div className="relative mx-auto max-w-xl lg:max-w-none">
      {/* Glow */}
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-amber-400/30 via-orange-400/20 to-yellow-300/30 blur-3xl dark:from-amber-500/15 dark:via-orange-500/10 dark:to-yellow-500/10" />

      {/* Frame */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_40px_100px_-30px_rgba(180,83,9,0.45)]">
        {/* Browser chrome */}
        <div className="flex h-10 items-center gap-1.5 border-b border-border bg-surface px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="mx-auto flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1 text-[10px] text-muted">
            <Lock className="h-2.5 w-2.5" />
            app.beepanal.store
          </div>
          <Bell className="h-3.5 w-3.5 text-muted" />
        </div>

        <div className="flex text-[11px]">
          {/* Sidebar */}
          <aside className="hidden w-32 shrink-0 flex-col gap-1 border-e border-border bg-surface p-3 sm:flex">
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-bold text-white">
                B
              </span>
              <span className="text-[11px] font-bold text-foreground">Bee Panal</span>
            </div>
            {menu.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                  item.active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="text-[10px]">{item.label}</span>
              </div>
            ))}
            <div className="mt-auto flex items-center gap-2 rounded-lg border border-border bg-card p-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[9px] font-bold text-white">
                م
              </span>
              <div className="min-w-0">
                <div className="truncate text-[9px] font-semibold text-foreground">
                  {ar ? "متجر النخبة" : "Elite Store"}
                </div>
                <div className="text-[8px] text-emerald-500">● {ar ? "نشط" : "Live"}</div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1 space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {ar ? "نظرة عامة" : "Overview"}
                </div>
                <div className="text-[9px] text-muted">
                  {ar ? "مرحباً محمد، إليك ملخص اليوم" : "Welcome back, here is today"}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[9px] text-muted">
                  <Search className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">{ar ? "بحث..." : "Search..."}</span>
                </div>
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-white">
                  <Plus className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-surface p-2">
                  <div className="text-[8px] text-muted">{s.label}</div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-[13px] font-bold text-foreground">{s.value}</span>
                    <span className="text-[7px] text-muted">{s.suffix}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-0.5 text-[8px] font-semibold text-emerald-500">
                    <TrendingUp className="h-2 w-2" />
                    {s.up}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2.5 md:grid-cols-5">
              {/* Chart */}
              <div className="rounded-xl border border-border bg-surface p-2.5 md:col-span-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-foreground">
                    {ar ? "المبيعات آخر 7 أيام" : "Sales — last 7 days"}
                  </span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold text-primary">
                    {ar ? "أسبوعي" : "Weekly"}
                  </span>
                </div>
                <div className="flex h-24 items-end gap-1.5">
                  {BARS.map((h, i) => (
                    <div
                      key={i}
                      className="animate-bar w-full flex-1 rounded-t-[3px] bg-gradient-to-t from-amber-600 to-amber-300"
                      style={{ height: `${h}%`, animationDelay: `${i * 90 + 250}ms` }}
                    />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[7px] text-muted">
                  {(ar ? ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"] : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]).map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>

              {/* Orders */}
              <div className="rounded-xl border border-border bg-surface p-2.5 md:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-foreground">
                    {ar ? "آخر الطلبات" : "Recent orders"}
                  </span>
                  <span className="text-[8px] text-primary">{ar ? "الكل" : "All"}</span>
                </div>
                <div className="space-y-1.5">
                  {orders.map((o) => (
                    <div key={o.name} className="flex items-center gap-1.5">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br ${o.tile} text-white`}>
                        <o.icon className="h-3 w-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[8px] font-semibold text-foreground">{o.name}</div>
                        <div className="truncate text-[7px] text-muted">{o.product}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-[8px] font-bold text-foreground">{o.amount}</div>
                        <span className={`inline-block rounded px-1 py-px text-[6.5px] font-semibold ${o.color}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: new order */}
      <div className="animate-float absolute -top-5 -start-3 z-10 flex items-center gap-2.5 rounded-xl border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur sm:-start-7 sm:p-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <ShoppingCart className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] font-bold text-foreground">{ar ? "طلب جديد 🎉" : "New order 🎉"}</div>
          <div className="text-[10px] text-muted">
            {ar ? "الآن · +3,200 ر.س" : "Just now · +SAR 3,200"}
          </div>
        </div>
      </div>

      {/* Floating: conversion */}
      <div className="animate-float-slow absolute -bottom-5 -end-2 z-10 flex items-center gap-2.5 rounded-xl border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur sm:-end-6 sm:p-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] text-muted">{ar ? "نسبة التحويل" : "Conversion rate"}</div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-foreground">4.8%</span>
            <span className="rounded bg-emerald-500/10 px-1 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
              +1.2%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
