import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { getStoreTheme, storeThemeVars } from "@/lib/themes";

export default async function StoreLayout(props: LayoutProps<"/[slug]">) {
  const { slug } = await props.params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { theme: true, themeColor: true },
  });

  const theme = getStoreTheme(store?.theme);
  const style = storeThemeVars(store?.theme, store?.themeColor) as CSSProperties;

  return (
    <div
      className={`store-theme ${theme.dark ? "dark" : ""}`}
      style={style}
    >
      {props.children}
    </div>
  );
}
