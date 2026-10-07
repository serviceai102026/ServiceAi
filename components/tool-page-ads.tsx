"use client";

import { useEffect, useState } from "react";
import { AdSlot } from "@/components/AdSlot";
import { ADS_CONFIG, readAdsConfigOverride, type AdsConfig } from "@/lib/ads-config";

export function ToolPageAd({ position }: { position: "top" | "bottom" }) {
  const [settings, setSettings] = useState<AdsConfig>(() => ADS_CONFIG);

  useEffect(() => {
    const loadSettings = () => setSettings(readAdsConfigOverride());
    loadSettings();
    window.addEventListener("storage", loadSettings);
    window.addEventListener("serviceai-ads-config-updated", loadSettings);
    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener("serviceai-ads-config-updated", loadSettings);
    };
  }, []);

  const placement = settings[position];
  if (!placement.enabled || !placement.code.trim()) return null;
  return <AdSlot code={placement.code} />;
}
