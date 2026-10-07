"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { parseAdSenseSnippet, parseBlogAdsSettings, type BlogAdKey } from "@/lib/blog-ads";
import { sanitizeBlogAdHtml } from "@/lib/content";
import { shouldShowAdsOnPathname } from "@/config/ads";
import { usePathname } from "next/navigation";
import { useSitePreferences } from "@/components/site-preferences-provider";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

export function AdSlot({ placement }: { placement: BlogAdKey }) {
  const [settings, setSettings] = useState(() => parseBlogAdsSettings({}));
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const element = useRef<HTMLElement>(null);
  const initialized = useRef("");
  const pathname = usePathname();
  const adsAllowed = shouldShowAdsOnPathname(pathname || "/");
  const { adsenseSettings } = useSitePreferences();
  const enabledKey = `${placement}_enabled` as `${BlogAdKey}_enabled`;
  const codeKey = `${placement}_code` as `${BlogAdKey}_code`;
  const code = settings[codeKey].trim();
  const ad = parseAdSenseSnippet(code, adsenseSettings.publisherId);
  const isAdSense = Boolean(adsAllowed && settings[enabledKey] && ad.publisherId && ad.slotId);
  const slotKey = isAdSense ? `${ad.publisherId}/${ad.slotId}` : "";
  const isMarkup = /<\/?[a-z][^>]*>/i.test(code);
  const safeHtml = isMarkup && !isAdSense ? sanitizeBlogAdHtml(code) : "";

  useEffect(() => {
    try {
      return onSnapshot(doc(getFirebaseFirestore(), "settings", "ads"), (snapshot) => {
        setSettings(parseBlogAdsSettings(snapshot.exists() ? snapshot.data() : {}));
        setLoaded(true);
        setLoadError(false);
      }, (error) => {
        console.error("Could not load blog ad settings from Firestore.", error);
        setLoadError(true);
        setLoaded(true);
      });
    } catch (error) {
      console.error("Could not initialize blog ad settings listener.", error);
      queueMicrotask(() => {
        setLoadError(true);
        setLoaded(true);
      });
      return undefined;
    }
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
      console.error(`Could not initialize blog AdSense placement "${placement}".`, error);
    }
  }, [ad.publisherId, isAdSense, placement, slotKey]);

  if (!adsAllowed || !loaded || loadError || !settings[enabledKey] || !code) return null;

  return (
    <aside
      ref={element}
      className={`blog-ad-slot${isAdSense ? " adsense-slot" : " ad-custom-content"}`}
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
