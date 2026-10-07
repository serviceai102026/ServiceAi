"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { BLOG_AD_FIELDS, createDefaultBlogAdsSettings, parseBlogAdsSettings, type BlogAdsSettings } from "@/lib/blog-ads";
import { ADS_MANAGER_ADMIN_UID } from "@/lib/ads-manager";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";

function firebaseError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة.",
      "auth/network-request-failed": "تعذر الاتصال بخدمة Firebase.",
      "permission-denied": "رفض Firestore العملية. تحقق من نشر قواعد settings/ads.",
      "unavailable": "خدمة Firestore غير متاحة حاليًا.",
    };
    return messages[error.code] ?? `تعذر إكمال العملية (${error.code}).`;
  }
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
}

export function BlogAdsSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [settings, setSettings] = useState<BlogAdsSettings>(createDefaultBlogAdsSettings);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
        if (currentUser && currentUser.uid !== ADS_MANAGER_ADMIN_UID) {
          void signOut(getFirebaseAuth()).catch((signOutError) => console.error("Could not sign out unauthorized blog ad user.", signOutError));
          setUser(null);
          setError("هذا الحساب لا يملك صلاحية تعديل إعلانات المقالات.");
        } else {
          setUser(currentUser);
        }
        setAuthReady(true);
      }, (authError) => {
        setError(firebaseError(authError));
        setAuthReady(true);
      });
    } catch (authError) {
      const message = firebaseError(authError);
      queueMicrotask(() => {
        setError(message);
        setAuthReady(true);
      });
      return undefined;
    }
  }, []);

  useEffect(() => {
    try {
      return onSnapshot(doc(getFirebaseFirestore(), "settings", "ads"), (snapshot) => {
        setSettings(parseBlogAdsSettings(snapshot.exists() ? snapshot.data() : {}));
      }, (loadError) => {
        setError(firebaseError(loadError));
      });
    } catch (loadError) {
      const message = firebaseError(loadError);
      queueMicrotask(() => setError(message));
      return undefined;
    }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      if (credential.user.uid !== ADS_MANAGER_ADMIN_UID) {
        await signOut(getFirebaseAuth());
        setError("هذا الحساب لا يملك صلاحية تعديل إعلانات المقالات.");
      } else {
        setPassword("");
      }
    } catch (loginError) {
      setError(firebaseError(loginError));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || user.uid !== ADS_MANAGER_ADMIN_UID) {
      setError("سجّل الدخول بحساب المدير لحفظ إعلانات المقالات.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await setDoc(doc(getFirebaseFirestore(), "settings", "ads"), settings, { merge: true });
      setNotice("تم حفظ إعلانات المقالات بنجاح.");
    } catch (saveError) {
      setError(firebaseError(saveError));
    } finally {
      setBusy(false);
    }
  }

  function updateSetting(key: keyof BlogAdsSettings, value: string | boolean) {
    setSettings((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  return (
    <section className="admin-panel-card blog-ads-settings">
      <div className="admin-card-heading">
        <div><h2>إعلانات المقالات</h2><p>ثلاثة مواضع مستقلة تُحفظ في Firestore داخل settings/ads.</p></div>
        {user?.uid === ADS_MANAGER_ADMIN_UID && <span className="admin-status status-published">مدير الإعلانات متصل</span>}
      </div>
      {!authReady && <p role="status">جارٍ التحقق من صلاحية المدير...</p>}
      {authReady && !user && (
        <form className="ads-login-form blog-ads-login" onSubmit={login}>
          <label>البريد الإلكتروني<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>كلمة المرور<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="admin-button admin-button-secondary" type="submit" disabled={busy}>{busy ? "جارٍ الدخول..." : "دخول مدير الإعلانات"}</button>
        </form>
      )}
      {user?.uid === ADS_MANAGER_ADMIN_UID && (
        <button className="admin-button admin-button-secondary blog-ads-signout" type="button" onClick={() => void signOut(getFirebaseAuth())}>تسجيل الخروج من الإعلانات</button>
      )}
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}
      <form className="site-settings-form" onSubmit={save}>
        {BLOG_AD_FIELDS.map(({ key, label, after }) => {
          const enabledKey = `${key}_enabled` as `${typeof key}_enabled`;
          const codeKey = `${key}_code` as `${typeof key}_code`;
          return (
            <article className="ad-placement-row blog-ad-row" key={key}>
              <div className="ad-placement-copy"><strong>{label}</strong><small>{after}</small></div>
              <label className="ad-placement-toggle">
                <input type="checkbox" checked={settings[enabledKey]} onChange={(event) => updateSetting(enabledKey, event.target.checked)} />
                <span>تفعيل الإعلان</span>
              </label>
              <label className="site-settings-field ad-slot-input" htmlFor={`${key}-code`}>
                <span>رقم AdSense أو كود HTML</span>
                <textarea
                  id={`${key}-code`}
                  rows={4}
                  maxLength={20000}
                  dir="ltr"
                  value={settings[codeKey]}
                  onChange={(event) => updateSetting(codeKey, event.target.value)}
                  placeholder="ضع رقم الوحدة أو كود HTML كاملًا للاختبار"
                />
              </label>
            </article>
          );
        })}
        <div className="site-settings-submit">
          <p>تظهر المواضع المفعّلة فقط. لا تغيّر هذه الإعدادات مواضع AdSense القديمة.</p>
          <button className="admin-button admin-button-primary" type="submit" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ إعلانات المقالات"}</button>
        </div>
      </form>
    </section>
  );
}
