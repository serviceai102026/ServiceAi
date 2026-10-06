"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ADS_MANAGER_ADMIN_UID } from "@/lib/ads-manager";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";

type SocialLinks = {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  youtube: string;
};

const emptyLinks: SocialLinks = { facebook: "", instagram: "", tiktok: "", whatsapp: "", youtube: "" };
const fields: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/your-page" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/your-account" },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@your-account" },
  { key: "whatsapp", label: "WhatsApp Number", placeholder: "+212600000000" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@your-channel" },
];

export function AdminSocialSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [links, setLinks] = useState<SocialLinks>(emptyLinks);
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
          void signOut(getFirebaseAuth()).catch((authError) => console.error("Could not sign out unauthorized social settings user.", authError));
          setUser(null);
          setError("هذا الحساب لا يملك صلاحية تعديل روابط التواصل.");
        } else {
          setUser(currentUser);
        }
        setAuthReady(true);
      }, (authError) => {
        setError(firebaseErrorMessage(authError));
        setAuthReady(true);
      });
    } catch (authError) {
      errorTimer = window.setTimeout(() => {
        setError(firebaseErrorMessage(authError));
        setAuthReady(true);
      }, 0);
    }
    return () => { if (errorTimer !== undefined) window.clearTimeout(errorTimer); };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getDoc(doc(getFirebaseFirestore(), "settings", "social")).then((snapshot) => {
      if (!active) return;
      if (!snapshot.exists()) {
        setLinks(emptyLinks);
        return;
      }
      const stored = snapshot.data();
      setLinks({
        facebook: typeof stored.facebook === "string" ? stored.facebook : "",
        instagram: typeof stored.instagram === "string" ? stored.instagram : "",
        tiktok: typeof stored.tiktok === "string" ? stored.tiktok : "",
        whatsapp: typeof stored.whatsapp === "string" ? stored.whatsapp : "",
        youtube: typeof stored.youtube === "string" ? stored.youtube : "",
      });
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
    } catch (authError) {
      setError(firebaseErrorMessage(authError));
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
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await setDoc(doc(getFirebaseFirestore(), "settings", "social"), links, { merge: true });
      setSuccess("تم الحفظ");
    } catch (saveError) {
      setError(firebaseErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  if (!authReady) return <div className="admin-panel-card" role="status">جارٍ التحقق من Firebase Authentication...</div>;
  if (!user) {
    return (
      <section className="admin-panel-card ads-login-card">
        <div className="admin-page-heading"><div><span className="admin-kicker">تسجيل دخول المدير</span><h2>تسجيل الدخول لتعديل الروابط</h2></div></div>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        <form className="ads-login-form" onSubmit={login}>
          <label>البريد الإلكتروني<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>كلمة المرور<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="admin-button admin-button-primary" type="submit" disabled={pending}>{pending ? "جارٍ الدخول..." : "دخول"}</button>
        </form>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-kicker">إعدادات التذييل</span><h1>التحكم في مواقع التواصل الاجتماعي</h1><p>تُحفظ الروابط في Firestore وتظهر في الفوتر.</p></div>
        <button className="admin-button admin-button-secondary" type="button" onClick={() => void signOut(getFirebaseAuth())}>تسجيل الخروج</button>
      </div>
      <form className="site-settings-form" onSubmit={save}>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        {success && <p className="admin-success" role="status">{success}</p>}
        <section className="admin-panel-card site-settings-card">
          <div className="admin-card-heading"><div><h2>روابط التواصل</h2><p>أدخل الروابط أو رقم WhatsApp. اترك الحقل فارغًا لإخفاء أيقونته.</p></div></div>
          <div className="social-settings-grid">
            {fields.map((field) => (
              <label className="site-settings-field social-settings-field" key={field.key} htmlFor={`admin-social-${field.key}`}>
                <span>{field.label}</span>
                <input id={`admin-social-${field.key}`} type="text" dir="ltr" value={links[field.key]} placeholder={field.placeholder} onChange={(event) => setLinks((current) => ({ ...current, [field.key]: event.target.value }))} />
              </label>
            ))}
          </div>
        </section>
        <div className="site-settings-submit">
          <p>تُحفظ الروابط مباشرة في Firestore.</p>
          <button className="admin-button admin-button-primary" type="submit" disabled={pending}>{pending ? "جارٍ الحفظ..." : "حفظ"}</button>
        </div>
      </form>
    </div>
  );
}

function firebaseErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "بيانات تسجيل الدخول غير صحيحة.",
      "auth/network-request-failed": "تعذر الاتصال بـ Firebase. تحقق من الإنترنت.",
      "permission-denied": "رفض Firestore الحفظ. انشر قواعد Firestore المحدّثة وتأكد من UID المدير.",
      unavailable: "Firestore غير متاح حاليًا.",
    };
    return messages[error.code] ?? `تعذر إكمال العملية (${error.code}).`;
  }
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
}
