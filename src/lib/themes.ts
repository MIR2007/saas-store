export type StoreThemePattern = "none" | "dots" | "grid";

export type StoreTheme = {
  id: string;
  name: string;
  tag: string;
  desc: string;
  primary: string;
  primaryDark: string;
  surface: string;
  card: string;
  foreground: string;
  muted: string;
  border: string;
  radius: string;
  buttonRadius: string;
  pattern: StoreThemePattern;
  swatches: [string, string, string];
  dark?: boolean;
};

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "atelier",
    name: "أتيليه",
    tag: "ATELIER",
    desc: "أسود وأبيض وذهبي — طابع الأزياء الفاخرة",
    primary: "#b08d57",
    primaryDark: "#8f6f3f",
    surface: "#f7f6f3",
    card: "#ffffff",
    foreground: "#111111",
    muted: "#6b6b6b",
    border: "#e8e5df",
    radius: "0",
    buttonRadius: "0",
    pattern: "none",
    swatches: ["#b08d57", "#111111", "#f7f6f3"],
  },
  {
    id: "aura",
    name: "أورا",
    tag: "AURA",
    desc: "دافئ ونظيف — يناسب أي نشاط",
    primary: "#d97706",
    primaryDark: "#b45309",
    surface: "#faf7f2",
    card: "#ffffff",
    foreground: "#1c1917",
    muted: "#78716c",
    border: "#eee7dc",
    radius: "1rem",
    buttonRadius: "0.75rem",
    pattern: "dots",
    swatches: ["#d97706", "#f59e0b", "#faf7f2"],
  },
  {
    id: "noir",
    name: "نوار",
    tag: "NOIR",
    desc: "أسود وذهبي بلمسة فاخرة",
    primary: "#d4af37",
    primaryDark: "#a8862a",
    surface: "#09090b",
    card: "#141416",
    foreground: "#fafafa",
    muted: "#a1a1aa",
    border: "#27272a",
    radius: "0.5rem",
    buttonRadius: "0.375rem",
    pattern: "none",
    swatches: ["#d4af37", "#141416", "#fafafa"],
    dark: true,
  },
  {
    id: "bloom",
    name: "بلوم",
    tag: "BLOOM",
    desc: "وردي ناعم لمتاجر التجميل والأزياء",
    primary: "#db2777",
    primaryDark: "#be185d",
    surface: "#fdf2f8",
    card: "#ffffff",
    foreground: "#500724",
    muted: "#9d6b85",
    border: "#fce7f3",
    radius: "1.75rem",
    buttonRadius: "9999px",
    pattern: "dots",
    swatches: ["#db2777", "#f472b6", "#fdf2f8"],
  },
  {
    id: "ocean",
    name: "أوشن",
    tag: "OCEAN",
    desc: "أزرق منعش للإلكترونيات والتقنية",
    primary: "#0284c7",
    primaryDark: "#0369a1",
    surface: "#f0f9ff",
    card: "#ffffff",
    foreground: "#082f49",
    muted: "#64748b",
    border: "#e0f2fe",
    radius: "1.25rem",
    buttonRadius: "0.75rem",
    pattern: "grid",
    swatches: ["#0284c7", "#38bdf8", "#f0f9ff"],
  },
  {
    id: "forest",
    name: "فورست",
    tag: "FOREST",
    desc: "أخضر طبيعي للمنتجات العضوية",
    primary: "#059669",
    primaryDark: "#047857",
    surface: "#f0fdf4",
    card: "#ffffff",
    foreground: "#052e16",
    muted: "#6b7280",
    border: "#dcfce7",
    radius: "1rem",
    buttonRadius: "9999px",
    pattern: "dots",
    swatches: ["#059669", "#34d399", "#f0fdf4"],
  },
  {
    id: "sunset",
    name: "صن ست",
    tag: "SUNSET",
    desc: "برتقالي دافئ للمطاعم والعروض",
    primary: "#ea580c",
    primaryDark: "#c2410c",
    surface: "#fff7ed",
    card: "#ffffff",
    foreground: "#431407",
    muted: "#9a6a4f",
    border: "#ffedd5",
    radius: "1.5rem",
    buttonRadius: "9999px",
    pattern: "none",
    swatches: ["#ea580c", "#fb923c", "#fff7ed"],
  },
  {
    id: "mono",
    name: "مونو",
    tag: "MONO",
    desc: "أبيض وأسود بصرامة مينيمال",
    primary: "#18181b",
    primaryDark: "#000000",
    surface: "#fafafa",
    card: "#ffffff",
    foreground: "#09090b",
    muted: "#71717a",
    border: "#e4e4e7",
    radius: "0.25rem",
    buttonRadius: "0.25rem",
    pattern: "grid",
    swatches: ["#18181b", "#a1a1aa", "#fafafa"],
  },
  {
    id: "lavender",
    name: "لافندر",
    tag: "LAVENDER",
    desc: "بنفسجي هادئ للعطور والهدايا",
    primary: "#7c3aed",
    primaryDark: "#6d28d9",
    surface: "#f5f3ff",
    card: "#ffffff",
    foreground: "#2e1065",
    muted: "#7c6f9b",
    border: "#ede9fe",
    radius: "1.75rem",
    buttonRadius: "1rem",
    pattern: "dots",
    swatches: ["#7c3aed", "#a78bfa", "#f5f3ff"],
  },
  {
    id: "sand",
    name: "ساند",
    tag: "SAND",
    desc: "بيج رملي للأثاث والديكور",
    primary: "#b45309",
    primaryDark: "#92400e",
    surface: "#fdf8f3",
    card: "#fffdfa",
    foreground: "#292018",
    muted: "#8a7666",
    border: "#efe3d3",
    radius: "0.75rem",
    buttonRadius: "0.5rem",
    pattern: "none",
    swatches: ["#b45309", "#d6b48c", "#fdf8f3"],
  },
  {
    id: "midnight",
    name: "ميدنايت",
    tag: "MIDNIGHT",
    desc: "أزرق ليلي داكن بطابع تقني",
    primary: "#38bdf8",
    primaryDark: "#0ea5e9",
    surface: "#020617",
    card: "#0f172a",
    foreground: "#f8fafc",
    muted: "#94a3b8",
    border: "#1e293b",
    radius: "1rem",
    buttonRadius: "0.75rem",
    pattern: "grid",
    swatches: ["#38bdf8", "#0f172a", "#f8fafc"],
    dark: true,
  },
  {
    id: "coral",
    name: "كورال",
    tag: "CORAL",
    desc: "مرجاني حيوي للأطفال والهدايا",
    primary: "#f43f5e",
    primaryDark: "#e11d48",
    surface: "#fff1f2",
    card: "#ffffff",
    foreground: "#4c0519",
    muted: "#9f6b76",
    border: "#ffe4e6",
    radius: "1.5rem",
    buttonRadius: "9999px",
    pattern: "dots",
    swatches: ["#f43f5e", "#fb7185", "#fff1f2"],
  },
  {
    id: "mint",
    name: "مينت",
    tag: "MINT",
    desc: "نعناعي منعش للصحة والجمال",
    primary: "#0d9488",
    primaryDark: "#0f766e",
    surface: "#f0fdfa",
    card: "#ffffff",
    foreground: "#042f2e",
    muted: "#5f8a84",
    border: "#ccfbf1",
    radius: "1.25rem",
    buttonRadius: "9999px",
    pattern: "grid",
    swatches: ["#0d9488", "#2dd4bf", "#f0fdfa"],
  },
];

export const DEFAULT_STORE_THEME = "atelier";
export const DEFAULT_STORE_COLOR = "#b08d57";

const LEGACY_THEMES: Record<string, string> = {
  modern: "aura",
  fashion: "bloom",
  electronics: "ocean",
  food: "sunset",
  beauty: "lavender",
  furniture: "sand",
  sports: "forest",
  kids: "coral",
};

export function resolveThemeId(id?: string | null) {
  if (!id) return DEFAULT_STORE_THEME;
  if (STORE_THEMES.some((theme) => theme.id === id)) return id;
  return LEGACY_THEMES[id] || DEFAULT_STORE_THEME;
}

export function getStoreTheme(id?: string | null) {
  const resolved = resolveThemeId(id);
  return STORE_THEMES.find((theme) => theme.id === resolved) || STORE_THEMES[0];
}

export type StoreThemeFont = "tajawal" | "cairo" | "almarai" | "rubik" | "jost" | "cormorant";

export type StoreThemeColors = {
  primary?: string;
  primaryDark?: string;
  surface?: string;
  card?: string;
  foreground?: string;
  muted?: string;
  border?: string;
};

export type StoreThemeConfig = {
  headerStyle: "centered" | "split";
  cardStyle: "minimal" | "bordered" | "elevated";
  productAlign: "center" | "start";
  gridCols: 2 | 3 | 4;
  footerStyle: "dark" | "light";
  showHero: boolean;
  showCategories: boolean;
  showTrust: boolean;
  showWhy: boolean;
  showNewsletter: boolean;
  announcementEnabled: boolean;
  announcement: string;
  font: StoreThemeFont;
  headingFont: StoreThemeFont;
  radius: string;
  buttonRadius: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroImage: string;
  colors: StoreThemeColors;
};

export const DEFAULT_THEME_CONFIG: StoreThemeConfig = {
  headerStyle: "centered",
  cardStyle: "minimal",
  productAlign: "center",
  gridCols: 4,
  footerStyle: "dark",
  showHero: true,
  showCategories: true,
  showTrust: true,
  showWhy: true,
  showNewsletter: true,
  announcementEnabled: true,
  announcement: "",
  font: "tajawal",
  headingFont: "tajawal",
  radius: "",
  buttonRadius: "",
  heroTitle: "",
  heroSubtitle: "",
  heroBadge: "",
  heroImage: "",
  colors: {},
};

export const STORE_FONTS: {
  id: StoreThemeFont;
  name: string;
  hint: string;
  google?: string;
  stack: string;
}[] = [
  {
    id: "tajawal",
    name: "Tajawal — تجوال",
    hint: "خط المنصة الافتراضي",
    stack: "var(--font-tajawal), Arial, sans-serif",
  },
  {
    id: "cairo",
    name: "Cairo — القاهرة",
    hint: "عربي عصري وواضح",
    google: "Cairo:wght@400;500;600;700;800",
    stack: "'Cairo', var(--font-tajawal), sans-serif",
  },
  {
    id: "almarai",
    name: "Almarai — المراعي",
    hint: "عربي أنيق للمتاجر الراقية",
    google: "Almarai:wght@400;700;800",
    stack: "'Almarai', var(--font-tajawal), sans-serif",
  },
  {
    id: "rubik",
    name: "Rubik — روبيك",
    hint: "عربي حديث بشخصية قوية",
    google: "Rubik:wght@400;500;600;700",
    stack: "'Rubik', var(--font-tajawal), sans-serif",
  },
  {
    id: "jost",
    name: "Jost — لاتيني",
    hint: "للعناوين والأرقام اللاتينية",
    google: "Jost:wght@400;500;600;700",
    stack: "'Jost', var(--font-tajawal), sans-serif",
  },
  {
    id: "cormorant",
    name: "Cormorant — لاتيني فاخر",
    hint: "لمسة إيديتوريال للعلامات الفاخرة",
    google: "Cormorant+Garamond:wght@500;600;700",
    stack: "'Cormorant Garamond', var(--font-tajawal), serif",
  },
];

function normalizeHex(value?: string | null) {
  if (!value) return null;
  const hex = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(hex) || /^#[0-9a-fA-F]{3}$/.test(hex) ? hex : null;
}

const RADIUS_VALUES = new Set([
  "",
  "0",
  "0.125rem",
  "0.25rem",
  "0.375rem",
  "0.5rem",
  "0.75rem",
  "1rem",
  "1.25rem",
  "1.5rem",
  "1.75rem",
  "2rem",
  "2.5rem",
  "9999px",
]);

function normalizeRadius(value: unknown) {
  return typeof value === "string" && RADIUS_VALUES.has(value) ? value : "";
}

function isFont(value: unknown): value is StoreThemeFont {
  return STORE_FONTS.some((font) => font.id === value);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function parseThemeConfig(
  raw?: string | StoreThemeConfig | null
): StoreThemeConfig {
  let parsed: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      const value = JSON.parse(raw || "{}");
      if (value && typeof value === "object" && !Array.isArray(value)) {
        parsed = value as Record<string, unknown>;
      }
    } catch {
      parsed = {};
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw as Record<string, unknown>;
  }

  const rawColors =
    parsed.colors && typeof parsed.colors === "object" && !Array.isArray(parsed.colors)
      ? (parsed.colors as Record<string, unknown>)
      : {};
  const colors: StoreThemeColors = {};
  for (const key of [
    "primary",
    "primaryDark",
    "surface",
    "card",
    "foreground",
    "muted",
    "border",
  ] as const) {
    const hex = normalizeHex(typeof rawColors[key] === "string" ? rawColors[key] : null);
    if (hex) colors[key] = hex;
  }

  return {
    headerStyle: parsed.headerStyle === "split" ? "split" : "centered",
    cardStyle:
      parsed.cardStyle === "bordered" || parsed.cardStyle === "elevated"
        ? parsed.cardStyle
        : "minimal",
    productAlign: parsed.productAlign === "start" ? "start" : "center",
    gridCols: parsed.gridCols === 2 || parsed.gridCols === 3 ? parsed.gridCols : 4,
    footerStyle: parsed.footerStyle === "light" ? "light" : "dark",
    showHero: parsed.showHero !== false,
    showCategories: parsed.showCategories !== false,
    showTrust: parsed.showTrust !== false,
    showWhy: parsed.showWhy !== false,
    showNewsletter: parsed.showNewsletter !== false,
    announcementEnabled: parsed.announcementEnabled !== false,
    announcement: text(parsed.announcement, 200),
    font: isFont(parsed.font) ? parsed.font : DEFAULT_THEME_CONFIG.font,
    headingFont: isFont(parsed.headingFont)
      ? parsed.headingFont
      : DEFAULT_THEME_CONFIG.headingFont,
    radius: normalizeRadius(parsed.radius),
    buttonRadius: normalizeRadius(parsed.buttonRadius),
    heroTitle: text(parsed.heroTitle, 120),
    heroSubtitle: text(parsed.heroSubtitle, 260),
    heroBadge: text(parsed.heroBadge, 60),
    heroImage: text(parsed.heroImage, 600),
    colors,
  };
}

export function fontStack(id?: string | null) {
  const font = STORE_FONTS.find((item) => item.id === id) || STORE_FONTS[0];
  return font.stack;
}

/** Google Fonts stylesheet for the selected store fonts (empty when unnecessary). */
export function storeFontHref(config: StoreThemeConfig) {
  const families = new Set<string>();
  for (const id of [config.font, config.headingFont]) {
    const font = STORE_FONTS.find((item) => item.id === id);
    if (font?.google) families.add(font.google);
  }
  if (families.size === 0) return "";
  return `https://fonts.googleapis.com/css2?${Array.from(families)
    .map((family) => `family=${family}`)
    .join("&")}&display=swap`;
}

function shade(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;
  const num = parseInt(full, 16);
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value * (1 - amount))))
      .toString(16)
      .padStart(2, "0");
  return `#${channel((num >> 16) & 255)}${channel((num >> 8) & 255)}${channel(num & 255)}`;
}

/** CSS variables that re-skin the whole storefront for the chosen theme. */
export function storeThemeVars(
  themeId?: string | null,
  themeColor?: string | null,
  rawConfig?: string | StoreThemeConfig | null
): Record<string, string> {
  const theme = getStoreTheme(themeId);
  const config = parseThemeConfig(rawConfig);
  const custom = normalizeHex(themeColor);
  const colors = config.colors;
  const primary = colors.primary || custom || theme.primary;
  const primaryDark =
    colors.primaryDark ||
    (primary.toLowerCase() === theme.primary.toLowerCase()
      ? theme.primaryDark
      : shade(primary, 0.16));

  return {
    "--primary": primary,
    "--primary-dark": primaryDark,
    "--surface": colors.surface || theme.surface,
    "--card": colors.card || theme.card,
    "--foreground": colors.foreground || theme.foreground,
    "--muted": colors.muted || theme.muted,
    "--border": colors.border || theme.border,
    "--store-radius": config.radius || theme.radius,
    "--store-btn-radius": config.buttonRadius || theme.buttonRadius,
    "--store-font": fontStack(config.font),
    "--store-heading-font": fontStack(config.headingFont),
  };
}

export function storeGridClass(cols: StoreThemeConfig["gridCols"]) {
  if (cols === 2) return "grid-cols-2";
  if (cols === 3) return "grid-cols-2 md:grid-cols-3";
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
}
