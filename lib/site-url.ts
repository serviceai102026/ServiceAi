export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl && configuredUrl.includes("vercel.app")) {
    return "https://serviceai.ma";
  }

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return "https://serviceai.ma";
  }

  return "http://localhost:3000";
}

export function getSiteUrlAsObject(): URL {
  return new URL(getSiteUrl());
}