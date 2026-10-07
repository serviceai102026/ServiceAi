import { NextResponse } from "next/server";
import {
  isValidSocialAdminCredentials,
  readSharedSocialLinks,
  saveSharedSocialLinks,
  validateSocialLinks,
} from "@/lib/social-links-store";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("email" in body) || !("password" in body)) {
    return NextResponse.json({ error: "أدخل بيانات المدير لتأكيد الحفظ." }, { status: 400 });
  }
  if (!isValidSocialAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ error: "بيانات المدير غير صحيحة." }, { status: 401 });
  }

  const links = validateSocialLinks("socialLinks" in body ? body.socialLinks : null);
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
