import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, readAdminSession } from "@/lib/admin-session";
import { isValidSocialAdminCredentials } from "@/lib/social-links-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return new URL(origin).host === new URL(request.url).host;
}

export async function GET(request: Request) {
  const session = readAdminSession(request);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: session.email }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "طلب تسجيل الدخول مرفوض." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات تسجيل الدخول غير صالحة." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("email" in body) || !("password" in body)) {
    return NextResponse.json({ error: "أدخل البريد الإلكتروني وكلمة المرور." }, { status: 400 });
  }
  if (!isValidSocialAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 401 });
  }

  try {
    const { token, maxAge } = createAdminSessionToken(String(body.email));
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge,
    });
    return response;
  } catch (error) {
    console.error("Could not create admin session.", error);
    return NextResponse.json({ error: "تعذر بدء جلسة المدير على الخادم." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "طلب تسجيل الخروج مرفوض." }, { status: 403 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
