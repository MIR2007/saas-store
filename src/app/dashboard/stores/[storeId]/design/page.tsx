"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ImagePlus,
  LayoutGrid,
  Loader2,
  Megaphone,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";
import { storePublicUrl } from "@/lib/domains";
import {
  STORE_FONTS,
  STORE_THEMES,
  getStoreTheme,
  parseThemeConfig,
  resolveThemeId,
  storeFontHref,
  storeThemeVars,
  type StoreTheme,
  type StoreThemeConfig,
  type StoreThemeFont,
} from "@/lib/themes";

const RADIUS_OPTIONS = [
  { value: "", label: "افتراضي الثيم" },
  { value: "0", label: "حاد بدون استدارة" },
  { value: "0.125rem", label: "استدارة خفيفة جدًا" },
  { value: "0.25rem", label: "خفيفة" },
  { value: "0.5rem", label: "متوسطة" },
  { value: "0.75rem", label: "مريحة" },
  { value: "1rem", label: "دائرية" },
  { value: "1.5rem", label: "دائرية أكثر" },
  { value: "2rem", label: "كبيرة" },
  { value: "9999px", label: "كاملة الاستدارة" },
];

const COLOR_FIELDS = [
  { key: "primary", label: "اللون الأساسي" },
  { key: "primaryDark", label: "اللون الأساسي الغامق" },
  { key: "surface", label: "خلفية الصفحة" },
  { key: "card", label: "خلفية الكروت" },
  { key: "foreground", label: "لون النص" },
  { key: "muted", label: "النص الثانوي" },
  { key: "border", label: "لون الحدود" },
] as const;

type ColorKey = (typeof COLOR_FIELDS)[number]["key"];

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5 text-start transition-colors hover:border-primary/30"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ insetInlineStart: checked ? "1.125rem" : "0.125rem" }}
        />
      </span>
    </button>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const shown = value || fallback;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/50 px-2.5 py-2">
      <input
        type="color"
        value={shown}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
      />
      <span className="min-w-0 flex-1 text-[11px] font-bold text-foreground">{label}</span>
      <input
        value={value ?? ""}
        onChange={(event) => {
          let next = event.target.value.trim();
          if (next && !next.startsWith("#")) next = `#${next}`;
          if (!next || /^#[0-9a-fA-F]{0,6}$/.test(next)) onChange(next);
        }}
        placeholder={fallback}
        dir="ltr"
        className="w-[4.75rem] rounded-md border border-border bg-card px-1.5 py-1 text-center font-mono text-[10px] font-bold text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}

function ChoiceCard({
  active,
  onClick,
  title,
  desc,
  preview,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  preview?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-3 text-start transition-all ${
        active
          ? "border-primary bg-primary/[0.05] ring-2 ring-primary/20"
          : "border-border bg-surface/40 hover:border-primary/30"
      }`}
    >
      {preview}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
            active ? "border-primary bg-primary text-white" : "border-border text-transparent"
          }`}
        >
          <Check className="h-2.5 w-2.5" />
        </span>
      </div>
      {desc && <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{desc}</p>}
    </button>
  );
}

function ThemePreviewCard({ theme }: { theme: StoreTheme }) {
  return (
    <div
      className="overflow-hidden border"
      style={{ background: theme.surface, borderColor: theme.border, borderRadius: theme.radius }}
    >
      <div
        className="flex items-center justify-between px-2.5 py-2"
        style={{ background: theme.card, borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="grid h-4 w-4 place-items-center text-[7px] font-black text-white"
            style={{ background: theme.primary, borderRadius: theme.buttonRadius }}
          >
            B
          </span>
          <span
            className="h-1.5 w-9 rounded-full"
            style={{ background: theme.foreground, opacity: 0.6 }}
          />
        </div>
        <span
          className="h-3.5 w-3.5 rounded-full"
          style={{ background: theme.primary, opacity: 0.2 }}
        />
      </div>
      <div className="p-2.5">
        <div
          className="p-2"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
          }}
        >
          <div
            className="h-9"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
              borderRadius: theme.radius,
            }}
          />
          <div
            className="mt-1.5 h-1.5 w-10 rounded-full"
            style={{ background: theme.foreground, opacity: 0.45 }}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="h-1.5 w-6 rounded-full" style={{ background: theme.primary }} />
            <span
              className="h-3.5 w-8"
              style={{ background: theme.primary, borderRadius: theme.buttonRadius }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LivePreview({
  store,
  theme,
  themeColor,
  config,
}: {
  store: { name: string; logo?: string | null; description?: string | null };
  theme: StoreTheme;
  themeColor: string;
  config: StoreThemeConfig;
}) {
  const vars = storeThemeVars(theme.id, themeColor, config) as CSSProperties;
  const primary = config.colors.primary || themeColor || theme.primary;
  const initial = store.name.trim().charAt(0) || "B";
  const heroImage = config.heroImage;
  const heroTitle = config.heroTitle || store.name || "اسم متجرك";
  const heroSubtitle =
    config.heroSubtitle ||
    store.description ||
    "تشكيلة مختارة بعناية من المنتجات التي تجمع بين الأناقة والجودة.";
  const heroBadge = config.heroBadge || "تشكيلة جديدة";
  const announcement =
    config.announcement || "شحن سريع لكل محافظات مصر — الدفع عند الاستلام";
  const products = Array.from({ length: config.gridCols });

  const brand = (
    <div className={`flex min-w-0 items-center gap-1.5 ${config.headerStyle === "centered" ? "flex-col" : ""}`}>
      {store.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logo} alt="" className="h-6 w-6 object-contain" />
      ) : (
        <span
          className="grid h-6 w-6 shrink-0 place-items-center border border-primary/40 bg-primary/10 text-[9px] font-bold text-primary"
          style={{ fontFamily: "var(--store-heading-font)" }}
        >
          {initial}
        </span>
      )}
      <span className="min-w-0 text-center">
        <span
          className="block max-w-[8rem] truncate text-[10px] font-semibold tracking-[0.14em] text-foreground"
          style={{ fontFamily: "var(--store-heading-font)" }}
        >
          {store.name || "اسم متجرك"}
        </span>
        <span className="block text-[5px] font-bold uppercase tracking-[0.28em] text-muted">
          Bee Panal Store
        </span>
      </span>
    </div>
  );

  return (
    <div
      className={`store-theme overflow-hidden border ${theme.dark ? "dark" : ""}`}
      style={{ ...vars, borderColor: "var(--border)", borderRadius: "var(--store-radius)" }}
    >
      {config.announcementEnabled && (
        <div className="flex items-center justify-center gap-1.5 bg-[#111111] px-2 py-1 text-center text-[6px] font-semibold tracking-[0.06em] text-[#f3eee4]">
          <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span className="truncate">{announcement}</span>
          <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        </div>
      )}

      <div className="border-b border-border bg-card">
        {config.headerStyle === "centered" ? (
          <>
            <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-1 px-2.5">
              <div className="flex items-center gap-1 text-muted">
                <span className="h-3 w-3 rounded-sm border border-border" />
                <span className="h-3 w-3 rounded-sm border border-border" />
              </div>
              {brand}
              <div className="flex items-center justify-end gap-1">
                <span className="h-3 w-3 rounded-full border border-border" />
                <span className="h-3 w-3 rounded-sm border border-border" />
              </div>
            </div>
            <div className="hidden items-center justify-center gap-3 border-t border-border/70 py-1.5 text-[6px] font-bold text-muted sm:flex">
              <span>الرئيسية</span>
              <span>كل المنتجات</span>
              <span>الأقسام</span>
              <span>تواصل</span>
            </div>
          </>
        ) : (
          <div className="flex h-14 items-center justify-between gap-2 px-2.5">
            {brand}
            <div className="flex items-center gap-2 text-[6px] font-bold text-muted">
              <span>الرئيسية</span>
              <span>كل المنتجات</span>
              <span className="h-3 w-3 rounded-sm border border-border" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface">
        {config.showHero && (
          <div className="relative overflow-hidden bg-[#0d0d0d] text-white">
            <div className={`grid ${heroImage ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="flex flex-col justify-center px-3 py-5">
                <span className="text-[5px] font-bold uppercase tracking-[0.24em] text-primary">
                  {heroBadge}
                </span>
                <div
                  className="mt-1.5 line-clamp-2 text-base font-semibold leading-tight"
                  style={{ fontFamily: "var(--store-heading-font)" }}
                >
                  {heroTitle}
                </div>
                <p className="mt-1.5 line-clamp-2 text-[6px] leading-relaxed text-white/60">
                  {heroSubtitle}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span
                    className="bg-primary px-2.5 py-1 text-[6px] font-bold tracking-[0.1em] text-white"
                    style={{ borderRadius: "var(--store-btn-radius)" }}
                  >
                    تسوق الآن
                  </span>
                  <span
                    className="border border-white/25 px-2.5 py-1 text-[6px] font-bold tracking-[0.1em] text-white"
                    style={{ borderRadius: "var(--store-btn-radius)" }}
                  >
                    واتساب
                  </span>
                </div>
              </div>
              {heroImage && (
                <div className="relative min-h-28 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}
            </div>
          </div>
        )}

        {config.showTrust && (
          <div className="grid grid-cols-4 gap-1 border-b border-border bg-card px-2 py-2">
            {["شحن سريع", "دفع عند الاستلام", "استبدال سهل", "دعم واتساب"].map((item) => (
              <div key={item} className="flex items-center gap-1">
                <span className="grid h-3.5 w-3.5 shrink-0 place-items-center border border-primary/25 bg-primary/[0.06]">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                </span>
                <span className="truncate text-[5px] font-bold text-foreground">{item}</span>
              </div>
            ))}
          </div>
        )}

        {config.showCategories && (
          <div className="px-2.5 pt-4">
            <div className="text-[5px] font-bold uppercase tracking-[0.22em] text-primary">
              Collections
            </div>
            <div
              className="mt-0.5 text-[10px] font-semibold text-foreground"
              style={{ fontFamily: "var(--store-heading-font)" }}
            >
              تسوق حسب القسم
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {["أزياء", "أحذية", "إكسسوار", "عروض"].map((name) => (
                <div key={name} className="relative aspect-[4/5] overflow-hidden bg-card">
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${primary}33, ${primary}0a)` }}
                  />
                  <div className="absolute inset-x-0 bottom-1 text-center text-[5px] font-bold text-foreground">
                    {name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-2.5 pb-4 pt-4">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <div className="text-[5px] font-bold uppercase tracking-[0.22em] text-primary">
                The Edit
              </div>
              <div
                className="mt-0.5 text-[10px] font-semibold text-foreground"
                style={{ fontFamily: "var(--store-heading-font)" }}
              >
                كل منتجات المتجر
              </div>
            </div>
            <span className="border border-border px-1.5 py-0.5 text-[5px] font-bold text-muted">
              24 منتج
            </span>
          </div>

          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${config.gridCols}, minmax(0, 1fr))` }}
          >
            {products.map((_, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  config.cardStyle === "bordered"
                    ? "border border-border bg-card p-1"
                    : config.cardStyle === "elevated"
                      ? "border border-border bg-card p-1 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)]"
                      : ""
                }`}
                style={{ borderRadius: "var(--store-radius)" }}
              >
                <div
                  className="aspect-square overflow-hidden"
                  style={{
                    background:
                      index % 2 === 0
                        ? `linear-gradient(140deg, ${primary}26, ${primary}08)`
                        : `linear-gradient(140deg, ${primary}14, ${primary}05)`,
                    borderRadius: "var(--store-radius)",
                  }}
                />
                <div
                  className={`flex flex-1 flex-col pt-1.5 ${
                    config.productAlign === "center" ? "items-center text-center" : "items-start"
                  }`}
                >
                  <span className="line-clamp-2 min-h-[1.1rem] text-[6px] font-semibold leading-tight text-foreground">
                    منتج تجريبي {index + 1}
                  </span>
                  <span className="my-1 block h-px w-3 bg-primary/60" />
                  <span className="text-[6px] font-bold text-foreground">199 ج.م</span>
                  <span
                    className="mt-1 w-full border border-foreground/25 py-0.5 text-center text-[5px] font-bold text-foreground"
                    style={{ borderRadius: "var(--store-btn-radius)" }}
                  >
                    ضيف للسلة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {config.showWhy && (
          <div className="border-t border-border bg-surface px-2.5 py-3">
            <div className="text-[5px] font-bold uppercase tracking-[0.22em] text-primary">
              The Promise
            </div>
            <div
              className="mt-0.5 text-[9px] font-semibold text-foreground"
              style={{ fontFamily: "var(--store-heading-font)" }}
            >
              ليه تشتري مننا؟
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {["منتجات أصلية", "أسعار مناسبة", "خدمة سريعة"].map((item) => (
                <div key={item} className="border-t border-foreground/15 pt-1">
                  <div className="text-[7px] font-semibold text-primary/70">01</div>
                  <div className="mt-0.5 text-[5px] font-bold text-foreground">{item}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={
          config.footerStyle === "dark"
            ? "bg-[#0d0d0d] text-white"
            : "border-t border-border bg-card text-foreground"
        }
      >
        {config.showNewsletter && (
          <div
            className={`border-b px-2.5 py-3 ${
              config.footerStyle === "dark" ? "border-white/10" : "border-border"
            }`}
          >
            <div className="text-[5px] font-bold uppercase tracking-[0.22em] text-primary">
              Newsletter
            </div>
            <div
              className="mt-0.5 text-[9px] font-semibold"
              style={{ fontFamily: "var(--store-heading-font)" }}
            >
              كن أول من يعرف عن الجديد
            </div>
            <div className="mt-1.5 flex gap-1">
              <span
                className="bg-primary px-2 py-1 text-[5px] font-bold text-white"
                style={{ borderRadius: "var(--store-btn-radius)" }}
              >
                تواصل واتساب
              </span>
              <span
                className={`border px-2 py-1 text-[5px] font-bold ${
                  config.footerStyle === "dark"
                    ? "border-white/25 text-white"
                    : "border-border text-foreground"
                }`}
                style={{ borderRadius: "var(--store-btn-radius)" }}
              >
                كل المنتجات
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
          <span
            className={`text-[5px] ${
              config.footerStyle === "dark" ? "text-white/45" : "text-muted"
            }`}
          >
            © 2026 {store.name || "متجرك"} · جميع الحقوق محفوظة
          </span>
          <span className="text-[5px] font-bold text-primary">Bee Panal</span>
        </div>
      </div>
    </div>
  );
}

type DesignStore = {
  name: string;
  slug: string;
  description: string;
  logo: string;
  theme: string;
  themeColor: string;
  themeConfig: string;
  customDomain: string | null;
  customDomainStatus: string;
};

export default function DesignPage() {
  const params = useParams();
  const { storeId } = params as { storeId: string };

  const [store, setStore] = useState<DesignStore | null>(null);
  const [theme, setTheme] = useState("atelier");
  const [themeColor, setThemeColor] = useState("#b08d57");
  const [config, setConfig] = useState<StoreThemeConfig>(() => parseThemeConfig(null));
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.store) {
          setStore(data.store);
          setTheme(resolveThemeId(data.store.theme));
          setThemeColor(data.store.themeColor || getStoreTheme(data.store.theme).primary);
          setConfig(parseThemeConfig(data.store.themeConfig));
        }
      });
  }, [storeId]);

  const selected = useMemo(() => getStoreTheme(theme), [theme]);
  const fontHref = useMemo(() => storeFontHref(config), [config]);

  if (!store) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  function markDirty() {
    setUpdated(false);
  }

  function update<K extends keyof StoreThemeConfig>(key: K, value: StoreThemeConfig[K]) {
    setConfig((previous) => ({ ...previous, [key]: value }));
    markDirty();
  }

  function updateColor(key: ColorKey, value: string) {
    setConfig((previous) => ({
      ...previous,
      colors: { ...previous.colors, [key]: value || undefined },
    }));
    markDirty();
  }

  function selectTheme(next: StoreTheme) {
    setTheme(next.id);
    setThemeColor(next.primary);
    setConfig((previous) => ({
      ...previous,
      colors: {},
      radius: "",
      buttonRadius: "",
    }));
    markDirty();
  }

  function resetColors() {
    setConfig((previous) => ({ ...previous, colors: {} }));
    setThemeColor(selected.primary);
    markDirty();
  }

  function resetShape() {
    setConfig((previous) => ({ ...previous, radius: "", buttonRadius: "" }));
    markDirty();
  }

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload/image", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "فشل رفع صورة الهيرو");
        return;
      }
      update("heroImage", data.url);
    } catch {
      setError("فشل رفع الصورة، جرّب تاني.");
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setUpdated(false);
    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        theme,
        themeColor,
        themeConfig: config,
      };
      const response = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "فشل الحفظ");
      }
      setStore((previous) =>
        previous
          ? {
              ...previous,
              name: payload.name,
              description: payload.description,
              theme,
              themeColor,
              themeConfig: JSON.stringify(config),
            }
          : previous
      );
      setUpdated(true);
      setTimeout(() => setUpdated(false), 3000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "مش قادرين نحفظ التصميم.");
    } finally {
      setSaving(false);
    }
  }

  const effectiveColor = (key: ColorKey) =>
    config.colors[key] ||
    (key === "primary" ? themeColor : undefined) ||
    selected[key];

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {fontHref && <link rel="stylesheet" href={fontHref} />}

      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel={store.name}
        eyebrow="تصميم المتجر"
        title="خصص متجرك بالكامل"
        subtitle="ألوان، خطوط، شكل الهيدر والهيرو والمنتجات والفوتر — وشوف كل تعديل في المعاينة فورًا."
        icon={<Palette className="h-6 w-6" />}
        action={
          <a
            href={storePublicUrl(store.slug, store.customDomain, store.customDomainStatus)}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryBtn}
          >
            فتح المتجر
            <ArrowRight className="h-4 w-4" />
          </a>
        }
      />

      {updated && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <Check className="h-4 w-4" />
          تم حفظ التصميم ونشره على المتجر ✅
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            {/* Presets */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                    <Sparkles className="h-5 w-5 text-primary" />
                    ثيمات جاهزة
                  </h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    ابدأ بثيم جاهز وبعدها خصص كل تفصيلة تحت. اختيار ثيم جديد بيصفّر الألوان المخصصة.
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  {STORE_THEMES.length} ثيم
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {STORE_THEMES.map((item) => {
                  const active = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTheme(item)}
                      aria-pressed={active}
                      className={`group relative overflow-hidden rounded-2xl border p-3 text-start transition-all duration-300 ${
                        active
                          ? "border-primary bg-primary/[0.04] ring-2 ring-primary/25"
                          : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5"
                      }`}
                    >
                      <ThemePreviewCard theme={item} />
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-extrabold text-foreground">
                              {item.name}
                            </span>
                            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">
                              {item.tag}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{item.desc}</p>
                        </div>
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                            active
                              ? "border-primary bg-primary text-white"
                              : "border-border text-transparent"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {item.swatches.map((color) => (
                          <span
                            key={color}
                            className="h-1.5 w-6 rounded-full"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Colors */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                    <Palette className="h-5 w-5 text-primary" />
                    الألوان
                  </h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    غيّر لون واحد أو كل الألوان. اترك الحقل فارغًا لاستخدام لون الثيم.
                  </p>
                </div>
                <button type="button" onClick={resetColors} className={secondaryBtn}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  ألوان الثيم
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {COLOR_FIELDS.map((field) => (
                  <ColorField
                    key={field.key}
                    label={field.label}
                    value={config.colors[field.key]}
                    fallback={effectiveColor(field.key) || "#000000"}
                    onChange={(value) => updateColor(field.key, value)}
                  />
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[selected.primary, "#111111", "#b08d57", "#0f172a", "#0284c7", "#059669", "#ea580c", "#db2777", "#7c3aed"].map(
                  (color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setThemeColor(color);
                        updateColor("primary", "");
                      }}
                      aria-label={color}
                      title={color}
                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        effectiveColor("primary").toLowerCase() === color.toLowerCase()
                          ? "border-foreground"
                          : "border-white shadow-sm dark:border-zinc-800"
                      }`}
                      style={{ background: color }}
                    />
                  )
                )}
              </div>
            </section>

            {/* Typography */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                  <Type className="h-5 w-5 text-primary" />
                  الخطوط
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  خط النصوص وخط العناوين. الخطوط العربية تُحمّل تلقائيًا من Google Fonts.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>خط النصوص</label>
                  <select
                    value={config.font}
                    onChange={(event) => update("font", event.target.value as StoreThemeFont)}
                    className={inputClass}
                  >
                    {STORE_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div
                    className="mt-2 rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-foreground"
                    style={{ fontFamily: STORE_FONTS.find((font) => font.id === config.font)?.stack }}
                  >
                    متجرك بيبدأ من هنا — Aa 123
                  </div>
                </div>

                <div>
                  <label className={labelClass}>خط العناوين</label>
                  <select
                    value={config.headingFont}
                    onChange={(event) =>
                      update("headingFont", event.target.value as StoreThemeFont)
                    }
                    className={inputClass}
                  >
                    {STORE_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div
                    className="mt-2 rounded-xl border border-border bg-surface/50 px-3 py-2 text-base font-semibold text-foreground"
                    style={{
                      fontFamily: STORE_FONTS.find((font) => font.id === config.headingFont)?.stack,
                    }}
                  >
                    تشكيلة جديدة
                  </div>
                </div>
              </div>
            </section>

            {/* Shape */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    الاستدارة والزوايا
                  </h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    تحكم في استدارة الكروت والأزرار — من زوايا حادة تمامًا إلى دوائر كاملة.
                  </p>
                </div>
                <button type="button" onClick={resetShape} className={secondaryBtn}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  افتراضي الثيم
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>استدارة الكروت والأقسام</label>
                  <select
                    value={config.radius}
                    onChange={(event) => update("radius", event.target.value)}
                    className={inputClass}
                  >
                    {RADIUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>استدارة الأزرار</label>
                  <select
                    value={config.buttonRadius}
                    onChange={(event) => update("buttonRadius", event.target.value)}
                    className={inputClass}
                  >
                    {RADIUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Announcement + header */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                  <Megaphone className="h-5 w-5 text-primary" />
                  الشريط الإعلاني والهيدر
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  رسالة قصيرة أعلى الموقع، وشكل الهيدر وترتيب اللوجو والقائمة.
                </p>
              </div>

              <div className="space-y-4">
                <Switch
                  checked={config.announcementEnabled}
                  onChange={(value) => update("announcementEnabled", value)}
                  label="إظهار الشريط الإعلاني"
                  hint="الشريط الأسود أعلى الصفحة."
                />

                <div>
                  <label className={labelClass}>نص الشريط الإعلاني</label>
                  <input
                    value={config.announcement}
                    onChange={(event) => update("announcement", event.target.value.slice(0, 200))}
                    placeholder="مثال: شحن مجاني للطلبات فوق 1500 ج.م — الدفع عند الاستلام"
                    className={inputClass}
                    maxLength={200}
                  />
                  <p className="mt-1 text-[10px] text-muted">
                    سيبه فارغًا لاستخدام الرسالة الافتراضية للمتجر.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>شكل الهيدر</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChoiceCard
                      active={config.headerStyle === "centered"}
                      onClick={() => update("headerStyle", "centered")}
                      title="لوجو في المنتصف"
                      desc="الشعار في الوسط والقائمة تحته — الأقرب لهوية المتاجر الفاخرة."
                      preview={
                        <div className="mb-2 flex h-10 items-center justify-center rounded-lg border border-border bg-card text-[8px] font-bold text-muted">
                          <span className="h-3 w-10 rounded bg-primary/30" />
                        </div>
                      }
                    />
                    <ChoiceCard
                      active={config.headerStyle === "split"}
                      onClick={() => update("headerStyle", "split")}
                      title="لوجو على الجانب"
                      desc="الشعار يمين والقائمة بجانبه — عملي وواضح."
                      preview={
                        <div className="mb-2 flex h-10 items-center justify-between rounded-lg border border-border bg-card px-2 text-[8px] font-bold text-muted">
                          <span className="h-3 w-8 rounded bg-primary/30" />
                          <span className="h-1.5 w-10 rounded bg-border" />
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Hero */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                    <ImagePlus className="h-5 w-5 text-primary" />
                    الهيرو الرئيسي
                  </h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    أول انطباع للزائر: صورة كبيرة، عنوان قوي، وزر شراء واضح.
                  </p>
                </div>
                <Switch
                  checked={config.showHero}
                  onChange={(value) => update("showHero", value)}
                  label="إظهار الهيرو"
                />
              </div>

              <div className={`space-y-4 ${config.showHero ? "" : "pointer-events-none opacity-50"}`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>شارة صغيرة فوق العنوان</label>
                    <input
                      value={config.heroBadge}
                      onChange={(event) => update("heroBadge", event.target.value.slice(0, 60))}
                      placeholder="تشكيلة جديدة"
                      className={inputClass}
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>العنوان الرئيسي</label>
                    <input
                      value={config.heroTitle}
                      onChange={(event) => update("heroTitle", event.target.value.slice(0, 120))}
                      placeholder={store.name}
                      className={inputClass}
                      maxLength={120}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>الوصف تحت العنوان</label>
                  <textarea
                    value={config.heroSubtitle}
                    onChange={(event) =>
                      update("heroSubtitle", event.target.value.slice(0, 260))
                    }
                    rows={2}
                    placeholder={store.description || "تشكيلة مختارة بعناية…"}
                    className={inputClass}
                    maxLength={260}
                  />
                </div>

                <div>
                  <label className={labelClass}>صورة الهيرو</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={heroInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleHeroUpload(file);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => heroInputRef.current?.click()}
                      disabled={uploadingHero}
                      className={secondaryBtn}
                    >
                      {uploadingHero ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      {uploadingHero ? "بنرفع الصورة..." : config.heroImage ? "تغيير الصورة" : "رفع صورة"}
                    </button>
                    {config.heroImage && (
                      <>
                        <button
                          type="button"
                          onClick={() => update("heroImage", "")}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          <X className="h-3.5 w-3.5" />
                          إزالة
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.heroImage}
                          alt=""
                          className="h-11 w-16 rounded-lg border border-border object-cover"
                        />
                      </>
                    )}
                  </div>
                  <input
                    value={config.heroImage}
                    onChange={(event) => update("heroImage", event.target.value.slice(0, 600))}
                    placeholder="أو الصق رابط صورة مباشر https://…"
                    className={`${inputClass} mt-2 font-mono text-[11px]`}
                    dir="ltr"
                  />
                  <p className="mt-1 text-[10px] text-muted">
                    لو سبتها فاضية، المتجر هيستخدم أول صورة منتج تلقائيًا.
                  </p>
                </div>
              </div>
            </section>

            {/* Product layout */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  شبكة المنتجات
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  عدد الأعمدة، شكل الكارت، ومحاذاة النص والسعر.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>عدد الأعمدة على الشاشات الكبيرة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 3, 4] as const).map((cols) => (
                      <ChoiceCard
                        key={cols}
                        active={config.gridCols === cols}
                        onClick={() => update("gridCols", cols)}
                        title={`${cols} منتجات`}
                        preview={
                          <div
                            className="mb-2 grid gap-1"
                            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                          >
                            {Array.from({ length: cols }).map((_, index) => (
                              <span
                                key={index}
                                className="block h-6 rounded border border-border bg-surface"
                              />
                            ))}
                          </div>
                        }
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>شكل كارت المنتج</label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ChoiceCard
                      active={config.cardStyle === "minimal"}
                      onClick={() => update("cardStyle", "minimal")}
                      title="مينيمال"
                      desc="بدون إطار — الأنسب للمتاجر الفاخرة."
                      preview={<div className="mb-2 h-8 rounded bg-surface" />}
                    />
                    <ChoiceCard
                      active={config.cardStyle === "bordered"}
                      onClick={() => update("cardStyle", "bordered")}
                      title="بإطار"
                      desc="كارت بحدود واضحة وخلفية."
                      preview={
                        <div className="mb-2 h-8 rounded border border-border bg-surface" />
                      }
                    />
                    <ChoiceCard
                      active={config.cardStyle === "elevated"}
                      onClick={() => update("cardStyle", "elevated")}
                      title="بارز"
                      desc="ظل خفيف يعطي إحساس عمق."
                      preview={
                        <div className="mb-2 h-8 rounded border border-border bg-surface shadow-md" />
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>محاذاة محتوى الكارت</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChoiceCard
                      active={config.productAlign === "center"}
                      onClick={() => update("productAlign", "center")}
                      title="في المنتصف"
                      preview={
                        <div className="mb-2 flex flex-col items-center gap-1">
                          <span className="h-1.5 w-12 rounded bg-border" />
                          <span className="h-1.5 w-8 rounded bg-border" />
                        </div>
                      }
                    />
                    <ChoiceCard
                      active={config.productAlign === "start"}
                      onClick={() => update("productAlign", "start")}
                      title="على الجانب"
                      preview={
                        <div className="mb-2 flex flex-col items-start gap-1">
                          <span className="h-1.5 w-12 rounded bg-border" />
                          <span className="h-1.5 w-8 rounded bg-border" />
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Footer + sections */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                  <Megaphone className="h-5 w-5 text-primary" />
                  الفوتر والأقسام
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  تحكم في شكل الفوتر وإظهار أو إخفاء أقسام الصفحة الرئيسية.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>شكل الفوتر</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChoiceCard
                      active={config.footerStyle === "dark"}
                      onClick={() => update("footerStyle", "dark")}
                      title="داكن"
                      desc="أسود فاخر مع نص أبيض."
                      preview={<div className="mb-2 h-8 rounded bg-[#0d0d0d]" />}
                    />
                    <ChoiceCard
                      active={config.footerStyle === "light"}
                      onClick={() => update("footerStyle", "light")}
                      title="فاتح"
                      desc="خلفية بيضاء مع حدود."
                      preview={
                        <div className="mb-2 h-8 rounded border border-border bg-card" />
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Switch
                    checked={config.showCategories}
                    onChange={(value) => update("showCategories", value)}
                    label="قسم الأقسام"
                    hint="صور/بطاقات الأقسام أسفل الهيرو."
                  />
                  <Switch
                    checked={config.showTrust}
                    onChange={(value) => update("showTrust", value)}
                    label="شريط الثقة"
                    hint="شحن، دفع عند الاستلام، استبدال، دعم."
                  />
                  <Switch
                    checked={config.showWhy}
                    onChange={(value) => update("showWhy", value)}
                    label="قسم المزايا"
                    hint="ليه تشتري من المتجر + خطوات الطلب."
                  />
                  <Switch
                    checked={config.showNewsletter}
                    onChange={(value) => update("showNewsletter", value)}
                    label="نشرة الفوتر"
                    hint="دعوة التواصل/التسوق أعلى الفوتر."
                  />
                </div>
              </div>
            </section>

            {/* Store identity */}
            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-4 font-extrabold text-foreground">بيانات المتجر</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>اسم المتجر</label>
                  <input name="name" defaultValue={store.name} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>الوصف المختصر</label>
                  <input
                    name="description"
                    defaultValue={store.description}
                    className={inputClass}
                    maxLength={200}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Live preview */}
          <div className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-6">
              <section className={`${cardClass} p-4`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold text-foreground">معاينة حية</h2>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                    مباشر
                  </span>
                </div>
                <LivePreview
                  store={{ name: store.name, logo: store.logo, description: store.description }}
                  theme={selected}
                  themeColor={themeColor}
                  config={config}
                />
                <p className="mt-3 text-[10px] leading-relaxed text-muted">
                  المعاينة تقريبية — افتح المتجر بعد الحفظ لمشاهدة النتيجة النهائية.
                </p>
              </section>

              <section className={`${cardClass} p-4`}>
                <h3 className="text-xs font-extrabold text-foreground">ملخص التخصيص</h3>
                <dl className="mt-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">الثيم</dt>
                    <dd className="font-bold text-foreground">
                      {selected.name} <span className="font-mono text-[9px] text-muted">{selected.tag}</span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">اللون الأساسي</dt>
                    <dd className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-foreground">
                      <span
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ background: effectiveColor("primary") }}
                      />
                      {effectiveColor("primary")}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">الخط</dt>
                    <dd className="font-bold text-foreground">
                      {STORE_FONTS.find((font) => font.id === config.font)?.name.split(" — ")[0]}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">الشبكة</dt>
                    <dd className="font-bold text-foreground">{config.gridCols} أعمدة</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">الهيدر</dt>
                    <dd className="font-bold text-foreground">
                      {config.headerStyle === "centered" ? "لوجو في المنتصف" : "لوجو على الجانب"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">الفوتر</dt>
                    <dd className="font-bold text-foreground">
                      {config.footerStyle === "dark" ? "داكن" : "فاتح"}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-4 z-20 mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-xl shadow-black/5 backdrop-blur">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span
                className="h-7 w-7 rounded-full ring-2 ring-white shadow-sm dark:ring-zinc-800"
                style={{ background: effectiveColor("primary") }}
              />
              الثيم الحالي: <b className="text-foreground">{selected.name}</b>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                {selected.tag}
              </span>
            </div>
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "بنحفظ..." : "حفظ ونشر التصميم"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
