export type AdsPlacement = "top" | "middle" | "bottom" | "blog_top" | "blog_middle" | "blog_end";

export type AdsConfig = Record<AdsPlacement, {
  enabled: boolean;
  code: string;
}>;

export const ADS_CONFIG = {
  "top": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;border:2px dashed #0284c7;padding:30px;text-align:center;border-radius:12px'>إعلان TOP 1</div>"
  },
  "middle": {
    "enabled": true,
    "code": "<div style='background:#fef9c3;border:2px dashed #ca8a04;padding:30px;text-align:center;border-radius:12px'>إعلان MIDDLE 2</div>"
  },
  "bottom": {
    "enabled": true,
    "code": "<div style='background:#dcfce7;border:2px dashed #16a34a;padding:30px;text-align:center;border-radius:12px'>إعلان BOTTOM 3</div>"
  },
  "blog_top": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;padding:20px;text-align:center'>إعلان مدونة</div>"
  },
  "blog_middle": {
    "enabled": true,
    "code": ""
  },
  "blog_end": {
    "enabled": true,
    "code": ""
  }
} as const satisfies AdsConfig;
