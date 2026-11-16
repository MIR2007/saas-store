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
  if (!id) return "aura";
  if (STORE_THEMES.some((theme) => theme.id === id)) return id;
  return LEGACY_THEMES[id] || "aura";
}

export function getStoreTheme(id?: string | null) {
  const resolved = resolveThemeId(id);
  return STORE_THEMES.find((theme) => theme.id === resolved) || STORE_THEMES[0];
}

function normalizeHex(value?: string | null) {
  if (!value) return null;
  const hex = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(hex) || /^#[0-9a-fA-F]{3}$/.test(hex) ? hex : null;
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
  themeColor?: string | null
): Record<string, string> {
  const theme = getStoreTheme(themeId);
  const custom = normalizeHex(themeColor);
  const primary = custom || theme.primary;
  const primaryDark =
    primary.toLowerCase() === theme.primary.toLowerCase()
      ? theme.primaryDark
      : shade(primary, 0.16);

  return {
    "--primary": primary,
    "--primary-dark": primaryDark,
    "--surface": theme.surface,
    "--card": theme.card,
    "--foreground": theme.foreground,
    "--muted": theme.muted,
    "--border": theme.border,
    "--store-radius": theme.radius,
    "--store-btn-radius": theme.buttonRadius,
  };
}
