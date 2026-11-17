import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import {
  parseCsvProducts,
  parseJsonProducts,
  ProductImportError,
  type ImportedProduct,
  type ImportIssue,
} from "@/lib/product-import";

const schema = z.object({
  format: z.enum(["json", "csv"]),
  content: z.string().min(1),
});

const MAX_FILE_SIZE = 5_000_000;
const MAX_CONCURRENCY = 8;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function categoryKey(name: string) {
  return name.trim().toLowerCase();
}

export async function POST(req: Request, ctx: RouteContext<"/api/stores/[storeId]/products/import">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { storeId } = await ctx.params;
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: session.userId },
    select: { id: true },
  });
  if (!store) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات الاستيراد غير صالحة" }, { status: 400 });
    }
    if (parsed.data.content.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "حجم الملف أكبر من 5 ميجابايت" }, { status: 413 });
    }

    let result: { products: ImportedProduct[]; errors: ImportIssue[] };
    try {
      result = parsed.data.format === "json"
        ? parseJsonProducts(parsed.data.content)
        : parseCsvProducts(parsed.data.content);
    } catch (error) {
      if (error instanceof ProductImportError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    if (result.products.length === 0) {
      return NextResponse.json(
        {
          error: result.errors[0]?.message || "مفيش منتجات صالحة في الملف",
          errors: result.errors.slice(0, 20),
        },
        { status: 400 }
      );
    }

    const [existingCategories, existingProducts] = await Promise.all([
      prisma.category.findMany({ where: { storeId }, select: { id: true, name: true } }),
      prisma.product.findMany({ where: { storeId }, select: { id: true } }),
    ]);

    const categoryMap = new Map<string, string | null>();
    for (const category of existingCategories) {
      categoryMap.set(categoryKey(category.name), category.id);
    }
    const existingIds = new Set(existingProducts.map((product) => product.id));
    const errors: ImportIssue[] = [...result.errors];
    let categoriesCreated = 0;

    const categoryNames = Array.from(
      new Set(
        result.products
          .map((product) => product.category.trim())
          .filter(Boolean)
      )
    );
    for (const name of categoryNames) {
      const key = categoryKey(name);
      if (categoryMap.has(key)) continue;
      try {
        const category = await prisma.category.create({
          data: { storeId, name, slug: slugify(name) || "category", image: "" },
        });
        categoryMap.set(key, category.id);
        categoriesCreated += 1;
      } catch (error) {
        console.error(error);
        categoryMap.set(key, null);
        errors.push({ row: 0, message: `تعذّر إنشاء القسم "${name}"` });
      }
    }

    let created = 0;
    let updated = 0;

    for (let index = 0; index < result.products.length; index += MAX_CONCURRENCY) {
      const chunk = result.products.slice(index, index + MAX_CONCURRENCY);
      await Promise.all(
        chunk.map(async (product) => {
          try {
            const categoryId = product.category
              ? categoryMap.get(categoryKey(product.category)) ?? null
              : null;
            const data = {
              name: product.name,
              description: product.description,
              price: product.price,
              comparePrice: product.comparePrice,
              stock: product.stock,
              active: product.active,
              shippingPrice: product.shippingPrice,
              categoryId,
              images: JSON.stringify(product.images),
              options: product.options,
            };

            if (product.id && existingIds.has(product.id)) {
              await prisma.product.update({ where: { id: product.id }, data });
              updated += 1;
            } else {
              await prisma.product.create({ data: { storeId, ...data } });
              created += 1;
            }
          } catch (error) {
            console.error(error);
            errors.push({ row: product.row, message: "تعذّر حفظ المنتج. راجع بياناته وجرّب تاني." });
          }
        })
      );
    }

    if (created + updated === 0) {
      return NextResponse.json(
        {
          error: "مفيش منتجات اتحفظت. راجع الأخطاء وجرّب تاني.",
          errors: errors.slice(0, 20),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      created,
      updated,
      categoriesCreated,
      total: result.products.length,
      errors: errors.slice(0, 20),
      errorCount: errors.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
