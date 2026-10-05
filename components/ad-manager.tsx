"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { loadAdSenseScript, type ManagedAd } from "@/lib/ads-manager";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

type AdManagerProps = {
  id: string;
  className?: string;
};

export function AdManager({ id, className = "" }: AdManagerProps) {
  const [ad, setAd] = useState<ManagedAd | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile" | null>(null);
  const [loadedPublisher, setLoadedPublisher] = useState("");
  const element = useRef<HTMLElement>(null);
  const initialized = useRef("");

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const updateDevice = () => setDevice(query.matches ? "mobile" : "desktop");
    updateDevice();
    query.addEventListener("change", updateDevice);
    return () => query.removeEventListener("change", updateDevice);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(doc(getFirebaseFirestore(), "ads_manager", id), (snapshot) => {
        setAd(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as ManagedAd : null);
      }, (error) => {
        console.error(`Could not load AdSense placement "${id}":`, error);
        setAd(null);
      });
    } catch (error) {
      console.error(`Could not connect to AdSense placement "${id}":`, error);
    }
    return () => unsubscribe?.();
  }, [id]);

  const eligible = Boolean(
    ad?.isActive
    && /^ca-pub-\d+$/.test(ad.adClient)
    && /^\d+$/.test(ad.adSlot)
    && device
    && (ad.device === "all" || ad.device === device),
  );

  useEffect(() => {
    if (!eligible || !ad?.adClient || !navigator.onLine) {
      initialized.current = "";
      return;
    }

    let cancelled = false;
    void loadAdSenseScript(ad.adClient).then(() => {
      if (!cancelled) setLoadedPublisher(ad.adClient);
    }, (error: unknown) => {
      if (!cancelled) {
        console.error(`Could not load AdSense placement "${id}":`, error);
      }
    });
    return () => { cancelled = true; };
  }, [ad?.adClient, eligible, id]);

  const slotKey = eligible && ad ? `${ad.adClient}/${ad.adSlot}` : "";
  const scriptReady = Boolean(ad?.adClient && loadedPublisher === ad.adClient);
  useEffect(() => {
    if (!eligible || !scriptReady || !element.current || !slotKey || initialized.current === slotKey) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = slotKey;
    } catch (error) {
      console.error(`Could not initialize AdSense placement "${id}":`, error);
    }
  }, [eligible, id, scriptReady, slotKey]);

  if (!eligible || !ad) return null;
  return (
    <aside ref={element} className={`managed-ad-slot ${className}`.trim()} aria-label="إعلان">
      <ins
        key={slotKey}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ad.adClient}
        data-ad-slot={ad.adSlot}
        data-ad-format={ad.type === "in-article" ? "fluid" : ad.type === "auto" ? "auto" : "rectangle"}
        data-ad-layout={ad.type === "in-article" ? "in-article" : undefined}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
