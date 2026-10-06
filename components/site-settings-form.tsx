"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ADSENSE_POSITIONS,
  ADSENSE_SETTINGS_KEY,
  createDefaultAdsenseSettings,
  parseAdsenseSettings,
  saveAdsenseSettings,
  type AdsenseSettings,
} from "@/lib/adsense-settings";

function subscribeAdsenseSettings(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ADSENSE_SETTINGS_KEY) onChange();
  };
  window.addEventListener("adsense-settings-updated", onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("adsense-settings-updated", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getAdsenseSnapshot() {
  return window.localStorage.getItem(ADSENSE_SETTINGS_KEY);
}

function getServerAdsenseSnapshot() {
  return null;
}

export function SiteSettingsForm() {
  const snapshot = useSyncExternalStore(subscribeAdsenseSettings, getAdsenseSnapshot, getServerAdsenseSnapshot);
  let initialSettings = createDefaultAdsenseSettings();
  let loadError = "";
  try {
    initialSettings = parseAdsenseSettings(snapshot);
  } catch (error) {
    console.error("Could not load local AdSense settings.", error);
    loadError = error instanceof Error ? error.message : "تعذر تحميل إعدادات الإعلانات المحفوظة.";
  }
  const [notice, setNotice] = useState("");

  return (
    <>
      {(loadError || notice) && <p className={loadError ? "admin-alert" : "admin-success"} role={loadError ? "alert" : "status"}>{loadError || notice}</p>}
      <AdsenseSettingsEditor
        key={snapshot ?? "default"}
        initialSettings={initialSettings}
        onNotice={setNotice}
      />
    </>
  );
}

function AdsenseSettingsEditor({
  initialSettings,
  onNotice,
}: {
  initialSettings: AdsenseSettings;
  onNotice: (message: string) => void;
}) {
  const [settings, setSettings] = useState(initialSettings);

  function updatePublisherId(publisherId: string) {
    setSettings((current) => ({ ...current, publisherId }));
    onNotice("");
  }

  function updateSlot(id: AdsenseSettings["slots"][number]["id"], changes: Partial<Pick<AdsenseSettings["slots"][number], "slot" | "enabled">>) {
    setSettings((current) => ({
      ...current,
      slots: current.slots.map((slot) => slot.id === id ? { ...slot, ...changes } : slot),
    }));
    onNotice("");
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settings.publisherId && !/^ca-pub-[0-9]{16}$/.test(settings.publisherId)) {
      onNotice("أدخل معرّف ناشر صحيحًا يبدأ بـ ca-pub- ويتبعه 16 رقمًا.");
      return;
    }
    const invalidSlot = settings.slots.find((slot) => !/^[0-9]{0,32}$/.test(slot.slot));
    if (invalidSlot) {
      onNotice(`رقم الوحدة الإعلانية غير صالح في الموضع «${invalidSlot.position}».`);
      return;
    }
    const missingSlot = settings.slots.find((slot) => slot.enabled && !slot.slot);
    if (missingSlot) {
      onNotice(`أدخل رقم الوحدة للموضع «${missingSlot.position}» أو أوقف تفعيله.`);
      return;
    }
    if (settings.slots.some((slot) => slot.enabled) && !settings.publisherId) {
      onNotice("أدخل معرّف الناشر قبل تفعيل أي إعلان.");
      return;
    }

    try {
      saveAdsenseSettings(settings);
      onNotice("تم حفظ إعدادات الإعلانات بنجاح ✅");
    } catch (error) {
      console.error("Could not save local AdSense settings.", error);
      onNotice(error instanceof Error ? error.message : "تعذر حفظ إعدادات الإعلانات.");
    }
  }

  return (
    <form onSubmit={save} className="site-settings-form">
      <section className="admin-panel-card site-settings-card">
        <div className="admin-card-heading">
          <div><h2>Google AdSense</h2><p>الإعدادات محفوظة محليًا في هذا المتصفح، دون Firebase.</p></div>
        </div>
        <label className="site-settings-field" htmlFor="adsense-publisher-id">
          <span>معرّف الناشر (Publisher ID)</span>
          <input
            id="adsense-publisher-id"
            value={settings.publisherId}
            onChange={(event) => updatePublisherId(event.target.value.trim())}
            placeholder="ca-pub-0000000000000000"
            dir="ltr"
            autoComplete="off"
          />
        </label>
        <p className="adsense-admin-help">أدخل رقم الوحدة الإعلانية لكل موضع، وفعّل المربع لعرض الإعلان. يتم حفظ الإعدادات تحت المفتاح adsense_settings في localStorage.</p>
        <div className="ad-placement-list">
          {ADSENSE_POSITIONS.map((position) => {
            const slot = settings.slots.find((item) => item.id === position.id);
            if (!slot) return null;
            return (
              <article className="ad-placement-row" key={position.id}>
                <div className="ad-placement-copy"><strong>{position.position}</strong></div>
                <label className="ad-placement-toggle">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(event) => updateSlot(slot.id, { enabled: event.target.checked })}
                  />
                  <span>تفعيل الإعلان</span>
                </label>
                <label className="site-settings-field ad-slot-input" htmlFor={`slot-${slot.id}`}>
                  <span>رقم الوحدة (Ad Slot)</span>
                  <input
                    id={`slot-${slot.id}`}
                    inputMode="numeric"
                    pattern="[0-9]{1,32}"
                    maxLength={32}
                    value={slot.slot}
                    onChange={(event) => updateSlot(slot.id, { slot: event.target.value.trim() })}
                    placeholder="مثال: 1234567890"
                    dir="ltr"
                  />
                </label>
              </article>
            );
          })}
        </div>
      </section>
      <div className="site-settings-submit">
        <p>تُحفظ الإعدادات في هذا المتصفح فقط.</p>
        <button className="admin-button admin-button-primary" type="submit">حفظ الإعدادات</button>
      </div>
    </form>
  );
}
