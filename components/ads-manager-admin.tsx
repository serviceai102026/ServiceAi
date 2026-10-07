import { ADS_CONFIG as SITE_ADS_CONFIG } from "@/config/ads";
import { AdsConfigEditor } from "@/components/ads-config-editor";
import { ADS_CONFIG } from "@/lib/ads-config";

export function AdsManagerAdmin() {
  const enabledPlacements = Object.values(ADS_CONFIG).filter(({ enabled }) => enabled).length;
  return (
    <div className="admin-page ads-manager-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">إعدادات الإعلانات المنشورة</span>
          <h1>إدارة إعلانات Google AdSense</h1>
          <p>مصدر الإعلانات هو ملف الإعدادات المنشور، وتظهر التغييرات لجميع الزوار بعد إعادة النشر.</p>
        </div>
        <span className={`admin-status ${SITE_ADS_CONFIG.enabled && enabledPlacements ? "status-published" : "status-draft"}`}>
          {SITE_ADS_CONFIG.enabled ? `${enabledPlacements} مواضع مفعّلة` : "الإعلانات متوقفة"}
        </span>
      </div>
      <AdsConfigEditor showAdsenseId />
    </div>
  );
}
