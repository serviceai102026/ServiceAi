"use client";

import { useEffect, useState, type FormEvent } from "react";

export type SocialLinks = {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  youtube: string;
};

const fields: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/your-page" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/your-account" },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@your-account" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/212600000000 أو رقم الهاتف" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@your-channel" },
];

const emptyLinks: SocialLinks = { facebook: "", instagram: "", tiktok: "", whatsapp: "", youtube: "" };

export function AdminSocialSettings() {
  const [links, setLinks] = useState<SocialLinks>(emptyLinks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/social", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        return response.json() as Promise<SocialLinks>;
      })
      .then((data) => {
        if (active) setLinks(data);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "تعذر تحميل روابط التواصل.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(links),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const result = await response.json() as { links: SocialLinks };
      setLinks(result.links);
      setSuccess("تم الحفظ");
      window.alert("تم الحفظ ✅");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "تعذر حفظ روابط التواصل.";
      setError(message);
      window.alert(`فشل الحفظ\n${message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-kicker">إعدادات التذييل</span><h1>التحكم في مواقع التواصل الاجتماعي</h1><p>أدخل الروابط التي تريد إظهارها في تذييل الموقع.</p></div>
      </div>
      <form className="site-settings-form" onSubmit={save}>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        {success && <p className="admin-success" role="status">{success}</p>}
        <section className="admin-panel-card site-settings-card">
          <div className="admin-card-heading"><div><h2>روابط التواصل</h2><p>الحقول الفارغة لا تظهر في التذييل.</p></div></div>
          {loading ? <p role="status">جارٍ تحميل الروابط...</p> : (
            <div className="social-settings-grid">
              {fields.map((field) => (
                <label className="site-settings-field social-settings-field" key={field.key} htmlFor={`admin-social-${field.key}`}>
                  <span>{field.label}</span>
                  <input
                    id={`admin-social-${field.key}`}
                    type="text"
                    dir="ltr"
                    value={links[field.key]}
                    placeholder={field.placeholder}
                    onChange={(event) => setLinks((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}
        </section>
        <div className="site-settings-submit">
          <p>تُحفظ الروابط في ملف JSON.</p>
          <button className="admin-button admin-button-primary" type="submit" disabled={loading || saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      </form>
    </div>
  );
}

async function readApiError(response: Response) {
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Use the HTTP status when the response isn't JSON.
  }
  return `تعذر إكمال الطلب (HTTP ${response.status}).`;
}
