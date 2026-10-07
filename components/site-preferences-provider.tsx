"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ADS_CONFIG as SITE_ADS_CONFIG, shouldShowAdsOnPathname } from "@/config/ads";
import { ADS_CONFIG } from "@/lib/ads-config";
import { parseAdSenseSnippet } from "@/lib/blog-ads";
import { loadAdSenseScript } from "@/lib/ads-manager";
import { ADSENSE_SETTINGS_KEY, createDefaultAdsenseSettings, getAdsensePublisherId, readAdsenseSettings, type AdsenseSettings } from "@/lib/adsense-settings";
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
    let active = true;
    const loadSocialLinks = async () => {
      try {
        const response = await fetch("/api/social-links", { cache: "no-store" });
        if (!response.ok) throw new Error(`Social links request failed with status ${response.status}.`);
        const socialLinks: unknown = await response.json();
        if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
          throw new Error("The social links response is invalid.");
        }
        if (active) {
          setPreferences((current) => parseSitePreferences({ ...current, social_links: socialLinks }));
        }
      } catch (error) {
        console.error("Could not load shared social links.", error);
      }
    };
    void loadSocialLinks();
    const onSocialLinksUpdated = () => void loadSocialLinks();
    window.addEventListener("site-preferences-updated", onSettingsUpdated);
    window.addEventListener("serviceai-social-links-updated", onSocialLinksUpdated);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("site-preferences-updated", onSettingsUpdated);
      window.removeEventListener("serviceai-social-links-updated", onSocialLinksUpdated);
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

    if (!SITE_ADS_CONFIG.enabled || !shouldShowAdsOnPathname(pathname || "/")) {
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

  const legacyPublisherId = getAdsensePublisherId(adsenseSettings);
  const configuredPublisherIds = Object.values(ADS_CONFIG)
    .filter(({ enabled, code }) => enabled && code.trim())
    .map(({ code }) => parseAdSenseSnippet(code, legacyPublisherId))
    .filter(({ slotId, publisherId }) => Boolean(slotId && publisherId))
    .map(({ publisherId }) => publisherId);
  const publisherId = configuredPublisherIds[0] ?? "";
  const shouldLoadAds = Boolean(
    SITE_ADS_CONFIG.enabled
    && shouldShowAdsOnPathname(pathname || "/")
    && publisherId
    && configuredPublisherIds.length > 0,
  );

  useEffect(() => {
    if (!shouldLoadAds || !publisherId || !navigator.onLine) {
      return;
    }
    let active = true;
    loadAdSenseScript(publisherId).then(() => {
      if (active) setReadyPublisherId(publisherId);
    }).catch((error: unknown) => {
      if (active) setReadyPublisherId("");
      console.error("Google AdSense script failed to load.", error);
    });
    return () => {
      active = false;
    };
  }, [publisherId, shouldLoadAds]);

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
