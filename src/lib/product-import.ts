export type ImportedProduct = {
  row: number;
  id?: string;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  active: boolean;
  category: string;
  images: string[];
  options: string;
};

export type ImportIssue = { row: number; message: string };

export type ImportParseResult = {
  products: ImportedProduct[];
  errors: ImportIssue[];
};

export class ProductImportError extends Error {}

const MAX_PRODUCTS = 1000;
const MAX_IMAGES = 8;
const MAX_OPTIONS = 10;
const MAX_OPTION_VALUES = 30;
const OPTION_TYPES = new Set(["button", "color", "image"]);

type RawFields = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  comparePrice?: unknown;
  stock?: unknown;
  active?: unknown;
  category?: unknown;
  images?: unknown;
  options?: unknown;
};

type NormalizedOptionValue = { label: string; value: string; image?: string };
type NormalizedOption = {
  name: string;
  type: "button" | "color" | "image";
  values: NormalizedOptionValue[];
};

function toStringValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  let text = value.trim();
  if (!text) return null;
  text = text
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/٫/g, ".")
    .replace(/،/g, ",")
    .replace(/[^\d.,-]/g, "");
  if (!text || text === "-" || text === "." || text === ",") return null;

  if (text.includes(",") && !text.includes(".")) {
    const parts = text.split(",");
    if (parts.length > 2 && parts.slice(1).every((part) => part.length === 3)) {
      text = parts.join("");
    } else {
      text = parts.length === 2 && parts[1].length === 3 ? parts.join("") : parts.join(".");
    }
  } else {
    text = text.replace(/,/g, "");
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return toNumber(value);
}

function toInteger(value: unknown) {
  const number = toNumber(value);
  return number === null ? 0 : Math.max(0, Math.trunc(number));
}

function toActive(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = toStringValue(value).toLowerCase();
  if (!text) return true;
  return ![
    "مخفي",
    "hidden",
    "false",
    "0",
    "no",
    "غير نشط",
    "غير مفعل",
    "معطل",
    "متوقف",
    "inactive",
    "disabled",
  ].includes(text);
}

function toImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(toStringValue).filter(Boolean).slice(0, MAX_IMAGES);
  }

  const text = toStringValue(value);
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(toStringValue).filter(Boolean).slice(0, MAX_IMAGES);
      }
    } catch {
      // fall through to the delimiter parser
    }
  }

  return text
    .split(/\s*\|\s*|\r?\n/)
    .map((image) => image.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
}

function normalizeOptionsArray(value: unknown): NormalizedOption[] {
  if (!Array.isArray(value)) return [];

  const options: NormalizedOption[] = [];
  for (const rawOption of value.slice(0, MAX_OPTIONS)) {
    if (!rawOption || typeof rawOption !== "object") continue;
    const option = rawOption as Record<string, unknown>;
    const name = toStringValue(option.name);
    if (!name) continue;

    const rawType = toStringValue(option.type);
    const type = (OPTION_TYPES.has(rawType) ? rawType : "button") as NormalizedOption["type"];
    const rawValues = Array.isArray(option.values) ? option.values : [];
    const values: NormalizedOptionValue[] = [];

    for (const rawValue of rawValues.slice(0, MAX_OPTION_VALUES)) {
      if (typeof rawValue === "string") {
        const label = rawValue.trim();
        if (label) values.push({ label, value: label });
        continue;
      }
      if (!rawValue || typeof rawValue !== "object") continue;
      const item = rawValue as Record<string, unknown>;
      const label = toStringValue(item.label) || toStringValue(item.value);
      if (!label) continue;
      const value = toStringValue(item.value) || label;
      const image = toStringValue(item.image);
      values.push(image ? { label, value, image } : { label, value });
    }

    if (values.length > 0) options.push({ name, type, values });
  }

  return options;
}

function optionsFromText(text: string): NormalizedOption[] {
  const options: NormalizedOption[] = [];
  for (const group of text.split("|").slice(0, MAX_OPTIONS)) {
    const separatorIndex = group.search(/[:：]/);
    if (separatorIndex < 1) continue;
    const name = group.slice(0, separatorIndex).trim();
    const values = group
      .slice(separatorIndex + 1)
      .split("/")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, MAX_OPTION_VALUES)
      .map((label) => ({ label, value: label }));
    if (name && values.length > 0) options.push({ name, type: "button", values });
  }
  return options;
}

function toOptions(value: unknown): string {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return "[]";
    if (text.startsWith("[")) {
      try {
        return JSON.stringify(normalizeOptionsArray(JSON.parse(text)));
      } catch {
        return JSON.stringify(optionsFromText(text));
      }
    }
    return JSON.stringify(optionsFromText(text));
  }
  return JSON.stringify(normalizeOptionsArray(value));
}

function parseItem(fields: RawFields, row: number): { product?: ImportedProduct; error?: string } {
  const name = toStringValue(fields.name);
  if (!name) return { error: "اسم المنتج مطلوب" };

  const price = toNumber(fields.price);
  if (price === null || price < 0) return { error: "السعر غير صالح" };

  const comparePrice = toOptionalNumber(fields.comparePrice);
  const id = toStringValue(fields.id);

  return {
    product: {
      row,
      ...(id ? { id } : {}),
      name,
      description: toStringValue(fields.description),
      price,
      comparePrice: comparePrice !== null && comparePrice >= 0 ? comparePrice : null,
      stock: toInteger(fields.stock),
      active: toActive(fields.active),
      category: toStringValue(fields.category),
      images: toImages(fields.images),
      options: toOptions(fields.options),
    },
  };
}

export function parseJsonProducts(content: string): ImportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content.replace(/^\uFEFF/, ""));
  } catch {
    throw new ProductImportError("ملف JSON غير صالح. تأكد إنه متصدّر من Bee Panal أو مكتوب بصيغة صحيحة.");
  }

  let items: unknown[];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { products?: unknown }).products)) {
    items = (parsed as { products: unknown[] }).products;
  } else {
    throw new ProductImportError("ملف JSON لازم يحتوي على قائمة products.");
  }

  if (items.length > MAX_PRODUCTS) {
    throw new ProductImportError(`الحد الأقصى ${MAX_PRODUCTS} منتج في المرة الواحدة.`);
  }

  const products: ImportedProduct[] = [];
  const errors: ImportIssue[] = [];

  items.forEach((rawItem, index) => {
    const row = index + 1;
    if (!rawItem || typeof rawItem !== "object") {
      errors.push({ row, message: "بيانات المنتج غير صالحة" });
      return;
    }
    const item = rawItem as Record<string, unknown>;
    const rawCategory = item.category ?? item.categoryName;
    const category =
      rawCategory && typeof rawCategory === "object" && !Array.isArray(rawCategory)
        ? (rawCategory as Record<string, unknown>).name
        : rawCategory;
    const result = parseItem(
      {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        comparePrice: item.comparePrice,
        stock: item.stock,
        active: item.active,
        category,
        images: item.images,
        options: item.options,
      },
      row
    );
    if (result.product) products.push(result.product);
    else errors.push({ row, message: result.error || "بيانات المنتج غير صالحة" });
  });

  return { products, errors };
}

export function parseCsvRows(content: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const text = content.replace(/^\uFEFF/, "");

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function countOutsideQuotes(line: string, delimiter: string) {
  let count = 0;
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') index += 1;
      else inQuotes = !inQuotes;
    } else if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }
  return count;
}

function detectDelimiter(content: string) {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  let headerIndex = lines.findIndex((line) => line.trim() !== "");
  if (headerIndex < 0) return ",";
  if (/^sep=.$/i.test(lines[headerIndex].trim())) headerIndex += 1;
  const header = lines[headerIndex] || "";
  const comma = countOutsideQuotes(header, ",");
  const semicolon = countOutsideQuotes(header, ";");
  const tab = countOutsideQuotes(header, "\t");
  if (tab > comma && tab > semicolon) return "\t";
  if (semicolon > comma) return ";";
  return ",";
}

const HEADER_ALIASES: Record<string, keyof RawFields> = {
  الاسم: "name",
  name: "name",
  الوصف: "description",
  description: "description",
  السعر: "price",
  price: "price",
  "سعر قبل الخصم": "comparePrice",
  "السعر قبل الخصم": "comparePrice",
  "سعر مقارن": "comparePrice",
  "compare price": "comparePrice",
  "compare at price": "comparePrice",
  compareprice: "comparePrice",
  compare_price: "comparePrice",
  compare_at_price: "comparePrice",
  compare: "comparePrice",
  المخزون: "stock",
  الكمية: "stock",
  stock: "stock",
  quantity: "stock",
  القسم: "category",
  التصنيف: "category",
  category: "category",
  "category name": "category",
  الحالة: "active",
  active: "active",
  status: "active",
  الخيارات: "options",
  options: "options",
  الصورة: "images",
  صور: "images",
  "رابط الصورة": "images",
  image: "images",
  images: "images",
  "image url": "images",
  المعرف: "id",
  id: "id",
};

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseCsvProducts(content: string): ImportParseResult {
  const delimiter = detectDelimiter(content);
  const rows = parseCsvRows(content, delimiter);
  let headerIndex = rows.findIndex((row) => row.some((cell) => cell.trim() !== ""));
  if (headerIndex < 0) {
    throw new ProductImportError("ملف CSV فاضي. ضيف المنتجات ثم جرّب تاني.");
  }
  if (rows[headerIndex][0]?.trim().toLowerCase().startsWith("sep=")) {
    headerIndex = rows.findIndex(
      (row, index) => index > headerIndex && row.some((cell) => cell.trim() !== "")
    );
    if (headerIndex < 0) {
      throw new ProductImportError("ملف CSV فاضي. ضيف المنتجات ثم جرّب تاني.");
    }
  }

  const headers = rows[headerIndex].map(normalizeHeader);
  const headerMap = new Map<number, keyof RawFields>();
  headers.forEach((header, index) => {
    const key = HEADER_ALIASES[header];
    if (key && !Array.from(headerMap.values()).includes(key)) headerMap.set(index, key);
  });

  if (!Array.from(headerMap.values()).includes("name")) {
    throw new ProductImportError("ملف CSV لازم يحتوي على عمود الاسم.");
  }

  const products: ImportedProduct[] = [];
  const errors: ImportIssue[] = [];
  const dataRows = rows.slice(headerIndex + 1);

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    if (!row.some((cell) => cell.trim() !== "")) continue;
    if (products.length + errors.length >= MAX_PRODUCTS) {
      throw new ProductImportError(`الحد الأقصى ${MAX_PRODUCTS} منتج في المرة الواحدة.`);
    }

    const fields: RawFields = {};
    for (const [column, key] of headerMap) {
      fields[key] = row[column] ?? "";
    }

    const rowNumber = headerIndex + index + 2;
    const result = parseItem(fields, rowNumber);
    if (result.product) products.push(result.product);
    else errors.push({ row: rowNumber, message: result.error || "بيانات المنتج غير صالحة" });
  }

  return { products, errors };
}
