import { ADS_CONFIG } from "@/config/ads";
import { AdsConfigEditor } from "@/components/ads-config-editor";
import { SiteSettingsForm } from "@/components/site-settings-form";

export function AdsManagerAdmin() {
  return (
    <div className="admin-page ads-manager-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">تحكم محلي بدون Firebase</span>
          <h1>إدارة إعلانات Google AdSense</h1>
          <p>عدّل معرّف الناشر ومواضع الإعلانات؛ تُحفظ الإعدادات في هذا المتصفح.</p>
        </div>
        <span className={`admin-status ${ADS_CONFIG.enabled ? "status-published" : "status-draft"}`}>
          {ADS_CONFIG.enabled ? "الإعلانات مفعّلة" : "الإعلانات متوقفة"}
        </span>
      </div>
      <SiteSettingsForm />
      <AdsConfigEditor />
    </div>
  );
}
