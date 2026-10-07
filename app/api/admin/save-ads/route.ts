import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { AdsConfig, AdsPlacement } from "@/lib/ads-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const placements: AdsPlacement[] = ["top", "middle", "bottom", "blog_top", "blog_middle", "blog_end"];

function isAdsConfig(value: unknown): value is AdsConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  return placements.every((placement) => {
    const setting = config[placement];
    return Boolean(
      setting
      && typeof setting === "object"
      && !Array.isArray(setting)
      && "enabled" in setting
      && typeof setting.enabled === "boolean"
      && "code" in setting
      && typeof setting.code === "string"
      && setting.code.length <= 20000,
    );
  });
}

function hasValidWriteToken(request: Request, expectedToken: string): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const providedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function createAdsConfigSource(adsConfig: AdsConfig): string {
  return `export type AdsPlacement = "top" | "middle" | "bottom" | "blog_top" | "blog_middle" | "blog_end";

export type AdsConfig = Record<AdsPlacement, {
  enabled: boolean;
  code: string;
}>;

export const ADS_CONFIG = ${JSON.stringify(adsConfig, null, 2)} as const satisfies AdsConfig;
`;
}

async function readGithubFileSha(apiUrl: string, headers: Record<string, string>, path: string): Promise<string | null> {
  const response = await fetch(apiUrl, { headers, cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) {
    console.error(`GitHub could not read ${path}.`, response.status);
    throw new Error(`تعذر قراءة ${path} من GitHub.`);
  }

  const file: unknown = await response.json();
  if (!file || typeof file !== "object" || !("sha" in file) || typeof file.sha !== "string") {
    console.error(`GitHub returned invalid metadata for ${path}.`);
    throw new Error(`تعذر التحقق من نسخة ${path}.`);
  }
  return file.sha;
}

async function updateGithubFile(
  apiUrl: string,
  headers: Record<string, string>,
  path: string,
  content: string,
  sha: string | null,
) {
  const response = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "update ads config",
      content: Buffer.from(content).toString("base64"),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    console.error(`GitHub could not update ${path}.`, response.status);
    throw new Error(`تعذر حفظ ${path} في GitHub. تحقق من صلاحيات الرمز والمستودع.`);
  }
}

export async function POST(request: Request) {
  const writeToken = process.env.ADS_CONFIG_WRITE_TOKEN;
  const githubToken = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPO;

  if (!writeToken || !githubToken || !repository) {
    return NextResponse.json({ error: "خدمة حفظ الإعلانات غير مكتملة الإعداد على الخادم." }, { status: 503 });
  }

  if (!hasValidWriteToken(request, writeToken)) {
    return NextResponse.json({ error: "رمز الكتابة غير صحيح." }, { status: 401 });
  }

  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    console.error("GITHUB_REPO must use the owner/repository format.");
    return NextResponse.json({ error: "إعداد المستودع على الخادم غير صالح." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "يجب إرسال إعدادات صحيحة بصيغة JSON." }, { status: 400 });
  }

  if (
    !body
    || typeof body !== "object"
    || !("adsConfig" in body)
    || !isAdsConfig(body.adsConfig)
    || !("adsenseId" in body)
    || typeof body.adsenseId !== "string"
    || !/^ca-pub-\d{16}$/.test(body.adsenseId)
  ) {
    return NextResponse.json({ error: "إعدادات الإعلانات المرسلة غير صالحة." }, { status: 400 });
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  try {
    const tsPath = "lib/ads-config.ts";
    const jsonPath = "public/ads-config.json";
    const tsUrl = `https://api.github.com/repos/${repository}/contents/${tsPath}`;
    const jsonUrl = `https://api.github.com/repos/${repository}/contents/${jsonPath}`;
    const [tsSha, jsonSha] = await Promise.all([
      readGithubFileSha(tsUrl, headers, tsPath),
      readGithubFileSha(jsonUrl, headers, jsonPath),
    ]);
    const jsonContent = JSON.stringify({ adsenseId: body.adsenseId, ads: body.adsConfig }, null, 2);

    await updateGithubFile(tsUrl, headers, tsPath, createAdsConfigSource(body.adsConfig), tsSha);
    await updateGithubFile(jsonUrl, headers, jsonPath, jsonContent, jsonSha);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save the ad configuration through GitHub.", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "حدث خطأ أثناء الاتصال بـGitHub لحفظ الإعدادات.",
    }, { status: 502 });
  }
}
