"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ADS_CONFIG, ADS_CONFIG_STORAGE_KEY, exportAdsConfigModule, parseAdsConfig, type AdsConfig, type AdsPlacement } from "@/lib/ads-config";

const placements: { id: AdsPlacement; title: string; description: string }[] = [
  { id: "top", title: "إعلانات الأدوات — أعلى الصفحة", description: "تظهر بعد عنوان كل أداة." },
  { id: "bottom", title: "إعلانات الأدوات — أسفل الصفحة", description: "تظهر قبل تذييل كل صفحة أداة." },
  { id: "blog_top", title: "أعلى المقال", description: "تظهر بعد الفقرة الأولى." },
  { id: "blog_middle", title: "وسط المقال", description: "تظهر بعد منتصف فقرات المقال." },
  { id: "blog_end", title: "نهاية المقال", description: "تظهر قبل المقالات ذات الصلة." },
];

export function AdsConfigEditor() {
  const [settings, setSettings] = useState<AdsConfig>(() => parseAdsConfig(ADS_CONFIG));
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let savedSettings: AdsConfig | null = null;
    let loadErrorMessage = "";
    try {
      const saved = window.localStorage.getItem(ADS_CONFIG_STORAGE_KEY);
      if (saved) savedSettings = parseAdsConfig(JSON.parse(saved));
    } catch (loadError) {
      console.error("Could not load local ServiceAI ad configuration.", loadError);
      loadErrorMessage = "تعذر قراءة الإعدادات المحلية. تحقق من إعدادات التخزين في المتصفح.";
    }
    queueMicrotask(() => {
      if (savedSettings) setSettings(savedSettings);
      if (loadErrorMessage) setError(loadErrorMessage);
      setReady(true);
    });
  }, []);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      window.localStorage.setItem(ADS_CONFIG_STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event("serviceai-ads-config-updated"));
      setNotice("تم الحفظ - انسخ هذا الكود وضعه في lib/ads-config.ts");
    } catch (saveError) {
      console.error("Could not save local ServiceAI ad configuration.", saveError);
      setError("تعذر حفظ الإعدادات في هذا المتصفح.");
    }
  }

  async function exportSettings() {
    setError("");
    setNotice("");
    try {
      await navigator.clipboard.writeText(exportAdsConfigModule(settings));
      setNotice("تم نسخ ملف الإعدادات كاملًا. الصقه في lib/ads-config.ts ثم ادفع التغييرات.");
    } catch (copyError) {
      console.error("Could not copy the exported ad configuration.", copyError);
      setError("تعذر النسخ تلقائيًا. احفظ الإعدادات أولًا ثم حاول التصدير من متصفح يدعم الحافظة.");
    }
  }

  function updatePlacement(id: AdsPlacement, update: Partial<AdsConfig[AdsPlacement]>) {
    setSettings((current) => ({
      ...current,
      [id]: { ...current[id], ...update },
    }));
    setNotice("");
  }

  return (
    <section className="admin-panel-card blog-ads-settings">
      <div className="admin-card-heading">
        <div><h2>إعدادات الإعلانات المحلية</h2><p>تُحفظ في هذا المتصفح فقط، من دون اتصال بـFirebase.</p></div>
        <span className={`admin-status ${ready ? "status-published" : "status-draft"}`}>{ready ? "تخزين محلي" : "جارٍ التحميل..."}</span>
      </div>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}
      <form className="site-settings-form" onSubmit={save}>
        {placements.map(({ id, title, description }) => (
          <article className="ad-placement-row blog-ad-row" key={id}>
            <div className="ad-placement-copy"><strong>{title}</strong><small>{description}</small></div>
            <label className="ad-placement-toggle">
              <input
                type="checkbox"
                checked={settings[id].enabled}
                disabled={!ready}
                onChange={(event) => updatePlacement(id, { enabled: event.target.checked })}
              />
              <span>تفعيل الإعلان</span>
            </label>
            <label className="site-settings-field ad-slot-input" htmlFor={`${id}-code`}>
              <span>رقم AdSense أو كود الإعلان</span>
              <textarea
                id={`${id}-code`}
                rows={4}
                maxLength={20000}
                dir="ltr"
                value={settings[id].code}
                disabled={!ready}
                onChange={(event) => updatePlacement(id, { code: event.target.value })}
                placeholder="أدخل رقم الوحدة أو كود HTML للإعلان"
              />
            </label>
          </article>
        ))}
        <div className="site-settings-submit">
          <button className="admin-button admin-button-primary" type="submit" disabled={!ready}>حفظ الإعدادات</button>
          <button className="admin-button admin-button-secondary" type="button" disabled={!ready} onClick={() => void exportSettings()}>تصدير الإعدادات</button>
        </div>
      </form>
    </section>
  );
}
