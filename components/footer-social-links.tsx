"use client";

import { useEffect, useState } from "react";
import { SocialBrandIcon } from "@/components/social-brand-icon";

type SocialLinks = {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  youtube: string;
};

const fields: { name: keyof SocialLinks; label: string }[] = [
  { name: "facebook", label: "Facebook" },
  { name: "instagram", label: "Instagram" },
  { name: "tiktok", label: "TikTok" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "youtube", label: "YouTube" },
];

export function FooterSocialLinks() {
  const [links, setLinks] = useState<SocialLinks | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/social", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Social links request failed (HTTP ${response.status}).`);
        return response.json() as Promise<SocialLinks>;
      })
      .then((data) => {
        if (active) setLinks(data);
      })
      .catch((error: unknown) => {
        if (active) console.error("Could not load footer social links.", error);
      });
    return () => { active = false; };
  }, []);

  if (!links) return null;
  return (
    <nav className="footer-social-links" aria-label="حسابات ServiceAI على مواقع التواصل">
      {fields.map(({ name, label }) => {
        const href = socialHref(name, links[name]);
        if (!href) return null;
        return (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
          >
            <SocialBrandIcon platform={name} size={17} />
          </a>
        );
      })}
    </nav>
  );
}

function socialHref(platform: keyof SocialLinks, value: string) {
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
