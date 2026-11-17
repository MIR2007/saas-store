"use client";

import { FileJson, FileSpreadsheet } from "lucide-react";

export type ExportProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  active: boolean;
  shippingPrice: number;
  category: string;
  images: string[];
  options: { name: string; type: string; values: { label: string; value: string; image?: string }[] }[];
};

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number | boolean) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ProductExportButtons({
  products,
  storeName,
}: {
  products: ExportProduct[];
  storeName: string;
}) {
  function exportJson() {
    const payload = {
      store: storeName,
      exportedAt: new Date().toISOString(),
      count: products.length,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        active: product.active,
        shippingPrice: product.shippingPrice,
        category: product.category,
        images: product.images,
        options: product.options,
      })),
    };
    download(
      `${storeName}-products.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
  }

  function exportExcel() {
    const header = [
      "الاسم",
      "الوصف",
      "السعر",
      "سعر قبل الخصم",
      "المخزون",
      "القسم",
      "سعر الشحن",
      "الحالة",
      "الخيارات",
      "الصورة",
    ];
    const rows = products.map((product) => [
      product.name,
      product.description,
      product.price,
      product.comparePrice ?? "",
      product.stock,
      product.category,
      product.shippingPrice,
      product.active ? "نشط" : "مخفي",
      product.options
        .map((option) => `${option.name}: ${option.values.map((value) => value.label).join(" / ")}`)
        .join(" | "),
      product.images[0] || "",
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    download(
      `${storeName}-products.csv`,
      `\uFEFF${csv}`,
      "text/csv;charset=utf-8"
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={exportJson}
        disabled={products.length === 0}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-surface disabled:opacity-50"
      >
        <FileJson className="h-4 w-4 text-primary" />
        تصدير JSON
      </button>
      <button
        type="button"
        onClick={exportExcel}
        disabled={products.length === 0}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-surface disabled:opacity-50"
      >
        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        تصدير Excel
      </button>
    </div>
  );
}
