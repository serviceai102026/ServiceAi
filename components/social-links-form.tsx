"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ADS_MANAGER_ADMIN_UID } from "@/lib/ads-manager";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";
import type { SocialPreferences } from "@/lib/site-preferences";
import { SocialBrandIcon } from "@/components/social-brand-icon";

const socialFields = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "+966 5X XXX XXXX", hint: "أدخل رقمًا بصيغة دولية؛ سيُنشأ رابط wa.me تلقائيًا." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/your-account" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/your-page" },
  { key: "x", label: "X", placeholder: "https://x.com/your-account" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/your-page" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@your-channel" },
] as const;

export function SocialLinksForm({ socialLinks }: { socialLinks: SocialPreferences }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [values, setValues] = useState<SocialPreferences>(socialLinks);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let errorTimer: number | undefined;
    try {
      return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
        if (currentUser && currentUser.uid !== ADS_MANAGER_ADMIN_UID) {
          void signOut(getFirebaseAuth()).catch((authError) => console.error("Could not sign out a non-admin Firebase user.", authError));
          setUser(null);
          setError("هذا الحساب لا يملك صلاحية تعديل روابط التواصل.");
        } else {
          setUser(currentUser);
        }
        setAuthReady(true);
      }, (authError) => {
        setError(authError.message);
        setAuthReady(true);
      });
    } catch (authError) {
      errorTimer = window.setTimeout(() => {
        setError(authError instanceof Error ? authError.message : "تعذر الاتصال بخدمة Firebase.");
        setAuthReady(true);
      }, 0);
    }
    return () => { if (errorTimer !== undefined) window.clearTimeout(errorTimer); };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getDoc(doc(getFirebaseFirestore(), "site_public", "social_links")).then((snapshot) => {
      if (!active || !snapshot.exists()) return;
      const stored = snapshot.data().links;
      if (stored && typeof stored === "object") {
        setValues((current) => ({
          ...current,
          ...Object.fromEntries(
            socialFields.map(({ key }) => [key, typeof stored[key] === "string" ? stored[key] : ""]),
          ),
        }));
      }
    }).catch((loadError: unknown) => {
      if (active) setError(firebaseErrorMessage(loadError));
    });
    return () => { active = false; };
  }, [user]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      if (credential.user.uid !== ADS_MANAGER_ADMIN_UID) {
        await signOut(getFirebaseAuth());
        setError("هذا الحساب لا يملك صلاحية تعديل روابط التواصل.");
      } else {
        setPassword("");
      }
    } catch (loginError) {
      setError(firebaseErrorMessage(loginError));
    } finally {
      setPending(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || user.uid !== ADS_MANAGER_ADMIN_UID) {
      setError("سجّل الدخول بحساب المدير لحفظ الروابط.");
      return;
    }
    const links: SocialPreferences = {
      ...values,
      whatsapp: values.whatsapp.trim().replace(/\D/g, ""),
    };
    if (links.whatsapp && (links.whatsapp.length < 8 || links.whatsapp.length > 15)) {
      setError("أدخل رقم WhatsApp دوليًا مع رمز الدولة، من 8 إلى 15 رقمًا.");
      return;
    }
    for (const key of ["instagram", "facebook", "x", "linkedin", "youtube"] as const) {
      if (links[key].length > 500 || !isValidSocialUrl(links[key])) {
        setError(`أدخل رابط HTTPS صالحًا لحساب ${key}.`);
        return;
      }
    }
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await setDoc(doc(getFirebaseFirestore(), "site_public", "social_links"), {
        links,
        updatedAt: serverTimestamp(),
      });
      setValues(links);
      setSuccess("تم حفظ روابط التواصل بنجاح.");
    } catch (saveError) {
      setError(firebaseErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={user ? save : login} className="site-settings-form">
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {success && <p className="admin-success" role="status">{success}</p>}

      <section className="admin-panel-card site-settings-card">
        <div className="admin-card-heading">
          <div><h2>حسابات التواصل</h2><p>تظهر أيقونات المنصات في التذييل، وتصبح قابلة للنقر بعد إضافة رابط الحساب هنا.</p></div>
        </div>
        {!authReady ? <p role="status">جارٍ التحقق من حساب المدير...</p> : user ? (
          <div className="social-settings-grid">
            {socialFields.map((social) => (
              <label className="site-settings-field social-settings-field" key={social.key} htmlFor={`social-${social.key}`}>
                <span className="social-settings-label"><SocialBrandIcon platform={social.key} size={17} />{social.label}</span>
                <input
                  id={`social-${social.key}`}
                  name={`social.${social.key}`}
                  type={social.key === "whatsapp" ? "tel" : "url"}
                  dir="ltr"
                  value={values[social.key]}
                  onChange={(event) => setValues((current) => ({ ...current, [social.key]: event.target.value }))}
                  placeholder={social.placeholder}
                  maxLength={500}
                />
                {"hint" in social && <small>{social.hint}</small>}
              </label>
            ))}
          </div>
        ) : (
          <div className="social-settings-grid">
            <label className="site-settings-field social-settings-field" htmlFor="social-admin-email">
              <span>البريد الإلكتروني للمدير</span>
              <input id="social-admin-email" type="email" autoComplete="username" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="site-settings-field social-settings-field" htmlFor="social-admin-password">
              <span>كلمة المرور</span>
              <input id="social-admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
          </div>
        )}
      </section>

      <div className="site-settings-submit">
        <p>تُحفظ الروابط في Firestore لتظهر لزوار الموقع على جميع الأجهزة.</p>
        <button className="admin-button admin-button-primary" type="submit" disabled={pending || !authReady}>
          {pending ? (user ? "جارٍ حفظ الروابط..." : "جارٍ تسجيل الدخول...") : user ? "حفظ روابط التواصل" : "تسجيل الدخول"}
        </button>
      </div>
    </form>
  );
}

function isValidSocialUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function firebaseErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة.",
      "auth/too-many-requests": "محاولات كثيرة. حاول مرة أخرى بعد قليل.",
      "auth/network-request-failed": "تعذر الاتصال بـ Firebase. تحقق من اتصال الإنترنت.",
      "permission-denied": "رفض Firestore الحفظ. تحقق من نشر قواعد Firestore وصلاحية UID المدير.",
      "unavailable": "Firestore غير متاح حاليًا. تحقق من اتصال الإنترنت.",
    };
    return messages[error.code] ?? `تعذر إكمال العملية (${error.code}).`;
  }
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
}
