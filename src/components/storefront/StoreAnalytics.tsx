"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { flushPixelQueues, trackPageView } from "@/lib/pixel-client";

function metaSnippet(pixelId: string) {
  return [
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?",
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;",
    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;",
    "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}",
    "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
    `fbq('init','${pixelId}');fbq('track','PageView');`,
    "window.dispatchEvent(new Event('bp:pixels-ready'));",
  ].join("");
}

function tiktokSnippet(pixelId: string) {
  return [
    "!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];",
    "ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];",
    "ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};",
    "for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);",
    "ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};",
    "ttq.load=function(e,n){var r='https://analytics.tiktok.com/i18n/pixel/events.js';",
    "ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;",
    "ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement('script');o.type='text/javascript';",
    "o.async=!0;o.src=r+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];",
    "a.parentNode.insertBefore(o,a)};",
    `ttq.load('${pixelId}');ttq.page();`,
    "w.dispatchEvent(new Event('bp:pixels-ready'));",
    "}(window,document,'ttq');",
  ].join("");
}

/**
 * Loads the merchant's Meta/TikTok pixels and reports client-side page views.
 * It is rendered only for live storefronts with at least one pixel configured.
 */
export default function StoreAnalytics({
  metaPixelId,
  tiktokPixelId,
}: {
  metaPixelId?: string;
  tiktokPixelId?: string;
}) {
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    const flush = () => flushPixelQueues();
    window.addEventListener("bp:pixels-ready", flush);
    flush();
    return () => window.removeEventListener("bp:pixels-ready", flush);
  }, []);

  useEffect(() => {
    // The snippets already send the first PageView. Only report client-side
    // navigations after that, so the landing page is not counted twice.
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  return (
    <>
      {metaPixelId && (
        <Script
          id="bp-meta-pixel"
          strategy="afterInteractive"
          onReady={flushPixelQueues}
          dangerouslySetInnerHTML={{ __html: metaSnippet(metaPixelId) }}
        />
      )}
      {tiktokPixelId && (
        <Script
          id="bp-tiktok-pixel"
          strategy="afterInteractive"
          onReady={flushPixelQueues}
          dangerouslySetInnerHTML={{ __html: tiktokSnippet(tiktokPixelId) }}
        />
      )}
    </>
  );
}
