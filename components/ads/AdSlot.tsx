"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSitePreferences } from "@/components/site-preferences-provider";
import { ADS_CONFIG as SITE_ADS_CONFIG, shouldShowAdsOnPathname } from "@/config/ads";
import { parseAdSenseSnippet } from "@/lib/blog-ads";
import type { AdsPlacement } from "@/lib/ads-config";
import { getAdsensePublisherId } from "@/lib/adsense-settings";
import { sanitizeBlogAdHtml } from "@/lib/content";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

export function AdSlot({ position }: { position: AdsPlacement }) {
  const element = useRef<HTMLElement>(null);
  const initialized = useRef("");
  const pathname = usePathname();
  const { adsConfig, adsConfigReady, adsenseSettings, adsenseReady } = useSitePreferences();
  const placement = adsConfig[position];
  const code = placement.code.trim();
  const adsAllowed = SITE_ADS_CONFIG.enabled && shouldShowAdsOnPathname(pathname || "/");
  const pagePositions: AdsPlacement[] = pathname?.startsWith("/blog/")
    ? ["blog_top", "blog_middle", "blog_end"]
    : ["top", "middle", "bottom"];
  const firstMatchingPosition = pagePositions.find((candidate) => {
    const candidateSettings = adsConfig[candidate];
    return candidateSettings.enabled && candidateSettings.code.trim() === code && code.length > 0;
  });
  const ad = parseAdSenseSnippet(code, getAdsensePublisherId(adsenseSettings));
  const isAdSense = Boolean(ad.publisherId && ad.slotId);
  const slotKey = isAdSense ? `${ad.publisherId}/${ad.slotId}` : "";
  const safeHtml = isAdSense ? "" : sanitizeBlogAdHtml(code);

  useEffect(() => {
    if (!adsenseReady || !placement.enabled || !isAdSense || initialized.current === slotKey || !element.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = slotKey;
    } catch (error) {
      console.error(`Could not initialize ad placement "${position}".`, error);
    }
  }, [adsenseReady, isAdSense, placement.enabled, position, slotKey]);

  if (!adsAllowed || !adsConfigReady || !placement.enabled || (firstMatchingPosition && firstMatchingPosition !== position)) return null;
  if (!code) {
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <div
        className="ad-future-placeholder"
        style={{ background: "#f3f4f6", border: "1px dashed #ccc", padding: 20, textAlign: "center" }}
      >
        مساحة إعلانية: {position}
      </div>
    );
  }

  return (
    <aside ref={element} className="blog-ad-slot" aria-label="إعلان">
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
      ) : (
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      )}
    </aside>
  );
}
