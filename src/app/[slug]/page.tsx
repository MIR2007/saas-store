import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export default async function StoreHome(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const categoryFilter = (searchParams as any)?.category as string | undefined;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.active) notFound();

  const products = await prisma.product.findMany({
    where: { storeId: store.id, active: true, ...(categoryFilter ? { categoryId: categoryFilter } : {}) },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  const categories = await prisma.category.findMany({ where: { storeId: store.id } });

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={`/${store.slug}`} className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold" style={{ backgroundColor: store.themeColor }}>
              {store.name.charAt(0)}
            </span>
            <span className="font-bold text-foreground">{store.name}</span>
          </Link>
          <Link href={`/${store.slug}/cart`} className="text-sm text-muted hover:text-foreground">
            🛒 السلة
          </Link>
        </div>
      </header>

      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-foreground">{store.name}</h1>
          {store.description && <p className="text-muted mt-2">{store.description}</p>}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <Link href={`/${store.slug}`} className="px-4 py-2 rounded-full bg-white border border-border text-sm hover:bg-surface">الكل</Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/${store.slug}?category=${c.id}`} className="px-4 py-2 rounded-full bg-white border border-border text-sm hover:bg-surface">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20 text-muted">لا توجد منتجات حالياً.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} storeSlug={store.slug} currency={store.currency} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}