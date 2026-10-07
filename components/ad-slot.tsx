"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSitePreferences } from "@/components/site-preferences-provider";
import { shouldShowAdsOnPathname } from "@/config/ads";
import { sanitizeAdHtml } from "@/lib/content";
import { getAdsensePublisherId, getAdsenseSlotId } from "@/lib/adsense-settings";
import type { AdPlacementId } from "@/lib/site-preferences";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

export function AdSlot({ id, className, description }: {
  id: AdPlacementId;
  className: string;
  description: string;
}) {
  const { adsenseSettings, adsenseReady } = useSitePreferences();
  const pathname = usePathname();
  const adsAllowed = shouldShowAdsOnPathname(pathname || "/");
  const element = useRef<HTMLElement>(null);
  const initialized = useRef("");
  const slot = adsenseSettings.slots.find((item) => item.id === id);
  const slotValue = slot?.slot ?? "";
  const publisherId = getAdsensePublisherId(adsenseSettings);
  const adSlotId = getAdsenseSlotId(slotValue);
  const isAdsense = Boolean(adsAllowed && slot?.enabled && publisherId && adSlotId);
  const isCustomHtml = Boolean(slot?.enabled && /<\/?[a-z][^>]*>/i.test(slotValue) && !isAdsense);
  const isCustomText = Boolean(slot?.enabled && slotValue && !isAdsense && !isCustomHtml);
  const slotKey = isAdsense ? `${publisherId}/${adSlotId}` : "";

  useEffect(() => {
    if (!isAdsense) {
      initialized.current = "";
      return;
    }
    if (!adsenseReady || initialized.current === slotKey || !element.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = slotKey;
    } catch (error) {
      console.error(`Could not initialize AdSense placement "${id}":`, error);
    }
  }, [adsenseReady, id, isAdsense, slotKey]);

  if (!adsAllowed || (slot && !slot.enabled)) return null;

  return (
    <aside
      ref={element}
      className={`${className}${isAdsense ? " adsense-slot" : isCustomHtml || isCustomText ? " ad-custom-content" : " ad-future-placeholder"}`}
      aria-label={isAdsense || isCustomHtml || isCustomText ? "إعلان" : "مساحة إعلانية مستقبلية"}
    >
      {isAdsense
        ? <ins
          key={slotKey}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={publisherId}
          data-ad-slot={adSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        : isCustomHtml
          ? <div dangerouslySetInnerHTML={{ __html: sanitizeAdHtml(slotValue) }} />
          : isCustomText
            ? <span>{slotValue}</span>
            : <><span>مساحة إعلانية مستقبلية</span><small>{description}</small></>}
    </aside>
  );
}
