import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "serviceai_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("إعداد سر جلسة المدير غير موجود على الخادم.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(email: string): { token: string; maxAge: number } {
  const maxAge = SESSION_DURATION_SECONDS;
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    expiresAt: Math.floor(Date.now() / 1000) + maxAge,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${encodedPayload}.${sign(encodedPayload)}`, maxAge };
}

export function readAdminSession(request: Request): AdminSessionPayload | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  if (!cookie) return null;

  const token = cookie.slice(ADMIN_SESSION_COOKIE.length + 1);
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const encodedPayload = token.slice(0, separator);
  const providedSignature = Buffer.from(token.slice(separator + 1));
  let expectedSignature: Buffer;
  try {
    expectedSignature = Buffer.from(sign(encodedPayload));
  } catch (error) {
    console.error("Admin session signing secret is unavailable.", error);
    return null;
  }
  if (
    providedSignature.length !== expectedSignature.length
    || !timingSafeEqual(providedSignature, expectedSignature)
  ) return null;

  try {
    const payload: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (
      !payload
      || typeof payload !== "object"
      || !("email" in payload)
      || typeof payload.email !== "string"
      || !("expiresAt" in payload)
      || typeof payload.expiresAt !== "number"
      || payload.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null;
    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}
