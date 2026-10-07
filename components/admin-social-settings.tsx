"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { parseSitePreferences } from "@/lib/site-preferences";
import { get, LOCAL_DB_KEYS, subscribe, set } from "@/lib/localDB";

type SocialLinks = ReturnType<typeof parseSitePreferences>["socialLinks"];

const fields: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/your-page" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/your-account" },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@your-account" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "+212600000000 أو رابط wa.me" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@your-channel" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/your-page" },
  { key: "x", label: "X", placeholder: "https://x.com/your-account" },
];

function subscribePreferences(onChange: () => void) {
  return subscribe((key) => {
    if (key === LOCAL_DB_KEYS.preferences) onChange();
  });
}

function getPreferencesSnapshot() {
  return window.localStorage.getItem("serviceai:preferences") ?? "";
}

function getServerPreferencesSnapshot() {
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function AdminSocialSettings() {
  const snapshot = useSyncExternalStore(subscribePreferences, getPreferencesSnapshot, getServerPreferencesSnapshot);
  let links: SocialLinks = parseSitePreferences({}).socialLinks;
  let loadError = "";
  try {
    const stored: unknown = snapshot ? JSON.parse(snapshot) : {};
    if (!isRecord(stored)) {
      throw new Error("Stored preferences must be an object.");
    }
    links = parseSitePreferences(stored).socialLinks;
  } catch (error) {
    console.error("Could not load social links from local storage.", error);
    loadError = "تعذر قراءة روابط التواصل المحفوظة. صحح بيانات التخزين المحلي قبل حفظ روابط جديدة.";
  }
  const [notice, setNotice] = useState("");

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-kicker">إعدادات التذييل</span><h1>التحكم في مواقع التواصل الاجتماعي</h1><p>تُحفظ الروابط في هذا المتصفح وتظهر في الفوتر دون Firebase.</p></div>
      </div>
      {loadError && <p className="admin-alert" role="alert">{loadError}</p>}
      {notice && <p className={notice.startsWith("تعذر") ? "admin-alert" : "admin-success"} role={notice.startsWith("تعذر") ? "alert" : "status"}>{notice}</p>}
      <SocialLinksEditor key={snapshot} initialLinks={links} onNotice={setNotice} />
    </div>
  );
}

function SocialLinksEditor({
  initialLinks,
  onNotice,
}: {
  initialLinks: SocialLinks;
  onNotice: (message: string) => void;
}) {
  const [links, setLinks] = useState(initialLinks);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    for (const field of fields) {
      const value = links[field.key].trim();
      if (!value) continue;
      if (field.key === "whatsapp" && !/^https?:\/\//i.test(value)) {
        const number = value.replace(/\D/g, "");
        if (number.length < 7 || number.length > 15) {
          onNotice("أدخل رقم WhatsApp صحيحًا مع رمز الدولة أو رابطًا كاملًا.");
          return;
        }
        continue;
      }
      try {
        const url = new URL(value);
        if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname || url.username || url.password) {
          onNotice(`رابط ${field.label} غير صالح؛ استخدم رابطًا يبدأ بـ https://.`);
          return;
        }
      } catch {
        onNotice(`رابط ${field.label} غير صالح؛ استخدم رابطًا يبدأ بـ https://.`);
        return;
      }
    }
    try {
      set(LOCAL_DB_KEYS.preferences, {
        ...get<Record<string, unknown>>(LOCAL_DB_KEYS.preferences, {}),
        social_links: links,
      });
      onNotice("تم حفظ روابط التواصل بنجاح ✅");
    } catch (error) {
      console.error("Could not save social links to local storage.", error);
      onNotice(error instanceof Error ? `تعذر حفظ الروابط: ${error.message}` : "تعذر حفظ روابط التواصل.");
    }
  }

  return (
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
                onChange={(event) => {
                  setLinks((current) => ({ ...current, [field.key]: event.target.value }));
                  onNotice("");
                }}
              />
            </label>
          ))}
        </div>
      </section>
      <div className="site-settings-submit">
        <p>الإعدادات محلية لهذا المتصفح فقط.</p>
        <button className="admin-button admin-button-primary" type="submit">حفظ الروابط</button>
      </div>
    </form>
  );
}
