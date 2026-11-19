"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Blocks,
  ChevronDown,
  Coins,
  CreditCard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { VERSION } from "@/lib/version";
import { storePublicUrl } from "@/lib/domains";

export type ShellStore = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  customDomain?: string | null;
  customDomainStatus?: string;
};

type NavLink = { path: string; label: string };
type NavSection = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  links: NavLink[];
};

const storeSections: NavSection[] = [
  {
    key: "overview",
    label: "الرئيسية",
    icon: BarChart3,
    links: [{ path: "", label: "لوحة الإحصائيات" }],
  },
  {
    key: "subscription",
    label: "الاشتراكات",
    icon: CreditCard,
    links: [{ path: "/subscription", label: "اشتراكك الحالي" }],
  },
  {
    key: "products",
    label: "المنتجات",
    icon: Package,
    links: [
      { path: "/products", label: "كل المنتجات" },
      { path: "/categories", label: "الأقسام" },
      { path: "/reviews", label: "التقييمات" },
    ],
  },
  {
    key: "marketing",
    label: "أدوات التسويق",
    icon: Megaphone,
    links: [
      { path: "/coupons", label: "الكوبونات" },
      { path: "/marketing/cross-selling", label: "Cross Selling" },
      { path: "/marketing/tracking", label: "أدوات التتبع" },
      { path: "/marketing/pixel", label: "إعدادات البيكسل" },
      { path: "/marketing/retargeting", label: "إعادة الاستهداف" },
      { path: "/marketing/services", label: "خدمات التسويق" },
      { path: "/marketing/google-tag", label: "الربط مع جوجل تاج" },
    ],
  },
  {
    key: "orders",
    label: "الطلبات",
    icon: ShoppingBag,
    links: [
      { path: "/orders", label: "كل الطلبات" },
      { path: "/notifications", label: "إشعارات الطلبات" },
    ],
  },
  {
    key: "wallet",
    label: "محفظتك",
    icon: Wallet,
    links: [
      { path: "/wallet", label: "رصيدك" },
      { path: "/wallet/transactions", label: "المعاملات" },
    ],
  },
  {
    key: "affiliate",
    label: "اربح معنا",
    icon: Coins,
    links: [{ path: "/affiliate", label: "نظام التسويق بالعمولة" }],
  },
  {
    key: "alerts",
    label: "الإشعارات",
    icon: Bell,
    links: [{ path: "/alerts", label: "كل الإشعارات" }],
  },
  {
    key: "apps",
    label: "التطبيقات",
    icon: Blocks,
    links: [
      { path: "/apps/payment-gateways", label: "بوابات الدفع" },
      { path: "/apps/pages", label: "الصفحات" },
      { path: "/apps/integrations", label: "ربط بمنصات أخرى" },
    ],
  },
  {
    key: "settings",
    label: "الإعدادات",
    icon: Settings,
    links: [
      { path: "/design", label: "تصميم المتجر والثيمات" },
      { path: "/settings", label: "إعدادات المتجر" },
      { path: "/settings/shipping", label: "مناطق الشحن" },
      { path: "/settings/carriers", label: "شركات الشحن" },
      { path: "/settings/thank-you", label: "صفحة الشكر" },
      { path: "/settings/social", label: "روابط التواصل" },
      { path: "/settings/domain", label: "رابط المتجر والدومين" },
      { path: "/settings/moderators", label: "المديرين" },
      { path: "/support", label: "طلب تطويرات" },
    ],
  },
];

export default function DashboardShell({
  user,
  stores,
  children,
}: {
  user: { name: string; email: string; role?: string };
  stores: ShellStore[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const initial = (user.name || user.email || "B").charAt(0).toUpperCase();

  const currentStoreId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/stores\/([^/]+)/);
    if (!match || match[1] === "new") return null;
    return match[1];
  }, [pathname]);

  const currentStore = stores.find((store) => store.id === currentStoreId) || null;
  const storeBase = currentStore ? `/dashboard/stores/${currentStore.id}` : "";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!currentStore) return;
    const active = storeSections.find((section) =>
      section.links.some((link) => {
        const href = `${storeBase}${link.path}`;
        return link.path === "" ? pathname === storeBase : pathname === href || pathname.startsWith(`${href}/`);
      })
    );
    if (active) {
      setOpenGroups((previous) => (previous[active.key] ? previous : { ...previous, [active.key]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentStore?.id]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isGroupOpen(key: string, section: NavSection) {
    if (openGroups[key] !== undefined) return openGroups[key];
    if (!currentStore) return false;
    return section.links.some((link) => {
      const href = `${storeBase}${link.path}`;
      return link.path === "" ? pathname === storeBase : pathname === href || pathname.startsWith(`${href}/`);
    });
  }

  const sidebarContent = (
    <>
      {stores.length > 0 && (
        <div className="mb-6">
          <label className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-widest text-muted">
            المتجر الحالي
          </label>
          <div className="relative">
            <Store className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <select
              value={currentStoreId || ""}
              onChange={(event) => {
                if (event.target.value) router.push(`/dashboard/stores/${event.target.value}`);
              }}
              className="w-full appearance-none rounded-xl border border-border bg-surface py-2.5 pe-9 ps-9 text-sm font-bold text-foreground outline-none transition-colors focus:border-primary/50"
            >
              <option value="" disabled>
                اختار متجر…
              </option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
          {currentStore && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold text-foreground">{currentStore.name}</div>
                <div className="truncate font-mono text-[9px] text-muted" dir="ltr">
                  {currentStore.slug}.beepanal.store
                </div>
              </div>
              <a
                href={storePublicUrl(currentStore.slug, currentStore.customDomain)}
                target="_blank"
                rel="noreferrer"
                title="فتح المتجر"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {currentStore && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted">
            لوحة المتجر
          </p>
          <div className="space-y-1">
            {storeSections.map((section) => {
              const expanded = isGroupOpen(section.key, section);
              const groupActive = section.links.some((link) => {
                const href = `${storeBase}${link.path}`;
                return link.path === "" ? pathname === storeBase : pathname === href || pathname.startsWith(`${href}/`);
              });
              return (
                <div key={section.key}>
                  <button
                    type="button"
                    onClick={() => setOpenGroups((previous) => ({ ...previous, [section.key]: !expanded }))}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[13px] font-bold transition-colors ${
                      groupActive && !expanded
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <section.icon className={`h-[17px] w-[17px] shrink-0 ${groupActive ? "text-primary" : ""}`} />
                    <span className="flex-1">{section.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="mb-1 mt-0.5 space-y-0.5 ps-5">
                      {section.links.map((link) => {
                        const href = `${storeBase}${link.path}`;
                        const active =
                          link.path === ""
                            ? pathname === storeBase
                            : pathname === href || pathname.startsWith(`${href}/`);
                        return (
                          <Link
                            key={href}
                            href={href || storeBase}
                            className={`relative flex items-center rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted hover:bg-surface hover:text-foreground"
                            }`}
                          >
                            {active && <span className="absolute -start-2 h-1 w-1 rounded-full bg-primary" />}
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <div className="space-y-0.5">
          <Link
            href="/dashboard/stores/new"
            className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <LifeBuoy className="h-[17px] w-[17px] transition-transform group-hover:scale-110" />
            اطلب متجر جديد
          </Link>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute -end-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />
          <Sparkles className="h-5 w-5 text-white/80" />
          <p className="mt-2 text-sm font-extrabold leading-snug">متجرك على سب دومين مجاني</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/80">
            {currentStore ? `${currentStore.slug}.beepanal.store` : "كل متجر بياخد سب دومين مجاني."}
          </p>
          {currentStore && (
            <Link
              href={`${storeBase}/settings/domain`}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-transform hover:-translate-y-0.5"
            >
              اربط دومينك
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-surface text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 flex-col border-e border-border bg-card lg:flex">
        <div className="flex h-[72px] shrink-0 items-center border-b border-border px-6">
          <Logo size="md" href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">{sidebarContent}</div>
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-bold text-white shadow-sm">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">{user.name}</div>
              <div className="truncate text-[11px] text-muted">{user.email}</div>
            </div>
            <Link
              href="/dashboard/account"
              aria-label="بيانات حسابي"
              title="بيانات حسابي"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <UserRound className="h-4 w-4" />
            </Link>
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
        <Logo size="sm" href="/dashboard" />
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[300px] max-w-[88%] flex-col bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo size="sm" href="/dashboard" />
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">{sidebarContent}</div>
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-bold text-white">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{user.name}</div>
                  <div className="truncate text-[11px] text-muted">{user.email}</div>
                </div>
                <Link
                  href="/dashboard/account"
                  aria-label="بيانات حسابي"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                >
                  <UserRound className="h-4 w-4" />
                </Link>
                <button
                  onClick={logout}
                  aria-label="تسجيل خروج"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 lg:ps-72">{children}</main>
    </div>
  );
}
