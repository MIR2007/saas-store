"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Sparkles,
  Store,
  Wallet,
  X,
  Palette,
} from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { VERSION } from "@/lib/version";

const nav = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/stores", label: "متاجري", icon: Store },
  { href: "/dashboard/stores/new", label: "متجر جديد", icon: PlusCircle },
  { href: "/dashboard/stores/[storeId]/wallet", label: "محفظتك", icon: Wallet },
  { href: "/dashboard/stores/[storeId]/design", label: "تصميم المتجر", icon: Palette },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/dashboard/stores") {
    return pathname === href || (pathname.startsWith("/dashboard/stores/") && pathname !== "/dashboard/stores/new");
  }
  if (href.includes("[storeId]")) {
    const base = href.replace("/[storeId]", "");
    return pathname.startsWith(base + "/") || pathname === base;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string; role?: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = (user.name || user.email || "B").charAt(0).toUpperCase();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navLinks = (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
              active
                ? "bg-primary/10 text-primary ring-1 ring-primary/15"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            <item.icon
              className={`h-[18px] w-[18px] transition-transform group-hover:scale-110 ${
                active ? "text-primary" : ""
              }`}
            />
            {item.label}
            {active && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-surface text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-border bg-card lg:flex">
        <div className="flex h-[70px] shrink-0 items-center border-b border-border px-6">
          <Logo size="md" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted">
            إدارة المتجر
          </p>
          {navLinks}

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-widest text-muted">
            روابط سريعة
          </p>
          <div className="space-y-1">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <Globe className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
              زيارة الموقع
              <ArrowUpRight className="ms-auto h-3.5 w-3.5 opacity-50" />
            </Link>
            <Link
              href="/livestore"
              className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <Store className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
              المتجر التجريبي
              <ArrowUpRight className="ms-auto h-3.5 w-3.5 opacity-50" />
            </Link>
          </div>

          <div className="relative mt-7 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg shadow-amber-500/20">
            <div className="absolute -end-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />
            <Sparkles className="h-5 w-5 text-white/80" />
            <p className="mt-2 text-sm font-extrabold leading-snug">ابدأ متجرك التاني</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/80">
              متجر جديد في أقل من 10 دقايق.
            </p>
            <Link
              href="/dashboard/stores/new"
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-transform hover:-translate-y-0.5"
            >
              اعمل متجر
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-bold text-white shadow-sm">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">{user.name}</div>
              <div className="truncate text-[11px] text-muted">{user.email}</div>
            </div>
            <button
              onClick={logout}
              aria-label="تسجيل خروج"
              title="تسجيل خروج"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="font-mono text-[10px] text-muted">v{VERSION}</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-xl lg:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            aria-label="القائمة"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 flex w-[280px] max-w-[85%] flex-col bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo size="sm" />
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {navLinks}
              <div className="mt-6 space-y-1 border-t border-border pt-4">
                <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted hover:bg-surface">
                  <Globe className="h-[18px] w-[18px]" /> زيارة الموقع
                </Link>
                <Link href="/livestore" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted hover:bg-surface">
                  <Store className="h-[18px] w-[18px]" /> المتجر التجريبي
                </Link>
              </div>
            </div>
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-bold text-white">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{user.name}</div>
                  <div className="truncate text-[11px] text-muted">{user.email}</div>
                </div>
                <button onClick={logout} aria-label="تسجيل خروج" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-600">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 lg:ps-64">{children}</main>
    </div>
  );
}
