"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { SocialBrandIcon } from "@/components/social-brand-icon";
import { getFirebaseFirestore } from "@/lib/firebase";

type FooterSocialPlatform = "facebook" | "instagram" | "linkedin" | "whatsapp" | "youtube";
type FooterSocialLink = { name: FooterSocialPlatform; href: string; icon: FooterSocialPlatform };

const defaultLinks: FooterSocialLink[] = [
  { name: "facebook", href: "#", icon: "facebook" },
  { name: "instagram", href: "#", icon: "instagram" },
  { name: "linkedin", href: "#", icon: "linkedin" },
  { name: "whatsapp", href: "#", icon: "whatsapp" },
  { name: "youtube", href: "#", icon: "youtube" },
];

export function FooterSocialLinks() {
  const [socialLinks, setSocialLinks] = useState(defaultLinks);

  useEffect(() => {
    try {
      return onSnapshot(doc(getFirebaseFirestore(), "settings", "socialLinks"), (snapshot) => {
        if (!snapshot.exists()) {
          setSocialLinks(defaultLinks);
          return;
        }
        const values = snapshot.data();
        setSocialLinks(defaultLinks.map(({ name, icon }) => ({
          name,
          icon,
          href: socialHref(name, values[name]),
        })));
      }, (error) => {
        console.error("Could not load footer social links from Firestore:", error);
      });
    } catch (error) {
      console.error("Could not connect to Firestore footer social links:", error);
      return undefined;
    }
  }, []);

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

function socialHref(platform: FooterSocialPlatform, value: unknown): string {
  if (platform === "whatsapp") {
    const number = typeof value === "string" ? value.replace(/\D/g, "") : "";
    return number ? `https://wa.me/${number}` : "#";
  }
  if (typeof value !== "string" || !value.trim()) return "#";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : "#";
  } catch {
    return "#";
  }
}
