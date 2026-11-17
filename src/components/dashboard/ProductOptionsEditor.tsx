"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { inputClass, labelClass } from "@/lib/ui";

export type ProductOptionValue = { label: string; value: string; image?: string };
export type ProductOption = {
  name: string;
  type: "color" | "image" | "button";
  values: ProductOptionValue[];
};

const OPTION_TYPES = [
  { id: "button", label: "أزرار نصية", hint: "مثال: مقاس S / M / L" },
  { id: "color", label: "ألوان", hint: "مثال: أحمر / أزرق / أسود" },
  { id: "image", label: "صور", hint: "مثال: صورة لكل لون أو نقشة" },
] as const;

function newValue(type: ProductOption["type"]): ProductOptionValue {
  return { label: "", value: type === "color" ? "#d97706" : "", image: "" };
}

function ValueImage({
  value,
  onChange,
}: {
  value: ProductOptionValue;
  onChange: (patch: Partial<ProductOptionValue>) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      if (value.image) body.append("previousUrl", value.image);
      const res = await fetch("/api/upload/image", { method: "POST", body });
      const data = await res.json();
      if (res.ok && data.url) onChange({ image: data.url, value: data.url });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-surface text-muted transition-colors hover:border-primary/40 hover:text-primary"
        title="رفع صورة الخيار"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : value.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      {value.image && (
        <button
          type="button"
          onClick={() => onChange({ image: "", value: "" })}
          className="text-[10px] font-bold text-rose-600 hover:underline dark:text-rose-400"
        >
          إزالة
        </button>
      )}
    </div>
  );
}

export default function ProductOptionsEditor({
  options,
  onChange,
}: {
  options: ProductOption[];
  onChange: (options: ProductOption[]) => void;
}) {
  function updateOption(index: number, patch: Partial<ProductOption>) {
    onChange(options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  }

  function updateValue(optionIndex: number, valueIndex: number, patch: Partial<ProductOptionValue>) {
    onChange(
      options.map((option, i) =>
        i === optionIndex
          ? {
              ...option,
              values: option.values.map((value, j) => (j === valueIndex ? { ...value, ...patch } : value)),
            }
          : option
      )
    );
  }

  function addOption() {
    onChange([...options, { name: "", type: "button", values: [newValue("button")] }]);
  }

  return (
    <div className="space-y-3">
      {options.map((option, optionIndex) => (
        <div key={optionIndex} className="rounded-2xl border border-border bg-surface/50 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className={labelClass}>اسم الخيار</label>
              <input
                value={option.name}
                onChange={(e) => updateOption(optionIndex, { name: e.target.value })}
                placeholder="مثال: اللون"
                className={inputClass}
              />
            </div>
            <div className="w-40">
              <label className={labelClass}>نوع الخيار</label>
              <select
                value={option.type}
                onChange={(e) => {
                  const type = e.target.value as ProductOption["type"];
                  updateOption(optionIndex, {
                    type,
                    values: option.values.length ? option.values : [newValue(type)],
                  });
                }}
                className={inputClass}
              >
                {OPTION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => onChange(options.filter((_, i) => i !== optionIndex))}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              title="حذف الخيار"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {option.values.map((value, valueIndex) => (
              <div key={valueIndex} className="flex flex-wrap items-center gap-2">
                {option.type === "color" && (
                  <input
                    type="color"
                    value={value.value || "#d97706"}
                    onChange={(e) =>
                      updateValue(optionIndex, valueIndex, { value: e.target.value })
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-card p-1"
                    aria-label="لون الخيار"
                  />
                )}
                {option.type === "image" && (
                  <ValueImage
                    value={value}
                    onChange={(patch) => updateValue(optionIndex, valueIndex, patch)}
                  />
                )}
                <input
                  value={value.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    updateValue(optionIndex, valueIndex, {
                      label,
                      ...(option.type === "button" ? { value: label } : {}),
                    });
                  }}
                  placeholder={option.type === "color" ? "اسم اللون" : "اسم الخيار"}
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateOption(optionIndex, {
                      values: option.values.filter((_, i) => i !== valueIndex),
                    })
                  }
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                  title="حذف القيمة"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              updateOption(optionIndex, { values: [...option.values, newValue(option.type)] })
            }
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة قيمة
          </button>
          <p className="mt-2 text-[10px] text-muted">
            {OPTION_TYPES.find((type) => type.id === option.type)?.hint}
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/50 px-4 py-3 text-xs font-bold text-muted transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        إضافة خيار للمنتج (لون / صورة / زر)
      </button>
    </div>
  );
}
