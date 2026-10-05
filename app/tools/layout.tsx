import { ServiceDetailAdPlacements } from "@/components/service-detail-ad-placements";

export default function ToolsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ServiceDetailAdPlacements position="top" />
      {children}
      <ServiceDetailAdPlacements position="below" />
    </>
  );
}
