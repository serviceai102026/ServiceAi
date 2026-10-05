"use client";

import { usePathname } from "next/navigation";
import { AdManager } from "@/components/ad-manager";

export function ServiceDetailAdPlacements({ position }: { position: "top" | "below" }) {
  const pathname = usePathname();
  if (pathname === "/tools" || !pathname.startsWith("/tools/")) return null;

  if (position === "top") return <AdManager id="service-detail-top" className="container service-detail-ad-top" />;
  return (
    <div className="container service-detail-ad-bottom">
      <AdManager id="service-detail-middle" />
      <aside className="service-detail-ad-sidebar"><AdManager id="service-detail-sidebar" /></aside>
    </div>
  );
}
