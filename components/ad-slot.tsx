"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSitePreferences } from "@/components/site-preferences-provider";
import { shouldShowAdsOnPathname } from "@/config/ads";
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
  const isConfigured = Boolean(adsAllowed && adsenseSettings.publisherId && slot?.enabled && slot.slot);
  const slotKey = isConfigured ? `${adsenseSettings.publisherId}/${slot?.slot}` : "";

  useEffect(() => {
    if (!isConfigured) {
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
  }, [adsenseReady, id, isConfigured, slotKey]);

  if (!adsAllowed || (slot && !slot.enabled)) return null;

  return (
    <aside
      ref={element}
      className={`${className}${isConfigured ? " adsense-slot" : " ad-future-placeholder"}`}
      aria-label={isConfigured ? "إعلان" : "مساحة إعلانية مستقبلية"}
    >
      {isConfigured
        ? <ins
          key={slotKey}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adsenseSettings.publisherId}
          data-ad-slot={slot?.slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        : <><span>مساحة إعلانية مستقبلية</span><small>{description}</small></>}
    </aside>
  );
}
