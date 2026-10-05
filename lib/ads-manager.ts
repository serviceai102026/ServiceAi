export const ADS_MANAGER_ADMIN_UID = "CLBHE7rmmARH6V9XpCXnkZrHxju2";

export type AdDevice = "all" | "desktop" | "mobile";
export type AdType = "display" | "in-article" | "auto";
export type AdLocation = "home" | "services" | "service-detail" | "blog" | "footer" | "custom";

export type ManagedAd = {
  id: string;
  name: string;
  location: AdLocation;
  adClient: string;
  adSlot: string;
  isActive: boolean;
  device: AdDevice;
  type: AdType;
  createdAt: string;
};

const adsenseLoads = new Map<string, Promise<void>>();

export function loadAdSenseScript(adClient: string): Promise<void> {
  const cached = adsenseLoads.get(adClient);
  if (cached) return cached;

  const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adClient)}`;
  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("google-adsense-script") as HTMLScriptElement | null;
    if (existing && existing.src !== scriptSrc) {
      reject(new Error("AdSense placements on the same page must use the same publisher ID."));
      return;
    }
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    const onError = () => reject(new Error("Google AdSense script failed to load."));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.id = "google-adsense-script";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = scriptSrc;
      document.head.append(script);
    }
  });
  adsenseLoads.set(adClient, promise);
  void promise.catch(() => adsenseLoads.delete(adClient));
  return promise;
}

export const DEFAULT_MANAGED_ADS: ManagedAd[] = [
  { id: "home-top", name: "الرئيسية - أعلى", location: "home", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "home-middle", name: "الرئيسية - وسط", location: "home", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "home-bottom", name: "الرئيسية - أسفل", location: "home", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "services-top", name: "صفحة الخدمات - أعلى", location: "services", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "services-bottom", name: "صفحة الخدمات - أسفل", location: "services", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "service-detail-top", name: "تفاصيل الخدمة - أعلى", location: "service-detail", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "service-detail-middle", name: "تفاصيل الخدمة - وسط", location: "service-detail", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "service-detail-sidebar", name: "تفاصيل الخدمة - جانبي", location: "service-detail", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "blog-in-article", name: "المدونة - داخل المقال", location: "blog", adClient: "", adSlot: "", isActive: false, device: "all", type: "in-article", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "footer-top", name: "الفوتر - أعلى", location: "footer", adClient: "", adSlot: "", isActive: false, device: "all", type: "display", createdAt: "2026-01-01T00:00:00.000Z" },
];

export function sortManagedAds(ads: ManagedAd[]) {
  const order = new Map(DEFAULT_MANAGED_ADS.map((ad, index) => [ad.id, index]));
  return [...ads].sort((a, b) => {
    const aOrder = order.get(a.id);
    const bOrder = order.get(b.id);
    if (aOrder !== undefined || bOrder !== undefined) return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
    return a.name.localeCompare(b.name, "ar");
  });
}
