"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ADS_MANAGER_ADMIN_UID, DEFAULT_MANAGED_ADS, sortManagedAds, type AdDevice, type AdType, type ManagedAd } from "@/lib/ads-manager";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";

function firebaseError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة.",
      "auth/too-many-requests": "محاولات كثيرة. حاول مرة أخرى بعد قليل.",
      "auth/user-disabled": "هذا الحساب معطّل في Firebase Authentication.",
      "auth/network-request-failed": "تعذر الاتصال بـ Firebase. تحقق من اتصال الإنترنت.",
      "permission-denied": "رفض Firestore العملية. تأكد من نشر firestore.rules ومن صلاحية UID المدير.",
      "unavailable": "خدمة Firestore غير متاحة حاليًا.",
    };
    return messages[error.code] ?? `تعذر إكمال العملية (${error.code}).`;
  }
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
}

export function AdsManagerAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ads, setAds] = useState<ManagedAd[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let errorTimer: number | undefined;
    try {
      const auth = getFirebaseAuth();
      return onAuthStateChanged(auth, (currentUser) => {
        if (currentUser && currentUser.uid !== ADS_MANAGER_ADMIN_UID) {
          void signOut(auth).catch((signOutError) => console.error("Could not sign out a non-admin Firebase user.", signOutError));
          setUser(null);
          setError("هذا الحساب لا يملك صلاحية إدارة الإعلانات.");
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
      errorTimer = window.setTimeout(() => {
        setError(message);
        setAuthReady(true);
      }, 0);
    }
    return () => { if (errorTimer !== undefined) window.clearTimeout(errorTimer); };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const database = getFirebaseFirestore();
    const adCollection = collection(database, "ads_manager");
    void (async () => {
      try {
        for (const initialAd of DEFAULT_MANAGED_ADS) {
          const existing = await getDoc(doc(adCollection, initialAd.id));
          if (!existing.exists()) await setDoc(doc(adCollection, initialAd.id), initialAd);
        }
      } catch (seedError) {
        if (active) setError(firebaseError(seedError));
      }
    })();
    const unsubscribe = onSnapshot(adCollection, (snapshot) => {
      if (active) setAds(sortManagedAds(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as ManagedAd))));
    }, (snapshotError) => {
      if (active) setError(firebaseError(snapshotError));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      setPassword("");
    } catch (loginError) {
      setError(firebaseError(loginError));
    } finally {
      setBusy(false);
    }
  }

  async function runOperation(operation: () => Promise<unknown>, success?: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      if (success) setNotice(success);
    } catch (operationError) {
      setError(firebaseError(operationError));
    } finally {
      setBusy(false);
    }
  }

  async function createAd() {
    const ad: ManagedAd = {
      id: `custom-${crypto.randomUUID()}`,
      name: "موضع إعلاني جديد",
      location: "custom",
      adClient: "",
      adSlot: "",
      isActive: false,
      device: "all",
      type: "display",
      createdAt: new Date().toISOString(),
    };
    await runOperation(() => setDoc(doc(getFirebaseFirestore(), "ads_manager", ad.id), ad), "تمت إضافة الموضع الإعلاني.");
  }

  async function updateAd(id: string, values: Partial<ManagedAd>) {
    if (values.adClient && !/^ca-pub-\d+$/.test(values.adClient)) {
      setError("معرّف الناشر يجب أن يبدأ بـ ca-pub- ويتبعه أرقام فقط.");
      return;
    }
    if (values.adSlot && !/^\d+$/.test(values.adSlot)) {
      setError("رقم الوحدة الإعلانية يجب أن يحتوي على أرقام فقط.");
      return;
    }
    if (values.name !== undefined && !values.name.trim()) {
      setError("اسم الموضع لا يمكن أن يكون فارغًا.");
      return;
    }
    await runOperation(() => updateDoc(doc(getFirebaseFirestore(), "ads_manager", id), values));
  }

  async function toggleAll(isActive: boolean) {
    if (!ads.length) return;
    await runOperation(async () => {
      const batch = writeBatch(getFirebaseFirestore());
      ads.forEach((ad) => batch.update(doc(getFirebaseFirestore(), "ads_manager", ad.id), { isActive }));
      await batch.commit();
    }, isActive ? "تم تشغيل جميع المواضع." : "تم إيقاف جميع المواضع.");
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(ads, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ads-manager-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!authReady) return <div className="admin-panel-card" role="status">جارٍ التحقق من Firebase Authentication...</div>;
  if (!user) return (
    <section className="admin-panel-card ads-login-card">
      <div className="admin-page-heading"><div><span className="admin-kicker">اتصال آمن عبر Firebase</span><h2>تسجيل دخول مدير الإعلانات</h2><p>استخدم حساب المدير المسجّل في Firebase Authentication.</p></div></div>
      <form className="ads-login-form" onSubmit={login}>
        <label>البريد الإلكتروني<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>كلمة المرور<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        <button className="admin-button admin-button-primary" type="submit" disabled={busy}>{busy ? "جارٍ الدخول..." : "دخول"}</button>
      </form>
    </section>
  );

  const activeCount = ads.filter((ad) => ad.isActive).length;
  return (
    <div className="admin-page ads-manager-page">
      <div className="admin-page-heading">
        <div><span className="admin-kicker">AdSense Manager Pro</span><h1>إدارة الإعلانات</h1><p>إعدادات مستقلة في Firestore، منفصلة عن تفضيلات الموقع.</p></div>
        <button type="button" className="admin-button admin-button-secondary" onClick={() => void runOperation(() => signOut(getFirebaseAuth()), "تم تسجيل الخروج من Firebase.")}>تسجيل الخروج</button>
      </div>
      <div className="ads-manager-toolbar">
        <div className="ads-active-counter"><strong>{activeCount}/{ads.length}</strong><span>إعلانات نشطة</span></div>
        <button className="admin-button admin-button-primary" type="button" onClick={() => void createAd()} disabled={busy}><Plus size={16} /> إضافة مكان إعلاني جديد</button>
        <button className="admin-button admin-button-secondary" type="button" onClick={() => void toggleAll(false)} disabled={busy || activeCount === 0}><RefreshCw size={15} /> إيقاف الكل</button>
        <button className="admin-button admin-button-secondary" type="button" onClick={() => void toggleAll(true)} disabled={busy || activeCount === ads.length}><RefreshCw size={15} /> تشغيل الكل</button>
        <button className="admin-button admin-button-secondary" type="button" onClick={exportSettings} disabled={!ads.length}><Download size={15} /> تصدير JSON</button>
      </div>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {notice && <p className="ads-manager-notice" role="status">{notice}</p>}
      <section className="admin-panel-card">
        <div className="admin-table-wrap"><table className="admin-table ads-manager-table">
          <thead><tr><th>الموضع</th><th>الاسم</th><th>Client</th><th>Slot</th><th>الجهاز</th><th>النوع</th><th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>{ads.map((ad) => <tr key={ad.id}>
            <td><span className="ads-placement-id" dir="ltr">{ad.id}</span></td>
            <td><input aria-label={`اسم الموضع: ${ad.id}`} defaultValue={ad.name} onBlur={(event) => event.currentTarget.value.trim() && event.currentTarget.value.trim() !== ad.name && void updateAd(ad.id, { name: event.currentTarget.value.trim() })} /></td>
            <td><input aria-label={`Ad Client: ${ad.name}`} dir="ltr" defaultValue={ad.adClient} onBlur={(event) => event.currentTarget.value !== ad.adClient && void updateAd(ad.id, { adClient: event.currentTarget.value.trim() })} /></td>
            <td><input aria-label={`Ad Slot: ${ad.name}`} dir="ltr" defaultValue={ad.adSlot} onBlur={(event) => event.currentTarget.value !== ad.adSlot && void updateAd(ad.id, { adSlot: event.currentTarget.value.trim() })} /></td>
            <td><select aria-label={`الجهاز: ${ad.name}`} value={ad.device} onChange={(event) => { const value = event.target.value; if (value === "all" || value === "desktop" || value === "mobile") void updateAd(ad.id, { device: value satisfies AdDevice }); }}><option value="all">الكل</option><option value="desktop">كمبيوتر</option><option value="mobile">هاتف</option></select></td>
            <td><select aria-label={`النوع: ${ad.name}`} value={ad.type} onChange={(event) => { const value = event.target.value; if (value === "display" || value === "in-article" || value === "auto") void updateAd(ad.id, { type: value satisfies AdType }); }}><option value="display">Display</option><option value="in-article">In-article</option><option value="auto">Auto</option></select></td>
            <td><label className="ads-toggle"><input type="checkbox" checked={ad.isActive} onChange={(event) => void updateAd(ad.id, { isActive: event.target.checked })} aria-label={`${ad.isActive ? "إيقاف" : "تشغيل"} ${ad.name}`} /><span className="ads-toggle-track" /><span className={ad.isActive ? "ads-state is-on" : "ads-state"}>{ad.isActive ? "🟢 شغال" : "🔴 متوقف"}</span></label></td>
            <td><button type="button" className="ads-delete-button" aria-label={`حذف ${ad.name}`} disabled={busy} onClick={() => window.confirm(`حذف موضع "${ad.name}"؟`) && void runOperation(() => deleteDoc(doc(getFirebaseFirestore(), "ads_manager", ad.id)), "تم حذف الموضع.")}><Trash2 size={15} /> حذف</button></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </div>
  );
}
