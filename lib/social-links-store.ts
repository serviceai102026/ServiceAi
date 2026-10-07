import { timingSafeEqual } from "node:crypto";
import { DEFAULT_SOCIAL_LINKS, type SocialPreferences } from "@/lib/site-preferences";

type StoredSocialLinks = {
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  instagram: string | null;
  whatsapp: string | null;
  twitter: string | null;
  linkedin: string | null;
};

function getSupabaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) throw new Error("عنوان Supabase غير مضبوط على الخادم.");
  return supabaseUrl.replace(/\/+$/, "");
}

function getSupabaseAnonKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!anonKey) throw new Error("مفتاح القراءة العامة لـSupabase غير مضبوط.");
  return anonKey;
}

function getSupabaseServiceRoleKey(): string {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("مفتاح الكتابة الخادمي لـSupabase غير مضبوط.");
  return serviceRoleKey;
}

function supabaseHeaders(apiKey: string): HeadersInit {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
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

function fromDatabaseRow(row: StoredSocialLinks): SocialPreferences {
  return {
    facebook: row.facebook ?? "",
    tiktok: row.tiktok ?? "",
    youtube: row.youtube ?? "",
    instagram: row.instagram ?? "",
    whatsapp: row.whatsapp ?? "",
    x: row.twitter ?? "",
    linkedin: row.linkedin ?? "",
  };
}

export async function readSharedSocialLinks(): Promise<SocialPreferences> {
  const supabaseUrl = getSupabaseUrl();
  const url = new URL(`${supabaseUrl}/rest/v1/site_social_links`);
  url.searchParams.set("id", "eq.1");
  url.searchParams.set("select", "facebook,tiktok,youtube,instagram,whatsapp,twitter,linkedin");

  const response = await fetch(url, {
    headers: supabaseHeaders(getSupabaseAnonKey()),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Could not read shared social links from Supabase.", response.status);
    throw new Error("تعذر تحميل روابط التواصل المشتركة.");
  }
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) {
    console.error("Supabase returned an invalid social links response.");
    throw new Error("استجابة روابط التواصل من قاعدة البيانات غير صالحة.");
  }
  const row = rows[0];
  if (!row) return { ...DEFAULT_SOCIAL_LINKS };
  if (typeof row !== "object" || row === null) {
    console.error("Supabase returned an invalid social links row.");
    throw new Error("بيانات روابط التواصل المخزنة غير صالحة.");
  }
  return fromDatabaseRow(row as StoredSocialLinks);
}

export async function saveSharedSocialLinks(links: SocialPreferences): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const url = new URL(`${supabaseUrl}/rest/v1/site_social_links`);
  url.searchParams.set("on_conflict", "id");
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...supabaseHeaders(serviceRoleKey),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: 1,
      facebook: links.facebook,
      tiktok: links.tiktok,
      youtube: links.youtube,
      instagram: links.instagram,
      whatsapp: links.whatsapp,
      twitter: links.x,
      linkedin: links.linkedin,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Could not save shared social links to Supabase.", response.status);
    throw new Error("تعذر حفظ روابط التواصل في قاعدة البيانات.");
  }
}
