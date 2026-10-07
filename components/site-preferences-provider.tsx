"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ADS_CONFIG, shouldShowAdsOnPathname } from "@/config/ads";
import { ADSENSE_SETTINGS_KEY, createDefaultAdsenseSettings, getAdsensePublisherId, getAdsenseSlotId, readAdsenseSettings, type AdsenseSettings } from "@/lib/adsense-settings";
import { createDefaultSitePreferences, parseSitePreferences, type SitePreferences } from "@/lib/site-preferences";
import { get, LOCAL_DB_KEYS, subscribe } from "@/lib/localDB";

type PreferencesContextValue = {
  preferences: SitePreferences;
  adsenseSettings: AdsenseSettings;
  adsenseReady: boolean;
};

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: createDefaultSitePreferences(),
  adsenseSettings: createDefaultAdsenseSettings(),
  adsenseReady: false,
});

export function useSitePreferences() {
  return useContext(PreferencesContext);
}

export function SitePreferencesProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [preferences, setPreferences] = useState(createDefaultSitePreferences);
  const [readyPublisherId, setReadyPublisherId] = useState("");
  const [adsenseSettings, setAdsenseSettings] = useState(createDefaultAdsenseSettings);

  useEffect(() => {
    const loadPreferences = () => {
      const data = get<Record<string, unknown>>(LOCAL_DB_KEYS.preferences, {});
      setPreferences(parseSitePreferences(data));
    };
    loadPreferences();
    const unsubscribe = subscribe((key) => {
      if (key === LOCAL_DB_KEYS.preferences) loadPreferences();
    });
    const onSettingsUpdated = () => loadPreferences();
    window.addEventListener("site-preferences-updated", onSettingsUpdated);
    return () => {
      unsubscribe();
      window.removeEventListener("site-preferences-updated", onSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    const loadAdsenseSettings = () => {
      try {
        setAdsenseSettings(readAdsenseSettings());
      } catch (error) {
        console.error("Could not load AdSense settings from local storage.", error);
        setAdsenseSettings(createDefaultAdsenseSettings());
      }
    };
    loadAdsenseSettings();
    const onSettingsUpdated = () => loadAdsenseSettings();
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADSENSE_SETTINGS_KEY) loadAdsenseSettings();
    };
    window.addEventListener("adsense-settings-updated", onSettingsUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("adsense-settings-updated", onSettingsUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const metaName = "google-adsense-account";
    const existingMeta = document.head.querySelector<HTMLMetaElement>(`meta[name="${metaName}"]`);

    if (!ADS_CONFIG.enabled || !shouldShowAdsOnPathname(pathname || "/")) {
      existingMeta?.remove();
      return;
    }

    const publisherId = adsenseSettings.publisherId;

    if (!publisherId) {
      existingMeta?.remove();
      return;
    }

    const meta = existingMeta ?? document.createElement("meta");
    meta.name = metaName;
    meta.content = publisherId;
    if (!existingMeta) document.head.append(meta);

    return () => {
      if (meta.content === publisherId) meta.remove();
    };
  }, [adsenseSettings.publisherId, pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--blue", preferences.branding.primaryColor);
    root.style.setProperty("--blue-dark", preferences.branding.primaryColor);
    root.style.setProperty("--green", preferences.branding.accentColor);
  }, [preferences.branding.primaryColor, preferences.branding.accentColor]);

  useEffect(() => {
    const pageTitle = pathname === "/"
      ? `${preferences.branding.siteName} — خطوتك الذكية نحو وظيفة أحلامك`
      : document.title.replace(/\s+[—|]\s+ServiceAI$/, "").trim();
    if (pageTitle) document.title = `${pageTitle} — ${preferences.branding.siteName}`;
  }, [pathname, preferences.branding.siteName]);

  useEffect(() => {
    if (pathname !== "/") return;
    let description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.append(description);
    }
    description.content = preferences.branding.heroDescription;
  }, [pathname, preferences.branding.heroDescription]);

  const publisherId = getAdsensePublisherId(adsenseSettings);
  const shouldLoadAds = Boolean(
    ADS_CONFIG.enabled
    && shouldShowAdsOnPathname(pathname || "/")
    && publisherId
    && adsenseSettings.slots.some((slot) => slot.enabled && getAdsenseSlotId(slot.slot)),
  );

  useEffect(() => {
    const scriptId = "google-adsense-script";
    const existingScript = document.head.querySelector<HTMLScriptElement>(`#${scriptId}`);

    if (!shouldLoadAds || !publisherId || !navigator.onLine) {
      existingScript?.remove();
      return;
    }

    const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
    if (existingScript?.src === scriptSrc) {
      existingScript.dataset.loaded = "true";
      return;
    }
    existingScript?.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = scriptSrc;
    script.onload = () => {
      script.dataset.loaded = "true";
      setReadyPublisherId(publisherId);
    };
    script.onerror = () => {
      setReadyPublisherId("");
      console.error("Google AdSense script failed to load.");
    };
    document.head.append(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [pathname, publisherId, shouldLoadAds]);

  return (
    <PreferencesContext.Provider value={{
      preferences,
      adsenseSettings,
      adsenseReady: shouldLoadAds && readyPublisherId === publisherId,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}
