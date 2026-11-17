"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { secondaryBtn } from "@/lib/ui";

type ImportResult = {
  ok: boolean;
  title: string;
  message?: string;
  details?: string[];
};

const MAX_FILE_SIZE = 5_000_000;

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50";

function errorLines(data: any) {
  if (!Array.isArray(data?.errors)) return [];
  return data.errors.slice(0, 20).map((item: any) => {
    const message = String(item?.message || "خطأ غير معروف");
    return typeof item?.row === "number" && item.row > 0 ? `صف ${item.row}: ${message}` : message;
  });
}

export default function ProductImportButtons({ storeId }: { storeId: string }) {
  const router = useRouter();
  const jsonInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [busyFormat, setBusyFormat] = useState<"json" | "csv" | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function importFile(file: File, format: "json" | "csv") {
    if (file.size > MAX_FILE_SIZE) {
      setResult({
        ok: false,
        title: "الملف كبير جدًا",
        message: "الحد الأقصى لحجم ملف الاستيراد هو 5 ميجابايت.",
      });
      return;
    }

    setBusyFormat(format);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      let content = new TextDecoder("utf-8").decode(buffer);
      if (content.includes("\uFFFD")) {
        try {
          content = new TextDecoder("windows-1256").decode(buffer);
        } catch {
          // keep the UTF-8 result if the fallback decoder is unavailable
        }
      }

      const response = await fetch(`/api/stores/${storeId}/products/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, content }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setResult({
          ok: false,
          title: "تعذّر استيراد الملف",
          message: data?.error || "تأكد إن الملف بنفس صيغة التصدير وجرّب تاني.",
          details: errorLines(data),
        });
        return;
      }

      const parts: string[] = [];
      if (data.created) parts.push(`إضافة ${data.created} منتج`);
      if (data.updated) parts.push(`تحديث ${data.updated} منتج`);
      if (data.categoriesCreated) parts.push(`إنشاء ${data.categoriesCreated} قسم`);
      if (parts.length === 0) parts.push("تم حفظ المنتجات");

      const details = errorLines(data);
      setResult({
        ok: true,
        title: details.length > 0 ? "تم الاستيراد مع بعض الملاحظات" : "تم استيراد المنتجات بنجاح",
        message: `${parts.join(" · ")}.${data.errorCount > details.length ? ` عدد الملاحظات: ${data.errorCount}.` : ""}`,
        details: details.length > 0 ? details : undefined,
      });
      router.refresh();
    } catch {
      setResult({
        ok: false,
        title: "مشكلة في الاتصال",
        message: "مقدرناش نرفع الملف. جرّب تاني.",
      });
    } finally {
      setBusyFormat(null);
    }
  }

  function onPick(event: ChangeEvent<HTMLInputElement>, format: "json" | "csv") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importFile(file, format);
  }

  return (
    <>
      <input
        ref={jsonInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => onPick(event, "json")}
      />
      <input
        ref={csvInput}
        type="file"
        accept=".csv,text/csv,.txt"
        className="hidden"
        onChange={(event) => onPick(event, "csv")}
      />

      <button
        type="button"
        onClick={() => jsonInput.current?.click()}
        disabled={busyFormat !== null}
        title="استيراد منتجات من ملف JSON بنفس صيغة التصدير"
        className={buttonClass}
      >
        {busyFormat === "json" ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <FileJson className="h-4 w-4 text-primary" />
        )}
        استيراد JSON
      </button>
      <button
        type="button"
        onClick={() => csvInput.current?.click()}
        disabled={busyFormat !== null}
        title="استيراد منتجات من ملف Excel/CSV بنفس صيغة التصدير"
        className={buttonClass}
      >
        {busyFormat === "csv" ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        )}
        استيراد Excel
      </button>

      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setResult(null);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-start gap-3 border-b border-border p-5">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  result.ok
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {result.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-foreground">{result.title}</h3>
                {result.message && (
                  <p className="mt-1 text-xs leading-relaxed text-muted">{result.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                aria-label="إغلاق"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {result.details && result.details.length > 0 && (
              <div className="max-h-48 overflow-y-auto border-b border-border bg-surface/60 px-5 py-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  ملاحظات
                </div>
                <ul className="space-y-1 text-[11px] leading-relaxed text-muted">
                  {result.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end p-4">
              <button type="button" onClick={() => setResult(null)} className={secondaryBtn}>
                تمام
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
