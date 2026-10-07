"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createDefaultSitePreferences } from "@/lib/site-preferences";

type SocialLinks = ReturnType<typeof createDefaultSitePreferences>["socialLinks"];

const fields: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/your-page" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/your-account" },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@your-account" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "+212600000000 أو رابط wa.me" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@your-channel" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/your-page" },
  { key: "x", label: "X", placeholder: "https://x.com/your-account" },
];

function isSocialLinks(value: unknown): value is SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const links = value as Record<string, unknown>;
  return fields.every(({ key }) => typeof links[key] === "string");
}

export function AdminSocialSettings() {
  const [links, setLinks] = useState<SocialLinks>(() => createDefaultSitePreferences().socialLinks);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadLinks() {
      try {
        const response = await fetch("/api/social-links", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok || !isSocialLinks(result)) {
          const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "تعذر تحميل روابط التواصل المشتركة.";
          throw new Error(message);
        }
        if (active) setLinks(result);
      } catch (loadError) {
        console.error("Could not load shared social links in admin.", loadError);
        if (active) setError(loadError instanceof Error ? loadError.message : "تعذر تحميل روابط التواصل.");
      } finally {
        if (active) setReady(true);
      }
    }
    void loadLinks();
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    for (const field of fields) {
      const value = links[field.key].trim();
      if (!value) continue;
      if (field.key === "whatsapp" && !/^https?:\/\//i.test(value)) {
        const number = value.replace(/\D/g, "");
        if (number.length < 7 || number.length > 15) {
          setError("أدخل رقم WhatsApp صحيحًا مع رمز الدولة أو رابطًا كاملًا.");
          return;
        }
        continue;
      }
      try {
        const url = new URL(value);
        if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname || url.username || url.password) {
          setError(`رابط ${field.label} غير صالح؛ استخدم رابطًا يبدأ بـ https://.`);
          return;
        }
      } catch {
        setError(`رابط ${field.label} غير صالح؛ استخدم رابطًا يبدأ بـ https://.`);
        return;
      }
    }
    setPending(true);
    try {
      const response = await fetch("/api/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks: links }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "تعذر حفظ روابط التواصل.";
        throw new Error(message);
      }
      window.dispatchEvent(new Event("serviceai-social-links-updated"));
      setNotice("تم حفظ روابط التواصل، وأصبحت متاحة لجميع الزوار ✅");
    } catch (saveError) {
      console.error("Could not save shared social links.", saveError);
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ روابط التواصل.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-kicker">إعدادات التذييل</span><h1>التحكم في مواقع التواصل الاجتماعي</h1><p>تُحفظ الروابط المشتركة على الخادم وتظهر لجميع الزوار والأجهزة.</p></div>
      </div>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}
      <form className="site-settings-form" onSubmit={save}>
        <section className="admin-panel-card site-settings-card">
          <div className="admin-card-heading"><div><h2>روابط التواصل</h2><p>أدخل الرابط أو الرقم. الحقول الفارغة لا تظهر في الفوتر.</p></div></div>
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
                  disabled={!ready || pending}
                  onChange={(event) => {
                    setLinks((current) => ({ ...current, [field.key]: event.target.value }));
                    setNotice("");
                    setError("");
                  }}
                />
              </label>
            ))}
          </div>
        </section>
        <div className="site-settings-submit">
          <p>تظهر الروابط المحفوظة لجميع الزوار بعد تحديث الصفحة.</p>
          <button className="admin-button admin-button-primary" type="submit" disabled={!ready || pending}>
            {pending ? "جارٍ الحفظ..." : "حفظ الروابط"}
          </button>
        </div>
      </form>
    </div>
  );
}
