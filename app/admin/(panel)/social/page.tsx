import type { Metadata } from "next";
import { AdminSocialSettings } from "@/components/admin-social-settings";

export const metadata: Metadata = {
  title: "التحكم في مواقع التواصل الاجتماعي",
  robots: { index: false, follow: false },
};

export default function AdminSocialPage() {
  return <AdminSocialSettings />;
}
