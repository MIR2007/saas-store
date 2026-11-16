"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Check, Loader2, Palette, Save, Sparkles } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";
import { storePublicUrl } from "@/lib/domains";
import {
  getStoreTheme,
  resolveThemeId,
  STORE_THEMES,
  type StoreTheme,
} from "@/lib/themes";

function ThemePreview({ theme }: { theme: StoreTheme }) {
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
            <span
              className="h-1.5 w-6 rounded-full"
              style={{ background: theme.primary }}
            />
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

export default function DesignPage() {
  const params = useParams();
  const { storeId } = params as { storeId: string };

  const [store, setStore] = useState<any>(null);
  const [theme, setTheme] = useState("aura");
  const [themeColor, setThemeColor] = useState("#d97706");
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.store) {
          setStore(data.store);
          setTheme(resolveThemeId(data.store.theme));
          setThemeColor(
            data.store.themeColor || getStoreTheme(data.store.theme).primary
          );
        }
      });
  }, [storeId]);

  if (!store) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  const selected = getStoreTheme(theme);
  const initial = store.name.trim().charAt(0) || "B";

  function selectTheme(next: StoreTheme) {
    setTheme(next.id);
    setThemeColor(next.primary);
    setUpdated(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setUpdated(false);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          theme,
          themeColor,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل الحفظ");
      }
      setUpdated(true);
      setTimeout(() => setUpdated(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "مش قادرين نحفظ التصميم.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${storeId}`}
        backLabel={store.name}
        eyebrow="تصميم المتجر"
        title="شكل متجرك على الإنترنت"
        subtitle="اختار من ثيمات 2026 الحديثة، وضبط لون علامتك التجارية."
        icon={<Palette className="h-6 w-6" />}
        action={
          <a
            href={storePublicUrl(store.slug, store.customDomain)}
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
          تم حفظ التصميم بنجاح ✅
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme library */}
        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-extrabold text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                ثيمات 2026
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {STORE_THEMES.length} ثيم عصري بأسماء مميزة — كل ثيم بيغيّر الألوان والزوايا وشكل المتجر كامل.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              {STORE_THEMES.length} ثيم
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {STORE_THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTheme(t)}
                  aria-pressed={active}
                  className={`group relative overflow-hidden rounded-2xl border p-3 text-start transition-all duration-300 ${
                    active
                      ? "border-primary bg-primary/[0.04] ring-2 ring-primary/25"
                      : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5"
                  }`}
                >
                  <ThemePreview theme={t} />
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-extrabold text-foreground">
                          {t.name}
                        </span>
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">
                          {t.tag}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                        {t.desc}
                      </p>
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
                    {t.swatches.map((color) => (
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

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Basic info */}
          <div className="space-y-4 lg:col-span-4">
            <section className={`${cardClass} p-5`}>
              <h2 className="mb-4 font-extrabold text-foreground">بيانات المتجر</h2>
              <div className="space-y-3">
                <label className={labelClass}>اسم المتجر</label>
                <input
                  defaultValue={store.name}
                  name="name"
                  required
                  className={inputClass}
                />
                <label className={labelClass}>الوصف المختصر</label>
                <textarea
                  defaultValue={store.description}
                  name="description"
                  rows={3}
                  className={inputClass}
                />
              </div>
            </section>
          </div>

          {/* Color */}
          <div className="space-y-4 lg:col-span-4">
            <section className={`${cardClass} p-5`}>
              <h2 className="mb-4 font-extrabold text-foreground">اللون الأساسي</h2>
              <label className={labelClass}>لون العلامة التجارية</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-transparent p-1"
                  aria-label="لون العلامة التجارية"
                />
                <input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className={`${inputClass} font-mono`}
                  dir="ltr"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[selected.primary, "#0f172a", "#0284c7", "#059669", "#ea580c", "#db2777", "#7c3aed", "#b45309"].map(
                  (color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setThemeColor(color)}
                      aria-label={color}
                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        themeColor.toLowerCase() === color.toLowerCase()
                          ? "border-foreground"
                          : "border-white shadow-sm dark:border-zinc-800"
                      }`}
                      style={{ background: color }}
                    />
                  )
                )}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                اختيار الثيم بيحدّث اللون تلقائيًا، وتقدر تخصص اللون بعدها.
              </p>
            </section>
          </div>

          {/* Live preview */}
          <div className="space-y-4 lg:col-span-4">
            <section className={`${cardClass} p-5`}>
              <h2 className="mb-4 font-extrabold text-foreground">معاينة حية</h2>
              <div
                className="overflow-hidden border"
                style={{
                  background: selected.surface,
                  borderColor: selected.border,
                  borderRadius: selected.radius,
                }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2.5"
                  style={{
                    background: selected.card,
                    borderBottom: `1px solid ${selected.border}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-7 w-7 place-items-center text-[11px] font-black text-white"
                      style={{
                        background: themeColor,
                        borderRadius: selected.buttonRadius,
                      }}
                    >
                      {initial}
                    </span>
                    <span
                      className="text-[11px] font-extrabold"
                      style={{ color: selected.foreground }}
                    >
                      {store.name}
                    </span>
                  </div>
                  <span
                    className="px-2 py-1 text-[9px] font-bold text-white"
                    style={{
                      background: themeColor,
                      borderRadius: selected.buttonRadius,
                    }}
                  >
                    السلة
                  </span>
                </div>
                <div className="p-3">
                  <div
                    className="p-3"
                    style={{
                      background: selected.card,
                      border: `1px solid ${selected.border}`,
                      borderRadius: selected.radius,
                    }}
                  >
                    <div
                      className="h-16 w-full"
                      style={{
                        background: `linear-gradient(135deg, ${themeColor}, ${selected.primaryDark})`,
                        borderRadius: selected.radius,
                      }}
                    />
                    <div
                      className="mt-2 h-2 w-2/3 rounded-full"
                      style={{ background: selected.foreground, opacity: 0.5 }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className="text-xs font-extrabold"
                        style={{ color: themeColor }}
                      >
                        199 ج.م
                      </span>
                      <span
                        className="px-3 py-1.5 text-[10px] font-bold text-white"
                        style={{
                          background: themeColor,
                          borderRadius: selected.buttonRadius,
                        }}
                      >
                        ضيف للسلة
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-foreground">
                  {selected.name}
                  <span className="ms-1.5 font-mono text-[9px] text-muted">
                    {selected.tag}
                  </span>
                </span>
                <span className="text-[10px] text-muted">معاينة تقريبية</span>
              </div>
            </section>
          </div>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-4 z-20">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-xl shadow-black/5 backdrop-blur">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span
                className="h-7 w-7 rounded-full ring-2 ring-white shadow-sm dark:ring-zinc-800"
                style={{ background: themeColor }}
              />
              الثيم الحالي:{" "}
              <b className="text-foreground">{selected.name}</b>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                {selected.tag}
              </span>
            </div>
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "بنحفظ..." : "حفظ التصميم"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
