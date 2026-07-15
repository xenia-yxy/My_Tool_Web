import { HotspotRadar } from "@/components/tools/hotspot-radar";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function HotspotsPage() {
  await requireSignedInUser("/tools/hotspots");

  return (
    <>
      <WorkspacePageHeader
        description="聚合抖音、小红书、B站的热点观察入口，按平台、类型和关键词快速跳转到实时来源。"
        title="热点雷达"
      />
      <HotspotRadar />
    </>
  );
}
