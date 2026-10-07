"use client";

import { useEffect, useRef, useState } from "react";
import { parseAdSenseSnippet } from "@/lib/blog-ads";
import { ADS_CONFIG, parseAdsConfig, readAdsConfigOverride, type AdsPlacement, type AdsConfig } from "@/lib/ads-config";
import { sanitizeBlogAdHtml } from "@/lib/content";
import { shouldShowAdsOnPathname } from "@/config/ads";
import { usePathname } from "next/navigation";
import { useSitePreferences } from "@/components/site-preferences-provider";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

type AdSlotProps =
  | { placement: AdsPlacement; code?: never }
  | { code: string; placement?: never };

export function AdSlot(props: AdSlotProps) {
  const [settings, setSettings] = useState<AdsConfig>(() => parseAdsConfig(ADS_CONFIG));
  const [loaded, setLoaded] = useState(false);
  const element = useRef<HTMLElement>(null);
  const initialized = useRef("");
  const pathname = usePathname();
  const adsAllowed = shouldShowAdsOnPathname(pathname || "/");
  const { adsenseSettings } = useSitePreferences();
  const placement = props.placement;
  const placementSettings = placement ? settings[placement] : null;
  const code = (placementSettings?.code ?? props.code ?? "").trim();
  const publisherId = adsenseSettings.publisherId;
  const isEnabled = placementSettings?.enabled ?? Boolean(code);
  const ad = parseAdSenseSnippet(code, publisherId);
  const isAdSense = Boolean(adsAllowed && isEnabled && ad.publisherId && ad.slotId);
  const slotKey = isAdSense ? `${ad.publisherId}/${ad.slotId}` : "";
  const isMarkup = /<\/?[a-z][^>]*>/i.test(code);
  const safeHtml = isMarkup && !isAdSense ? sanitizeBlogAdHtml(code) : "";

  useEffect(() => {
    const loadSettings = () => {
      setSettings(readAdsConfigOverride());
      setLoaded(true);
    };
    loadSettings();
    window.addEventListener("storage", loadSettings);
    window.addEventListener("serviceai-ads-config-updated", loadSettings);
    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener("serviceai-ads-config-updated", loadSettings);
    };
  }, []);

  useEffect(() => {
    if (!isAdSense || initialized.current === slotKey || !element.current) return;

    const adsenseScript = document.querySelector<HTMLScriptElement>(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );
    if (adsenseScript) {
      const currentPublisher = new URL(adsenseScript.src).searchParams.get("client");
      if (currentPublisher && currentPublisher !== ad.publisherId) {
        console.error("Blog AdSense publisher differs from the site's already-loaded AdSense script.");
        return;
      }
    } else {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ad.publisherId)}`;
      document.head.appendChild(script);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = slotKey;
    } catch (error) {
      console.error(`Could not initialize AdSense placement "${placement ?? "tool page"}".`, error);
    }
  }, [ad.publisherId, isAdSense, placement, slotKey]);

  if (!adsAllowed || !loaded || !isEnabled || !code) return null;

  return (
    <aside
      ref={element}
      className={`blog-ad-slot${isAdSense ? " adsense-slot" : " ad-custom-content"}${placement === "top" || placement === "bottom" || !placement ? " tool-page-ad" : ""}`}
      aria-label="إعلان"
    >
      {isAdSense ? (
        <ins
          key={slotKey}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ad.publisherId}
          data-ad-slot={ad.slotId}
          data-ad-format={ad.format}
          data-ad-layout={ad.layout}
          data-ad-layout-key={ad.layoutKey}
          data-full-width-responsive="true"
        />
      ) : safeHtml ? (
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      ) : (
        <span>{code}</span>
      )}
    </aside>
  );
}
