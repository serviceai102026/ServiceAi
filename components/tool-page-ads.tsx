"use client";

import { AdSlot } from "@/components/ads/AdSlot";
import { useSitePreferences } from "@/components/site-preferences-provider";

export function ToolPageAd({ position }: { position: "top" | "middle" | "bottom" }) {
  const { adsConfig, adsConfigReady } = useSitePreferences();
  if (!adsConfigReady) return null;
  const placement = adsConfig[position];
  if (!placement.enabled) return null;
  return <AdSlot position={position} />;
}
