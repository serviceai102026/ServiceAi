"use client";

import { SocialBrandIcon } from "@/components/social-brand-icon";
import type { SocialPreferences } from "@/lib/site-preferences";

const socialLinks = [
  { name: "facebook", href: "https://www.facebook.com/serviceai.ma", icon: "facebook" },
  { name: "instagram", href: "https://www.instagram.com/serviceai.ma", icon: "instagram" },
  { name: "linkedin", href: "https://www.linkedin.com/company/serviceai", icon: "linkedin" },
  { name: "whatsapp", href: "https://wa.me/212600000000", icon: "whatsapp" },
] satisfies { name: string; href: string; icon: keyof SocialPreferences }[];

export function FooterSocialLinks() {
  return (
    <nav className="footer-social-links" aria-label="حسابات ServiceAI على مواقع التواصل">
      {socialLinks.map((link) => (
        <a
          href={link.href}
          key={link.name}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          aria-label={link.name}
          title={link.name}
        >
          <SocialBrandIcon platform={link.icon} size={17} />
        </a>
      ))}
    </nav>
  );
}
