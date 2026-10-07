export type AdsPlacement = "top" | "middle" | "bottom" | "blog_top" | "blog_middle" | "blog_end";

export type AdsConfig = Record<AdsPlacement, {
  enabled: boolean;
  code: string;
}>;

export const ADS_CONFIG = {
  "top": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;border:2px solid #0284c7;padding:25px;text-align:center;border-radius:12px;'>\n  <div style='font-size:20px;font-weight:bold;color:#0369a1;'>📢 إعلانك هنا - TOP 1</div>\n  <div style='margin-top:8px;color:#0c4a6e;'>هذا الإعلان يظهر بنجاح، يمكنك الآن وضع كود AdSense الحقيقي</div>\n</div>"
  },
  "middle": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;border:2px solid #0284c7;padding:25px;text-align:center;border-radius:12px;'>\n  <div style='font-size:20px;font-weight:bold;color:#0369a1;'>📢 إعلانك هنا - TOP 1</div>\n  <div style='margin-top:8px;color:#0c4a6e;'>هذا الإعلان يظهر بنجاح، يمكنك الآن وضع كود AdSense الحقيقي</div>\n</div>"
  },
  "bottom": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;border:2px solid #0284c7;padding:25px;text-align:center;border-radius:12px;'>\n  <div style='font-size:20px;font-weight:bold;color:#0369a1;'>📢 إعلانك هنا - TOP 1</div>\n  <div style='margin-top:8px;color:#0c4a6e;'>هذا الإعلان يظهر بنجاح، يمكنك الآن وضع كود AdSense الحقيقي</div>\n</div>"
  },
  "blog_top": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;border:2px solid #0284c7;padding:25px;text-align:center;border-radius:12px;'>\n  <div style='font-size:20px;font-weight:bold;color:#0369a1;'>📢 إعلانك هنا - TOP 1</div>\n  <div style='margin-top:8px;color:#0c4a6e;'>هذا الإعلان يظهر بنجاح، يمكنك الآن وضع كود AdSense الحقيقي</div>\n</div>"
  },
  "blog_middle": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;border:2px solid #0284c7;padding:25px;text-align:center;border-radius:12px;'>\n  <div style='font-size:20px;font-weight:bold;color:#0369a1;'>📢 إعلانك هنا - TOP 1</div>\n  <div style='margin-top:8px;color:#0c4a6e;'>هذا الإعلان يظهر بنجاح، يمكنك الآن وضع كود AdSense الحقيقي</div>\n</div>"
  },
  "blog_end": {
    "enabled": true,
    "code": "<div style='background:#e0f2fe;border:2px solid #0284c7;padding:25px;text-align:center;border-radius:12px;'>\n  <div style='font-size:20px;font-weight:bold;color:#0369a1;'>📢 إعلانك هنا - TOP 1</div>\n  <div style='margin-top:8px;color:#0c4a6e;'>هذا الإعلان يظهر بنجاح، يمكنك الآن وضع كود AdSense الحقيقي</div>\n</div>"
  }
} as const satisfies AdsConfig;
