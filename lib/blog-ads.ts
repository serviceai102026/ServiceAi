export const BLOG_AD_FIELDS = [
  { key: "blog_top", label: "أعلى المقال", after: "بعد الفقرة الأولى" },
  { key: "blog_middle", label: "وسط المقال", after: "بعد 50٪ من الفقرات" },
  { key: "blog_end", label: "نهاية المقال", after: "قبل المقالات ذات الصلة" },
] as const;

export type BlogAdKey = (typeof BLOG_AD_FIELDS)[number]["key"];
export type BlogAdsSettings = Record<`${BlogAdKey}_enabled`, boolean> & Record<`${BlogAdKey}_code`, string>;

export function createDefaultBlogAdsSettings(): BlogAdsSettings {
  return {
    blog_top_enabled: false,
    blog_top_code: "",
    blog_middle_enabled: false,
    blog_middle_code: "",
    blog_end_enabled: false,
    blog_end_code: "",
  };
}

export function parseBlogAdsSettings(value: Record<string, unknown>): BlogAdsSettings {
  const settings = createDefaultBlogAdsSettings();
  for (const { key } of BLOG_AD_FIELDS) {
    const enabledKey = `${key}_enabled` as `${BlogAdKey}_enabled`;
    const codeKey = `${key}_code` as `${BlogAdKey}_code`;
    settings[enabledKey] = value[enabledKey] === true;
    settings[codeKey] = typeof value[codeKey] === "string" ? value[codeKey].slice(0, 20000) : "";
  }
  return settings;
}

export function parseAdSenseSnippet(code: string, fallbackPublisherId: string) {
  const publisherId = code.match(/\bdata-ad-client\s*=\s*["'](ca-pub-\d+)["']/i)?.[1]
    ?? code.match(/[?&]client=(ca-pub-\d+)/i)?.[1]
    ?? fallbackPublisherId;
  const slotId = code.trim().match(/^\d+$/)?.[0]
    ?? code.match(/\bdata-ad-slot\s*=\s*["'](\d+)["']/i)?.[1]
    ?? "";
  const format = code.match(/\bdata-ad-format\s*=\s*["']([^"']+)["']/i)?.[1] ?? "auto";
  const layout = code.match(/\bdata-ad-layout\s*=\s*["']([^"']+)["']/i)?.[1];
  const layoutKey = code.match(/\bdata-ad-layout-key\s*=\s*["']([^"']+)["']/i)?.[1];
  const isAdSenseMarkup = /<ins\b[^>]*class\s*=\s*["'][^"']*adsbygoogle/i.test(code);

  return { publisherId, slotId, format, layout, layoutKey, isAdSenseMarkup };
}

export function splitArticleAroundAds(html: string) {
  const paragraphEnds = [...html.matchAll(/<\/p\s*>/gi)].map((match) => (match.index ?? 0) + match[0].length);
  if (paragraphEnds.length === 0) {
    return { beforeTop: html, betweenTopAndMiddle: "", afterMiddle: "", hasParagraphs: false };
  }
  const topEnd = paragraphEnds[0];
  const middleParagraph = Math.max(1, Math.ceil(paragraphEnds.length / 2));
  const middleEnd = paragraphEnds[Math.min(middleParagraph, paragraphEnds.length) - 1];
  return {
    beforeTop: html.slice(0, topEnd),
    betweenTopAndMiddle: html.slice(topEnd, middleEnd),
    afterMiddle: html.slice(middleEnd),
    hasParagraphs: true,
  };
}
