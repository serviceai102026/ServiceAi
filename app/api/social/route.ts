import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SocialLinks = {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  youtube: string;
};

const socialFile = join(process.cwd(), "data", "social.json");
const socialKeys: (keyof SocialLinks)[] = ["facebook", "instagram", "tiktok", "whatsapp", "youtube"];

export async function GET() {
  try {
    const content = await readFile(socialFile, "utf8");
    const parsed: unknown = JSON.parse(content);
    if (!isSocialLinks(parsed)) {
      console.error("Social links JSON has an invalid structure.");
      return NextResponse.json({ error: "Social links data is invalid." }, { status: 500 });
    }
    return NextResponse.json(parsed, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not read social links JSON file.", error);
    return NextResponse.json({ error: "Could not read social links." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isSocialLinks(payload)) {
    return NextResponse.json({ error: "Provide string values for all social links." }, { status: 400 });
  }

  try {
    await writeFile(socialFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    return NextResponse.json({ success: true, links: payload }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not write social links JSON file.", error);
    return NextResponse.json({ error: "Could not save social links." }, { status: 500 });
  }
}

function isSocialLinks(value: unknown): value is SocialLinks {
  if (typeof value !== "object" || value === null) return false;
  const links = value as Record<string, unknown>;
  return socialKeys.every((key) => typeof links[key] === "string");
}
