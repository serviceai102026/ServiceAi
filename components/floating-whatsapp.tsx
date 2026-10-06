"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const button = useRef<HTMLAnchorElement>(null);
  const [overlapsAd, setOverlapsAd] = useState(false);

  useEffect(() => {
    let frame = 0;
    const resizeObserver = new ResizeObserver(scheduleCheck);
    const mutationObserver = new MutationObserver(() => {
      observeAdSlots();
      scheduleCheck();
    });

    function checkOverlap() {
      frame = 0;
      const buttonRect = button.current?.getBoundingClientRect();
      if (!buttonRect) return;
      const overlaps = Array.from(document.querySelectorAll<HTMLElement>(".adsense-slot")).some((ad) => {
        if (getComputedStyle(ad).display === "none") return false;
        const adRect = ad.getBoundingClientRect();
        return buttonRect.left < adRect.right
          && buttonRect.right > adRect.left
          && buttonRect.top < adRect.bottom
          && buttonRect.bottom > adRect.top;
      });
      setOverlapsAd((current) => current === overlaps ? current : overlaps);
    }

    function scheduleCheck() {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(checkOverlap);
    }

    function observeAdSlots() {
      resizeObserver.disconnect();
      document.querySelectorAll<HTMLElement>(".adsense-slot").forEach((ad) => resizeObserver.observe(ad));
    }

    observeAdSlots();
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
    };
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      ref={button}
      className="floating-whatsapp"
      href="https://wa.me/212710061006"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      title="تواصل عبر واتساب"
      aria-hidden={overlapsAd}
      tabIndex={overlapsAd ? -1 : undefined}
      style={{ visibility: overlapsAd ? "hidden" : "visible" }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.98-.945.98-1.49 0-.215-.09-.33-.172-.47l-.292-.568c-.167-.387-.43-.99-.43-1.49 0-.52.52-.99 1.04-.99h.12c.25 0 .39.1.52.33l.54 1.04c.12.24.06.45-.09.7l-.18.27c-.12.18-.09.33.06.48l1.04 1.04c.18.18.45.27.63.15l.27-.18c.24-.15.45-.21.7-.09l1.04.54c.24.12.33.27.33.52v.12c0 .52-.47 1.04-.99 1.04zM12.04 2c-5.46 0-9.91 4.44-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.44 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
      </svg>
    </a>
  );
}
