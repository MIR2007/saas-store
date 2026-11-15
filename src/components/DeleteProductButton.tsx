"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteProductButton({ storeId, productId }: { storeId: string; productId: string }) {
  const router = useRouter();
  async function handle() {
    if (!confirm("متأكد إنك عايز تحذف المنتج ده؟ الخطوة دي مش هتتراجع.")) return;
    await fetch(`/api/stores/${storeId}/products/${productId}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <button
      onClick={handle}
      aria-label="حذف المنتج"
      title="حذف"
      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
