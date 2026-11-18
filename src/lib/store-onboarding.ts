import { prisma } from "./prisma";
import { defaultShippingRates } from "./shipping";
import { DEFAULT_STORE_COLOR, DEFAULT_STORE_THEME } from "./themes";

function slugBase(name: string, email: string) {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const base = clean(name) || clean(email.split("@")[0]) || "store";
  return base.slice(0, 28).replace(/-+$/g, "") || "store";
}

/** Finds a free {slug}.beepanal.store handle for a new merchant. */
export async function uniqueStoreSlug(name: string, email: string) {
  const base = slugBase(name, email);
  let slug = base;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const existing = await prisma.store.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

/** Creates the default 7-day trial store for a new merchant. */
export async function createMerchantStore({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const slug = await uniqueStoreSlug(name, email);
  return prisma.store.create({
    data: {
      userId,
      name: `متجر ${name.split(" ")[0]}`.slice(0, 60),
      slug,
      description: "",
      currency: "EGP",
      themeColor: DEFAULT_STORE_COLOR,
      theme: DEFAULT_STORE_THEME,
      shippingRates: JSON.stringify(defaultShippingRates()),
      plan: "trial",
      planStatus: "active",
      planRenewsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}
