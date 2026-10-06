"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { SocialBrandIcon } from "@/components/social-brand-icon";
import { getFirebaseFirestore } from "@/lib/firebase";

type SocialPlatform = "facebook" | "instagram" | "tiktok" | "whatsapp" | "youtube";
type SocialLinks = Record<SocialPlatform, string>;

const fields: { name: SocialPlatform; label: string }[] = [
  { name: "facebook", label: "Facebook" },
  { name: "instagram", label: "Instagram" },
  { name: "tiktok", label: "TikTok" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "youtube", label: "YouTube" },
];
const emptyLinks: SocialLinks = { facebook: "", instagram: "", tiktok: "", whatsapp: "", youtube: "" };

export function FooterSocialLinks() {
  const [links, setLinks] = useState<SocialLinks>(emptyLinks);
  useEffect(() => {
    try {
      return onSnapshot(doc(getFirebaseFirestore(), "settings", "social"), (snapshot) => {
        if (!snapshot.exists()) {
          setLinks(emptyLinks);
          return;
        }
        const stored = snapshot.data();
        setLinks(Object.fromEntries(fields.map(({ name }) => [
          name,
          typeof stored[name] === "string" ? stored[name] : "",
        ])) as SocialLinks);
      }, (error) => {
        console.error("Could not load footer social links from Firestore.", error);
      });
    } catch (error) {
      console.error("Could not connect to Firestore for footer social links.", error);
      return undefined;
    }
  }, []);

  const configuredLinks = fields.flatMap(({ name, label }) => {
    const href = socialHref(name, links[name]);
    return href ? [{ name, label, href }] : [];
  });
  if (!configuredLinks.length) return null;

  return (
    <nav className="footer-social-links" aria-label="حسابات ServiceAI على مواقع التواصل">
      {configuredLinks.map(({ name, label, href }) => (
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
      ))}
    </nav>
  );
}

function socialHref(platform: SocialPlatform, value: string) {
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
