import type { Metadata } from "next";
import { AdsManagerAdmin } from "@/components/ads-manager-admin";

export const metadata: Metadata = {
  title: "إدارة الإعلانات",
  robots: { index: false, follow: false },
};

export default function AdsManagerPage() {
  return <AdsManagerAdmin />;
}
