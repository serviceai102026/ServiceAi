import { NextResponse } from "next/server";
import {
  readSharedSocialLinks,
  saveSharedSocialLinks,
  validateSocialLinks,
} from "@/lib/social-links-store";
import { readAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    return NextResponse.json(await readSharedSocialLinks(), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Failed to load public social links.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر تحميل روابط التواصل." },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

export async function POST(request: Request) {
  if (!readAdminSession(request)) {
    return NextResponse.json({ error: "انتهت جلسة المدير. سجّل الدخول مجددًا." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  const socialLinks = body && typeof body === "object" && !Array.isArray(body) && "socialLinks" in body
    ? (body as Record<string, unknown>).socialLinks
    : null;
  const links = validateSocialLinks(socialLinks);
  if (!links) {
    return NextResponse.json({ error: "تحقق من روابط التواصل وأدخل روابط صالحة." }, { status: 400 });
  }

  try {
    await saveSharedSocialLinks(links);
    return NextResponse.json({ success: true, socialLinks: links }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Failed to save public social links.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر حفظ روابط التواصل." },
      { status: 503 },
    );
  }
}
