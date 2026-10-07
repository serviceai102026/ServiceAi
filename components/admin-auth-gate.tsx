"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;
    async function verifySession() {
      try {
        const response = await fetch("/api/admin/auth", { cache: "no-store" });
        if (!response.ok) {
          window.location.replace("/admin/login");
          return;
        }
        const session: unknown = await response.json();
        if (
          session
          && typeof session === "object"
          && "authenticated" in session
          && session.authenticated === true
          && "email" in session
          && typeof session.email === "string"
        ) {
          if (active) {
            setEmail(session.email);
            setLogged(true);
            setLoading(false);
          }
          return;
        }
        window.location.replace("/admin/login");
      } catch (error) {
        console.error("تعذر التحقق من جلسة المدير.", error);
        if (active) setLoading(false);
      }
    }
    void verifySession();
    return () => { active = false; };
  }, []);

  if (loading) return <div className="admin-login-page"><p role="status">جارٍ التحقق من الدخول...</p></div>;
  if (logged) return <AdminShell email={email}>{children}</AdminShell>;
  return <div className="admin-login-page"><p className="admin-alert" role="alert">تعذر التحقق من جلسة المدير. تحقق من اتصال الخادم ثم أعد المحاولة.</p><Link className="admin-login-back" href="/admin/login">الانتقال إلى تسجيل الدخول</Link></div>;
}
