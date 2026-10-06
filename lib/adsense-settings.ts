export const ADSENSE_SETTINGS_KEY = "adsense_settings";

export const ADSENSE_POSITIONS = [
  { id: "resume-builder-guide", position: "السيرة الذاتية - بين الأداة والدليل" },
  { id: "resume-builder-bottom", position: "السيرة الذاتية - أسفل الصفحة" },
  { id: "resume-analyzer-intro", position: "بعد المقدمة" },
  { id: "resume-analyzer-results", position: "بعد الأداة" },
  { id: "resume-analyzer-inline", position: "داخل الدليل" },
] as const;

export type AdsenseSlotSetting = {
  id: (typeof ADSENSE_POSITIONS)[number]["id"];
  slot: string;
  enabled: boolean;
  position: string;
};

export type AdsenseSettings = {
  publisherId: string;
  slots: AdsenseSlotSetting[];
};

export function createDefaultAdsenseSettings(): AdsenseSettings {
  return {
    publisherId: "",
    slots: ADSENSE_POSITIONS.map(({ id, position }) => ({
      id,
      slot: "",
      enabled: false,
      position,
    })),
  };
}

export function readAdsenseSettings(): AdsenseSettings {
  if (typeof window === "undefined") return createDefaultAdsenseSettings();
  return parseAdsenseSettings(window.localStorage.getItem(ADSENSE_SETTINGS_KEY));
}

export function parseAdsenseSettings(stored: string | null): AdsenseSettings {
  if (stored === null) return createDefaultAdsenseSettings();

  const parsed: unknown = JSON.parse(stored);
  if (!parsed || typeof parsed !== "object" || !("publisherId" in parsed) || !("slots" in parsed)) {
    throw new Error("إعدادات AdSense المحفوظة غير صالحة.");
  }

  const value = parsed as { publisherId: unknown; slots: unknown };
  if (typeof value.publisherId !== "string" || !Array.isArray(value.slots)) {
    throw new Error("إعدادات AdSense المحفوظة غير صالحة.");
  }

  const defaults = createDefaultAdsenseSettings();
  const savedSlots = new Map<string, unknown>(
    value.slots.flatMap((item: unknown) => {
      if (!item || typeof item !== "object" || !("id" in item)) return [];
      return [[String(item.id), item]];
    }),
  );
  const slots = defaults.slots.map((slot) => {
    const saved = savedSlots.get(slot.id);
    if (saved === undefined) return slot;
    if (!saved || typeof saved !== "object" || !("slot" in saved) || !("enabled" in saved)) {
      throw new Error(`إعداد موضع الإعلان «${slot.position}» غير صالح.`);
    }
    const savedSlot = saved as { slot: unknown; enabled: unknown };
    if (typeof savedSlot.slot !== "string" || typeof savedSlot.enabled !== "boolean") {
      throw new Error(`إعداد موضع الإعلان «${slot.position}» غير صالح.`);
    }
    return { ...slot, slot: savedSlot.slot, enabled: savedSlot.enabled };
  });

  return { publisherId: value.publisherId, slots };
}

export function saveAdsenseSettings(settings: AdsenseSettings) {
  if (typeof window === "undefined") throw new Error("لا يمكن حفظ إعدادات AdSense خارج المتصفح.");
  window.localStorage.setItem(ADSENSE_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("adsense-settings-updated"));
}
