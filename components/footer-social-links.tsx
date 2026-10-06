"use client";

import { SocialBrandIcon } from "@/components/social-brand-icon";
import { useSitePreferences } from "@/components/site-preferences-provider";
import type { SocialPreferences } from "@/lib/site-preferences";

const socialPlatforms: { name: keyof SocialPreferences; icon: keyof SocialPreferences }[] = [
  { name: "facebook", icon: "facebook" },
  { name: "instagram", icon: "instagram" },
  { name: "linkedin", icon: "linkedin" },
  { name: "whatsapp", icon: "whatsapp" },
  { name: "youtube", icon: "youtube" },
];

export function FooterSocialLinks() {
  const { preferences } = useSitePreferences();
  const socialLinks = socialPlatforms.map(({ name, icon }) => {
    const value = preferences.socialLinks[name];
    const href = name === "whatsapp"
      ? value.replace(/\D/g, "") ? `https://wa.me/${value.replace(/\D/g, "")}` : "#"
      : validSocialHref(value);
    return { name, icon, href };
  });

  return (
    <nav className="footer-social-links" aria-label="حسابات ServiceAI على مواقع التواصل">
      {socialLinks.map((link) => (
        <a
          href={link.href}
          key={link.name}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          title={link.name}
        >
          <SocialBrandIcon platform={link.icon} size={17} />
        </a>
      ))}
    </nav>
  );
}

function validSocialHref(value: string) {
  if (!value.trim()) return "#";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : "#";
  } catch {
    return "#";
  }
}
