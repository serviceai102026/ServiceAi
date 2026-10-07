import { timingSafeEqual } from "node:crypto";
import { DEFAULT_SOCIAL_LINKS, type SocialPreferences } from "@/lib/site-preferences";

const BUCKET_ID = "serviceai-social-config";
const OBJECT_PATH = "social-links.json";

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("إعدادات التخزين المشترك غير مكتملة على الخادم.");
  }
  return { supabaseUrl: supabaseUrl.replace(/\/+$/, ""), serviceRoleKey };
}

function storageHeaders(serviceRoleKey: string, contentType?: string): HeadersInit {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export function validateSocialLinks(value: unknown): SocialPreferences | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const result = { ...DEFAULT_SOCIAL_LINKS };

  for (const key of Object.keys(result) as (keyof SocialPreferences)[]) {
    const link = record[key];
    if (typeof link !== "string" || link.length > 2048) return null;
    const trimmedLink = link.trim();
    if (!trimmedLink) {
      result[key] = "";
      continue;
    }
    if (key === "whatsapp" && !/^https?:\/\//i.test(trimmedLink)) {
      const phone = trimmedLink.replace(/\D/g, "");
      if (phone.length < 7 || phone.length > 15) return null;
      result[key] = phone;
      continue;
    }
    try {
      const url = new URL(trimmedLink);
      if (
        (url.protocol !== "https:" && url.protocol !== "http:")
        || !url.hostname
        || url.username
        || url.password
      ) return null;
      result[key] = url.href;
    } catch {
      return null;
    }
  }
  return result;
}

export function isValidSocialAdminCredentials(email: unknown, password: unknown): boolean {
  const expectedEmail = (process.env.SUPABASE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const expectedPassword = process.env.SUPABASE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
  if (typeof email !== "string" || typeof password !== "string" || !expectedEmail || !expectedPassword) {
    return false;
  }
  const emailBuffer = Buffer.from(email.trim().toLowerCase());
  const expectedEmailBuffer = Buffer.from(expectedEmail);
  const passwordBuffer = Buffer.from(password);
  const expectedPasswordBuffer = Buffer.from(expectedPassword);
  return emailBuffer.length === expectedEmailBuffer.length
    && passwordBuffer.length === expectedPasswordBuffer.length
    && timingSafeEqual(emailBuffer, expectedEmailBuffer)
    && timingSafeEqual(passwordBuffer, expectedPasswordBuffer);
}

export async function readSharedSocialLinks(): Promise<SocialPreferences> {
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
  const objectUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_ID}/${OBJECT_PATH}`;
  const response = await fetch(objectUrl, {
    headers: storageHeaders(serviceRoleKey),
    cache: "no-store",
  });
  if (response.status === 404) return { ...DEFAULT_SOCIAL_LINKS };
  if (!response.ok) {
    console.error("Could not read shared social links from Supabase Storage.", response.status);
    throw new Error("تعذر تحميل روابط التواصل المشتركة.");
  }
  const body: unknown = await response.json();
  const links = validateSocialLinks(body);
  if (!links) {
    console.error("Supabase Storage returned invalid shared social links.");
    throw new Error("روابط التواصل المخزنة غير صالحة.");
  }
  return links;
}

export async function saveSharedSocialLinks(links: SocialPreferences): Promise<void> {
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
  const headers = storageHeaders(serviceRoleKey, "application/json");
  const bucketUrl = `${supabaseUrl}/storage/v1/bucket/${BUCKET_ID}`;
  const bucketResponse = await fetch(bucketUrl, { headers, cache: "no-store" });

  if (bucketResponse.status === 404) {
    const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id: BUCKET_ID, name: BUCKET_ID, public: true }),
    });
    if (!createResponse.ok && createResponse.status !== 409) {
      console.error("Could not create public social links bucket.", createResponse.status);
      throw new Error("تعذر تجهيز التخزين المشترك لروابط التواصل.");
    }
  } else if (!bucketResponse.ok) {
    console.error("Could not inspect social links bucket.", bucketResponse.status);
    throw new Error("تعذر التحقق من التخزين المشترك لروابط التواصل.");
  }

  const objectUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_ID}/${OBJECT_PATH}`;
  const uploadResponse = await fetch(objectUrl, {
    method: "POST",
    headers: {
      ...headers,
      "x-upsert": "true",
    },
    body: JSON.stringify(links),
  });
  if (!uploadResponse.ok) {
    console.error("Could not save shared social links to Supabase Storage.", uploadResponse.status);
    throw new Error("تعذر حفظ روابط التواصل المشتركة.");
  }
}
