"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ADS_MANAGER_ADMIN_UID } from "@/lib/ads-manager";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";

type SocialLinks = {
  facebook: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  youtube: string;
};

const emptyLinks: SocialLinks = { facebook: "", instagram: "", linkedin: "", whatsapp: "", youtube: "" };
const fields: { key: keyof SocialLinks; label: string; placeholder: string; type: "url" | "tel" }[] = [
  { key: "facebook", label: "Facebook URL", placeholder: "https://facebook.com/your-page", type: "url" },
  { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/your-account", type: "url" },
  { key: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/company/your-page", type: "url" },
  { key: "whatsapp", label: "WhatsApp Number", placeholder: "+212600000000", type: "tel" },
  { key: "youtube", label: "YouTube URL", placeholder: "https://youtube.com/@your-channel", type: "url" },
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
    let timer: number | undefined;
    try {
      return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
        if (currentUser && currentUser.uid !== ADS_MANAGER_ADMIN_UID) {
          void signOut(getFirebaseAuth()).catch((authError) => console.error("Could not sign out unauthorized Firebase user.", authError));
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
      timer = window.setTimeout(() => {
        setError(firebaseErrorMessage(authError));
        setAuthReady(true);
      }, 0);
    }
    return () => { if (timer !== undefined) window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getDoc(doc(getFirebaseFirestore(), "settings", "socialLinks")).then((snapshot) => {
      if (!active) return;
      if (!snapshot.exists()) {
        setLinks(emptyLinks);
        return;
      }
      const data = snapshot.data();
      setLinks(Object.fromEntries(fields.map(({ key }) => [key, typeof data[key] === "string" ? data[key] : ""])) as SocialLinks);
    }).catch((loadError: unknown) => {
      if (active) setError(firebaseErrorMessage(loadError));
    });
    return () => { active = false; };
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!user) {
      setPending(true);
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
      return;
    }

    const normalized: SocialLinks = {
      ...links,
      whatsapp: links.whatsapp.trim(),
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

    setPending(true);
    try {
      await setDoc(doc(getFirebaseFirestore(), "settings", "socialLinks"), {
        ...normalized,
        updatedAt: serverTimestamp(),
      });
      setLinks(normalized);
      setSuccess("تم الحفظ");
    } catch (saveError) {
      setError(firebaseErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-kicker">إعدادات التذييل</span><h1>التحكم في مواقع التواصل الاجتماعي</h1><p>تظهر الروابط المحفوظة مباشرة في تذييل الموقع.</p></div></div>
      <form className="site-settings-form" onSubmit={submit}>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        {success && <p className="admin-success" role="status">{success}</p>}
        <section className="admin-panel-card site-settings-card">
          <div className="admin-card-heading"><div><h2>روابط التواصل</h2><p>تُحفظ في Firestore ضمن settings / socialLinks.</p></div></div>
          {!authReady ? <p role="status">جارٍ التحقق من حساب المدير...</p> : user ? (
            <div className="social-settings-grid">
              {fields.map((field) => (
                <label className="site-settings-field social-settings-field" key={field.key} htmlFor={`admin-social-${field.key}`}>
                  <span>{field.label}</span>
                  <input id={`admin-social-${field.key}`} type={field.type} dir="ltr" value={links[field.key]} placeholder={field.placeholder} maxLength={500} onChange={(event) => setLinks((current) => ({ ...current, [field.key]: event.target.value }))} />
                </label>
              ))}
            </div>
          ) : (
            <div className="social-settings-grid">
              <label className="site-settings-field social-settings-field" htmlFor="admin-social-email"><span>البريد الإلكتروني للمدير</span><input id="admin-social-email" type="email" autoComplete="username" dir="ltr" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="site-settings-field social-settings-field" htmlFor="admin-social-password"><span>كلمة المرور</span><input id="admin-social-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            </div>
          )}
        </section>
        <div className="site-settings-submit">
          <p>يُسمح بالكتابة لحساب مدير Firebase المعتمد فقط.</p>
          <button className="admin-button admin-button-primary" type="submit" disabled={!authReady || pending}>{pending ? "جارٍ الحفظ..." : user ? "حفظ" : "تسجيل الدخول"}</button>
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

function firebaseErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "بيانات تسجيل الدخول غير صحيحة.",
      "auth/network-request-failed": "تعذر الاتصال بـ Firebase. تحقق من اتصال الإنترنت.",
      "permission-denied": "رفض Firestore العملية. تحقق من نشر القواعد وصلاحية UID المدير.",
      unavailable: "Firestore غير متاح حاليًا.",
    };
    return messages[error.code] ?? `تعذر إكمال العملية (${error.code}).`;
  }
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
}
