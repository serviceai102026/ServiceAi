"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSitePreferences } from "@/components/site-preferences-provider";
import { ADS_CONFIG as SITE_ADS_CONFIG, shouldShowAdsOnPathname } from "@/config/ads";
import { parseAdSenseSnippet } from "@/lib/blog-ads";
import { ADS_CONFIG, type AdsPlacement } from "@/lib/ads-config";
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
  const { adsenseSettings, adsenseReady } = useSitePreferences();
  const placement = ADS_CONFIG[position];
  const code = placement.code.trim();
  const adsAllowed = SITE_ADS_CONFIG.enabled && shouldShowAdsOnPathname(pathname || "/");
  const ad = parseAdSenseSnippet(code, getAdsensePublisherId(adsenseSettings));
  const isAdSense = Boolean(ad.publisherId && ad.slotId);
  const slotKey = isAdSense ? `${ad.publisherId}/${ad.slotId}` : "";
  const safeHtml = isAdSense ? "" : sanitizeBlogAdHtml(code);
  const missingPublisher = /^\d+$/.test(code) && !ad.publisherId;

  useEffect(() => {
    if (!adsenseReady || !placement.enabled || !isAdSense || initialized.current === slotKey || !element.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = slotKey;
    } catch (error) {
      console.error(`Could not initialize ad placement "${position}".`, error);
    }
  }, [adsenseReady, isAdSense, placement.enabled, position, slotKey]);

  if (!adsAllowed || !placement.enabled) return null;
  if (!code) {
    return (
      <div
        className="ad-future-placeholder"
        style={{ background: "#f3f4f6", border: "1px dashed #9ca3af", padding: 20, textAlign: "center", margin: "20px 0" }}
      >
        مساحة إعلانية: {position} - فارغة، أضف كود من /admin
      </div>
    );
  }

  if (missingPublisher || (!isAdSense && !safeHtml.trim())) {
    return (
      <aside className="blog-ad-slot ad-custom-content" aria-label="إعلان">
        <div className="ad-config-warning" role="status">
          {missingPublisher
            ? "الموضع مفعّل، لكن يلزم إدخال معرّف الناشر في إعدادات AdSense."
            : "الموضع مفعّل، لكن الكود لا يحتوي محتوى إعلان آمنًا للعرض. استخدم كود AdSense كاملًا أو HTML صالحًا."}
        </div>
      </aside>
    );
  }

  return (
    <aside ref={element} className={`blog-ad-slot${isAdSense ? " adsense-slot" : " ad-custom-content"}`} aria-label="إعلان">
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

export default AdSlot;
