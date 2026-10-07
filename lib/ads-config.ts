export const ADS_CONFIG = {
  top: { enabled: true, code: "" },
  middle: { enabled: true, code: "" },
  bottom: { enabled: true, code: "" },
  blog_top: { enabled: true, code: "" },
  blog_middle: { enabled: true, code: "" },
  blog_end: { enabled: true, code: "" },
} as const satisfies AdsConfig;

export const ADS_CONFIG_STORAGE_KEY = "serviceai_ads_config";

export type AdsPlacement = "top" | "middle" | "bottom" | "blog_top" | "blog_middle" | "blog_end";
export type AdsConfig = Record<AdsPlacement, {
  enabled: boolean;
  code: string;
}>;

export function parseAdsConfig(value: unknown): AdsConfig {
  const parsed = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    (Object.keys(ADS_CONFIG) as AdsPlacement[]).map((placement) => {
      const candidate = parsed[placement];
      const settings = candidate && typeof candidate === "object"
        ? candidate as Record<string, unknown>
        : {};
      return [placement, {
        enabled: typeof settings.enabled === "boolean" ? settings.enabled : ADS_CONFIG[placement].enabled,
        code: typeof settings.code === "string" ? settings.code.slice(0, 20000) : ADS_CONFIG[placement].code,
      }];
    }),
  ) as AdsConfig;
}

export function readAdsConfigOverride(): AdsConfig {
  try {
    const stored = window.localStorage.getItem(ADS_CONFIG_STORAGE_KEY);
    return stored ? parseAdsConfig(JSON.parse(stored)) : parseAdsConfig(ADS_CONFIG);
  } catch (error) {
    console.error("Could not read local ServiceAI ad settings.", error);
    return parseAdsConfig(ADS_CONFIG);
  }
}

export function exportAdsConfigModule(settings: AdsConfig): string {
  return `export type AdsPlacement = "top" | "middle" | "bottom" | "blog_top" | "blog_middle" | "blog_end";
export type AdsConfig = Record<AdsPlacement, {
  enabled: boolean;
  code: string;
}>;

export const ADS_CONFIG = ${JSON.stringify(settings, null, 2)} as const satisfies AdsConfig;

export const ADS_CONFIG_STORAGE_KEY = "serviceai_ads_config";

export function parseAdsConfig(value: unknown): AdsConfig {
  const parsed = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    (Object.keys(ADS_CONFIG) as AdsPlacement[]).map((placement) => {
      const candidate = parsed[placement];
      const settings = candidate && typeof candidate === "object"
        ? candidate as Record<string, unknown>
        : {};
      return [placement, {
        enabled: typeof settings.enabled === "boolean" ? settings.enabled : ADS_CONFIG[placement].enabled,
        code: typeof settings.code === "string" ? settings.code.slice(0, 20000) : ADS_CONFIG[placement].code,
      }];
    }),
  ) as AdsConfig;
}

export function readAdsConfigOverride(): AdsConfig {
  try {
    const stored = window.localStorage.getItem(ADS_CONFIG_STORAGE_KEY);
    return stored ? parseAdsConfig(JSON.parse(stored)) : parseAdsConfig(ADS_CONFIG);
  } catch (error) {
    console.error("Could not read local ServiceAI ad settings.", error);
    return parseAdsConfig(ADS_CONFIG);
  }
}
`;
}
