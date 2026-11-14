"use client";

import { useRouter } from "next/navigation";

export default function DeleteProductButton({ storeId, productId }: { storeId: string; productId: string }) {
  const router = useRouter();
  async function handle() {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    await fetch(`/api/stores/${storeId}/products/${productId}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <button onClick={handle} className="text-sm text-red-600 hover:underline">
      حذف
    </button>
  );
}