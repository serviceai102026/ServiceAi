"use client";

import { useSitePreferences } from "@/components/site-preferences-provider";
import { SocialBrandIcon } from "@/components/social-brand-icon";
import type { SocialPreferences } from "@/lib/site-preferences";

export function FooterSocialLinks() {
  const { preferences } = useSitePreferences();
  const { socialLinks } = preferences;
  const fallbackLinks = {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    x: "https://x.com",
    linkedin: "https://linkedin.com",
    whatsapp: "/",
    youtube: "/",
  } satisfies Record<keyof SocialPreferences, string>;
  const socialHref = (value: string, fallback: string) => {
    const href = value.trim();
    if (!href || href === "#") return fallback;
    try {
      const url = new URL(href);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : fallback;
    } catch {
      return fallback;
    }
  };
  const links = [
    {
      label: "WhatsApp",
      href: socialLinks.whatsapp.replace(/\D/g, "")
        ? `https://wa.me/${socialLinks.whatsapp.replace(/\D/g, "")}`
        : fallbackLinks.whatsapp,
      isConfigured: Boolean(socialLinks.whatsapp.replace(/\D/g, "")),
      platform: "whatsapp",
    },
    { label: "Instagram", href: socialHref(socialLinks.instagram, fallbackLinks.instagram), isConfigured: /^https:\/\//i.test(socialLinks.instagram), platform: "instagram" },
    { label: "Facebook", href: socialHref(socialLinks.facebook, fallbackLinks.facebook), isConfigured: /^https:\/\//i.test(socialLinks.facebook), platform: "facebook" },
    { label: "X", href: socialHref(socialLinks.x, fallbackLinks.x), isConfigured: /^https:\/\//i.test(socialLinks.x), platform: "x" },
    { label: "LinkedIn", href: socialHref(socialLinks.linkedin, fallbackLinks.linkedin), isConfigured: /^https:\/\//i.test(socialLinks.linkedin), platform: "linkedin" },
    { label: "YouTube", href: socialHref(socialLinks.youtube, fallbackLinks.youtube), isConfigured: /^https:\/\//i.test(socialLinks.youtube), platform: "youtube" },
  ] satisfies { label: string; href: string; isConfigured: boolean; platform: keyof SocialPreferences }[];

  return (
    <nav className="footer-social-links" aria-label="حسابات ServiceAI على مواقع التواصل">
      {links.map((item) => {
        const content = <SocialBrandIcon platform={item.platform} size={17} />;

        return (
          <a
            className={item.isConfigured ? undefined : "footer-social-link-unconfigured"}
            href={item.href}
            key={item.label}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title={item.label}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
}
