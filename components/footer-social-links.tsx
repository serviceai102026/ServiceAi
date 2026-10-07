"use client";

import { useSitePreferences } from "@/components/site-preferences-provider";
import { SocialBrandIcon } from "@/components/social-brand-icon";
import type { SocialPreferences } from "@/lib/site-preferences";

const platforms: { key: keyof SocialPreferences; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X" },
];

export function FooterSocialLinks() {
  const { preferences } = useSitePreferences();
  const links = platforms.flatMap(({ key, label }) => {
    const href = resolveSocialLink(key, preferences.socialLinks[key]);
    return href ? [{ key, label, href }] : [];
  });

  if (!links.length) return null;

  return (
    <nav className="footer-social-links" aria-label="روابط التواصل الاجتماعي">
      {links.map(({ key, label, href }) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
          <SocialBrandIcon platform={key} size={18} />
        </a>
      ))}
    </nav>
  );
}

function resolveSocialLink(platform: keyof SocialPreferences, value: string) {
  const link = value.trim();
  if (!link) return "";
  if (platform === "whatsapp" && !/^https?:\/\//i.test(link)) {
    const number = link.replace(/\D/g, "");
    return number ? `https://wa.me/${number}` : "";
  }
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}
