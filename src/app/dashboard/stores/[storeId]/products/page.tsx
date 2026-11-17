import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowUpDown, Eye, Package, Pencil, Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/dashboard/EmptyState";
import DeleteProductButton from "@/components/DeleteProductButton";
import ProductExportButtons, { type ExportProduct } from "@/components/dashboard/ProductExportButtons";
import ProductImportButtons from "@/components/dashboard/ProductImportButtons";
import { formatMoney, formatNumber } from "@/lib/format";
import { cardClass, primaryBtn } from "@/lib/ui";

function parseImages(raw: string) {
  try {
    const imgs = JSON.parse(raw || "[]");
    return Array.isArray(imgs) ? (imgs as string[]) : [];
  } catch {
    return [];
  }
}

function parseOptions(raw: string) {
  try {
    const options = JSON.parse(raw || "[]");
    return Array.isArray(options)
      ? (options as { name: string; type: string; values: { label: string; value: string; image?: string }[] }[])
      : [];
  } catch {
    return [];
  }
}

const filters = [
  { key: "all", label: "كل المنتجات" },
  { key: "active", label: "نشط" },
  { key: "hidden", label: "مخفي" },
  { key: "out", label: "نفذ المخزون" },
] as const;

export default async function ProductsPage(props: PageProps<"/dashboard/stores/[storeId]/products">) {
  const session = await getSession();
  const { storeId } = await props.params;
  const searchParams = await props.searchParams;
  const filter = (searchParams as any)?.filter as string | undefined;

  const store = await prisma.store.findFirst({ where: { id: storeId, userId: session!.userId } });
  if (!store) notFound();

  const products = await prisma.product.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  const activeCount = products.filter((p) => p.active).length;
  const outCount = products.filter((p) => p.stock <= 0).length;

  const visible = products.filter((p) => {
    if (filter === "active") return p.active;
    if (filter === "hidden") return !p.active;
    if (filter === "out") return p.stock <= 0;
    return true;
  });

  const exportProducts: ExportProduct[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    comparePrice: product.comparePrice,
    stock: product.stock,
    active: product.active,
    shippingPrice: product.shippingPrice,
    category: product.category?.name || "",
    images: parseImages(product.images),
    options: parseOptions(product.options),
  }));

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref={`/dashboard/stores/${store.id}`}
        backLabel={store.name}
        eyebrow="الكتالوج"
        title="المنتجات"
        subtitle="ضيف منتجاتك، ظبّط الأسعار والمخزون، أو استورد/صدّر الكتالوج بصيغة JSON أو Excel."
        icon={<Package className="h-6 w-6" />}
        action={
          <Link href={`/dashboard/stores/${store.id}/products/new`} className={primaryBtn}>
            <Plus className="h-4 w-4" />
            منتج جديد
          </Link>
        }
      />

      <div className={`${cardClass} mb-5 flex flex-wrap items-center justify-between gap-3 p-3`}>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ArrowUpDown className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-extrabold text-foreground">استيراد وتصدير المنتجات</div>
            <div className="text-[10px] text-muted">JSON أو Excel/CSV — بنفس صيغة التصدير</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProductExportButtons products={exportProducts} storeName={store.name} />
          <ProductImportButtons storeId={store.id} />
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
        <StatCard icon={Package} label="كل المنتجات" value={formatNumber(products.length)} hint="في الكتالوج" tone="amber" />
        <StatCard icon={Eye} label="ظاهر للعملاء" value={formatNumber(activeCount)} hint="منتج نشط" tone="emerald" />
        <StatCard icon={AlertCircle} label="نفذ المخزون" value={formatNumber(outCount)} hint="محتاج تزويد" tone="rose" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = (filter || "all") === f.key;
          return (
            <Link
              key={f.key}
              href={
                f.key === "all"
                  ? `/dashboard/stores/${store.id}/products`
                  : `/dashboard/stores/${store.id}/products?filter=${f.key}`
              }
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "bg-primary text-white shadow-sm shadow-amber-500/20"
                  : "border border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? "الكتالوج لسه فاضي" : "مفيش منتجات في الفلتر ده"}
          description={
            products.length === 0
              ? "ضيف أول منتج ليك وابدأ تعرضه لعملاء متجرك على طول."
              : "جرّب فلتر تاني أو ضيف منتج جديد للكتالوج."
          }
          action={
            <Link href={`/dashboard/stores/${store.id}/products/new`} className={primaryBtn}>
              <Plus className="h-4 w-4" />
              ضيف منتج
            </Link>
          }
        />
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface/80 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-start font-bold">المنتج</th>
                  <th className="px-5 py-3 text-start font-bold">التصنيف</th>
                  <th className="px-5 py-3 text-start font-bold">السعر</th>
                  <th className="px-5 py-3 text-start font-bold">المخزون</th>
                  <th className="px-5 py-3 text-start font-bold">الحالة</th>
                  <th className="px-5 py-3 text-start font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((product) => {
                  const image = parseImages(product.images)[0];
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-surface/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface text-muted">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-foreground">{product.name}</div>
                            <div className="truncate text-[10px] text-muted">
                              {product.description || "بدون وصف"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {product.category ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="whitespace-nowrap font-bold text-foreground">{formatMoney(product.price, store.currency)}</div>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <div className="whitespace-nowrap text-[10px] text-muted line-through">
                            {formatMoney(product.comparePrice, store.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
                            product.stock <= 0
                              ? "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300"
                              : product.stock <= 5
                                ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
                                : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {product.stock <= 0 ? "نفذ" : `${formatNumber(product.stock)} قطعة`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
                            product.active
                              ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                              : "bg-stone-500/10 text-stone-600 ring-stone-500/20 dark:text-stone-300"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${product.active ? "bg-emerald-500" : "bg-stone-400"}`} />
                          {product.active ? "نشط" : "مخفي"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/stores/${store.id}/products/${product.id}`}
                            aria-label={`تعديل ${product.name}`}
                            title="تعديل"
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <DeleteProductButton storeId={store.id} productId={product.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
