import { StrictFidelityGenerator } from "@/components/tools/menswear/strict-fidelity-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearStrictFidelityPage() {
  await requireSignedInUser("/tools/menswear/generate");

  return (
    <>
      <WorkspacePageHeader description="按服装、模特、姿势、背景分别设置参考素材和锁定策略，生成严格保真的男装图片。" title="男装严格保真生图" />
      <StrictFidelityGenerator />
    </>
  );
}
