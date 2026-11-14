import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductDetailPage(props: PageProps<"/[slug]/products/[productId]">) {
  const { slug, productId } = await props.params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.active) notFound();
  const product = await prisma.product.findFirst({ where: { id: productId, storeId: store.id, active: true } });
  if (!product) notFound();

  let images: string[] = [];
  try { images = JSON.parse(product.images || "[]"); } catch { images = []; }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={`/${store.slug}`} className="font-bold text-foreground">{store.name}</Link>
          <Link href={`/${store.slug}/cart`} className="text-sm text-muted">🛒 السلة</Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-white border border-border rounded-2xl overflow-hidden">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted text-6xl">🛍️</div>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">{product.price.toLocaleString()} {store.currency}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-muted line-through">{product.comparePrice.toLocaleString()}</span>
            )}
          </div>
          <p className="text-sm text-muted mt-2">المخزون: {product.stock}</p>
          <p className="mt-6 text-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
          <div className="mt-8">
            <AddToCartButton product={product} storeSlug={store.slug} />
          </div>
          <Link href={`/${store.slug}`} className="inline-block mt-6 text-sm text-muted hover:text-foreground">← العودة للمتجر</Link>
        </div>
      </main>
    </div>
  );
}