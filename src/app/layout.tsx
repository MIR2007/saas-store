import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://beepanal.store"),
  title: "Bee Panal | منصة المتاجر الإلكترونية في مصر",
  description:
    "اعمل متجرك الأونلاين في دقايق، من غير مبرمج. منتجات، طلبات، دفع وشحن — بالجنيه المصري. جرّب Bee Panal 7 أيام ببلاش.",
  keywords: ["متجر إلكتروني", "إنشاء متجر", "تجارة إلكترونية", "مصر", "Bee Panal"],
  openGraph: {
    title: "Bee Panal | منصة المتاجر الإلكترونية في مصر",
    description: "اعمل متجرك الأونلاين في دقايق، من غير مبرمج — جرّب 7 أيام ببلاش.",
    url: "https://beepanal.store",
    siteName: "Bee Panal",
    locale: "ar_EG",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}