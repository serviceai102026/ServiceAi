"use client";

import { useState, type FormEvent } from "react";
import type { SocialPreferences } from "@/lib/site-preferences";
import { get, LOCAL_DB_KEYS, set } from "@/lib/localDB";
import { parseSitePreferences } from "@/lib/site-preferences";
import { useLocalDBValue } from "@/lib/use-local-db";

const fields: { key: keyof SocialPreferences; label: string; placeholder: string; type: "url" | "tel" }[] = [
  { key: "facebook", label: "Facebook URL", placeholder: "https://facebook.com/your-page", type: "url" },
  { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/your-account", type: "url" },
  { key: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/company/your-page", type: "url" },
  { key: "whatsapp", label: "WhatsApp Number", placeholder: "+212600000000", type: "tel" },
  { key: "youtube", label: "YouTube URL", placeholder: "https://youtube.com/@your-channel", type: "url" },
];

export function AdminSocialSettings() {
  const stored = useLocalDBValue<Record<string, unknown>>(LOCAL_DB_KEYS.preferences, {});
  const { socialLinks } = parseSitePreferences(stored);
  const [draft, setDraft] = useState<SocialPreferences | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const values = draft ?? socialLinks;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalized: SocialPreferences = {
      ...values,
      whatsapp: values.whatsapp.trim(),
    };
    if (normalized.whatsapp && normalized.whatsapp.replace(/\D/g, "").length < 8) {
      setError("أدخل رقم WhatsApp دوليًا وصالحًا.");
      return;
    }
    for (const field of fields) {
      if (field.key === "whatsapp" || !normalized[field.key]) continue;
      if (!isHttpsUrl(normalized[field.key])) {
        setError(`أدخل رابط HTTPS صالحًا لحساب ${field.label}.`);
        return;
      }
    }

    try {
      const current = get<Record<string, unknown>>(LOCAL_DB_KEYS.preferences, {});
      set(LOCAL_DB_KEYS.preferences, { ...current, social_links: normalized });
      setDraft(normalized);
      setSuccess("تم الحفظ");
    } catch (saveError) {
      console.error("Could not save local social links.", saveError);
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ روابط التواصل.");
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-kicker">إعدادات التذييل</span><h1>التحكم في مواقع التواصل الاجتماعي</h1><p>تُحفظ الروابط محليًا في هذا المتصفح وتظهر في الفوتر عند فتح الموقع منه.</p></div></div>
      <form className="site-settings-form" onSubmit={save}>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        {success && <p className="admin-success" role="status">{success}</p>}
        <section className="admin-panel-card site-settings-card">
          <div className="admin-card-heading"><div><h2>روابط التواصل</h2><p>إعداد محلي لهذا المتصفح، دون اتصال بـ Firebase.</p></div></div>
          <div className="social-settings-grid">
            {fields.map((field) => (
              <label className="site-settings-field social-settings-field" key={field.key} htmlFor={`admin-social-${field.key}`}>
                <span>{field.label}</span>
                <input id={`admin-social-${field.key}`} type={field.type} dir="ltr" value={values[field.key]} placeholder={field.placeholder} maxLength={500} onChange={(event) => setDraft((current) => ({ ...(current ?? socialLinks), [field.key]: event.target.value }))} />
              </label>
            ))}
          </div>
        </section>
        <div className="site-settings-submit">
          <p>تعمل هذه الإعدادات على هذا المتصفح فقط.</p>
          <button className="admin-button admin-button-primary" type="submit">حفظ</button>
        </div>
      </form>
    </div>
  );
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
