"use client";

import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        throw new Error(message);
      }
      window.location.replace("/admin");
    } catch (cause) {
      console.error("تعذر تسجيل دخول المدير.", cause);
      setError(cause instanceof Error ? cause.message : "تعذر إكمال تسجيل الدخول.");
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <label htmlFor="admin-email">البريد الإلكتروني</label>
      <input id="admin-email" type="email" name="email" autoComplete="username" required />
      <label htmlFor="admin-password">كلمة المرور</label>
      <input id="admin-password" type="password" name="password" autoComplete="current-password" required />
      <button className="admin-button admin-button-primary" type="submit" disabled={pending}>
        {pending ? "جارٍ التحقق..." : "دخول"}<span aria-hidden="true">←</span>
      </button>
    </form>
  );
}
