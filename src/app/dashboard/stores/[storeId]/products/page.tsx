import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteProductButton from "@/components/DeleteProductButton";

export default async function ProductsPage(props: PageProps<"/dashboard/stores/[storeId]/products">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const store = await prisma.store.findFirst({ where: { id: storeId, userId: session!.userId } });
  if (!store) notFound();

  const products = await prisma.product.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
          <p className="text-sm text-muted">{store.name}</p>
        </div>
        <Link href={`/dashboard/stores/${store.id}/products/new`} className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition">
          + منتج جديد
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-muted mb-4">لا توجد منتجات بعد.</p>
          <Link href={`/dashboard/stores/${store.id}/products/new`} className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition">
            إضافة منتج
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="text-right px-4 py-3">المنتج</th>
                <th className="text-right px-4 py-3">التصنيف</th>
                <th className="text-right px-4 py-3">السعر</th>
                <th className="text-right px-4 py-3">المخزون</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.category?.name || "—"}</td>
                  <td className="px-4 py-3">{p.price.toLocaleString()} {store.currency}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.active ? "نشط" : "مخفي"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/dashboard/stores/${store.id}/products/${p.id}`} className="text-primary hover:underline">تعديل</Link>
                    <DeleteProductButton storeId={store.id} productId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}