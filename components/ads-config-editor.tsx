"use client";

import { useState, type FormEvent } from "react";
import { ADS_CONFIG, type AdsConfig, type AdsPlacement } from "@/lib/ads-config";

const placements: { id: AdsPlacement; title: string; description: string }[] = [
  { id: "top", title: "إعلانات الأدوات — أعلى الصفحة", description: "تظهر بعد عنوان كل أداة." },
  { id: "middle", title: "إعلانات الأدوات — وسط الصفحة", description: "تظهر بعد أداة التحويل أو في منتصف المحتوى." },
  { id: "bottom", title: "إعلانات الأدوات — أسفل الصفحة", description: "تظهر قبل تذييل كل صفحة أداة." },
  { id: "blog_top", title: "أعلى المقال", description: "تظهر بعد الفقرة الأولى." },
  { id: "blog_middle", title: "وسط المقال", description: "تظهر بعد منتصف فقرات المقال." },
  { id: "blog_end", title: "نهاية المقال", description: "تظهر قبل المقالات ذات الصلة." },
];

export function AdsConfigEditor() {
  const [settings, setSettings] = useState<AdsConfig>(() => JSON.parse(JSON.stringify(ADS_CONFIG)) as AdsConfig);
  const [writeToken, setWriteToken] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function updatePlacement(id: AdsPlacement, update: Partial<AdsConfig[AdsPlacement]>) {
    setSettings((current) => ({
      ...current,
      [id]: { ...current[id], ...update },
    }));
    setNotice("");
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (!writeToken.trim()) {
      setError("أدخل رمز الكتابة المضبوط في إعدادات بيئة Vercel.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/admin/save-ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${writeToken.trim()}`,
        },
        body: JSON.stringify({ adsConfig: settings }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "تعذر حفظ إعدادات الإعلانات.";
        throw new Error(message);
      }
      setNotice("تم الحفظ وسيتم تحديث الموقع خلال دقيقة في Vercel");
      setWriteToken("");
    } catch (saveError) {
      console.error("Could not save ad configuration.", saveError);
      setError(saveError instanceof Error ? saveError.message : "تعذر الاتصال بخدمة حفظ الإعلانات.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="admin-panel-card blog-ads-settings">
      <div className="admin-card-heading">
        <div>
          <h2>إعدادات الإعلانات المنشورة</h2>
          <p>تُحفظ التغييرات في GitHub وتطلق نشرًا جديدًا للموقع لتظهر لجميع الزوار.</p>
        </div>
        <span className="admin-status status-published">النشر عبر GitHub</span>
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
                disabled={pending}
                onChange={(event) => updatePlacement(id, { enabled: event.target.checked })}
              />
              <span>تفعيل الإعلان</span>
            </label>
            <label className="site-settings-field ad-slot-input" htmlFor={`${id}-code`}>
              <span>رقم الوحدة أو كود الإعلان الكامل</span>
              <textarea
                id={`${id}-code`}
                rows={4}
                maxLength={20000}
                dir="ltr"
                value={settings[id].code}
                disabled={pending}
                onChange={(event) => updatePlacement(id, { code: event.target.value })}
                placeholder="أدخل كود AdSense الكامل أو كود HTML آمنًا"
              />
            </label>
          </article>
        ))}
        <label className="site-settings-field" htmlFor="ads-config-write-token">
          <span>رمز الكتابة السري</span>
          <input
            id="ads-config-write-token"
            type="password"
            autoComplete="off"
            value={writeToken}
            disabled={pending}
            onChange={(event) => { setWriteToken(event.target.value); setError(""); }}
            placeholder="أدخل ADS_CONFIG_WRITE_TOKEN"
          />
          <small>يُستخدم لهذا الحفظ فقط ولا يُخزّن في المتصفح أو ملف الإعدادات.</small>
        </label>
        <div className="site-settings-submit">
          <button className="admin-button admin-button-primary" type="submit" disabled={pending}>
            {pending ? "جارٍ الحفظ..." : "حفظ ونشر الإعدادات"}
          </button>
        </div>
      </form>
    </section>
  );
}
