import { ADS_CONFIG } from "@/config/ads";

const controlledPages = [
  { label: "الصفحة الرئيسية", enabled: ADS_CONFIG.showOnHomepage },
  { label: "المدونة ومقالاتها", enabled: ADS_CONFIG.showOnBlog },
];

export function AdsManagerAdmin() {
  return (
    <section className="admin-panel-card">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">إعداد محلي بدون Firebase</span>
          <h1>التحكم في الإعلانات</h1>
          <p>مصدر الإعدادات الوحيد هو الملف config/ads.ts.</p>
        </div>
        <span className={`admin-status ${ADS_CONFIG.enabled ? "status-published" : "status-draft"}`}>
          {ADS_CONFIG.enabled ? "الإعلانات مفعّلة" : "الإعلانات متوقفة"}
        </span>
      </div>
      <div className="ads-manager-toolbar">
        {controlledPages.map(({ label, enabled }) => (
          <div className="admin-stat-card" key={label}>
            <span>{label}</span>
            <strong>{enabled ? "مفعّلة" : "متوقفة"}</strong>
          </div>
        ))}
      </div>
      <div className="admin-card-heading">
        <div>
          <h2>صفحات لا تعرض الإعلانات</h2>
          <p>هذه الاستثناءات تطبّق على جميع مواضع الإعلانات.</p>
        </div>
      </div>
      <ul>
        {ADS_CONFIG.hideOnPages.map((page) => <li key={page} dir="ltr">{page}</li>)}
      </ul>
      <p className="ads-manager-notice" role="note">
        لتفعيل الإعلانات أو إيقافها بالكامل، غيّر قيمة <code>enabled</code> في <code>config/ads.ts</code>.
        إعدادات الصفحة الرئيسية والمدونة والاستثناءات تُعدّل من الملف نفسه.
      </p>
    </section>
  );
}
