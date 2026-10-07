"use client";

import { AdSlot } from "@/components/AdSlot";

export function ToolPageAd({ position }: { position: "top" | "bottom" }) {
  return <AdSlot placement={position} />;
}
