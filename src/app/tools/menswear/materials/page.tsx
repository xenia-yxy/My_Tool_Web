import { MaterialLibrary } from "@/components/tools/menswear/material-library";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearMaterialsPage() {
  await requireSignedInUser("/tools/menswear/materials");

  return (
    <>
      <WorkspacePageHeader description="分类管理服装、鞋包、姿势、背景、构图、光线和模特参考素材。上传后可供所有成员选择。" title="男装公开素材库" />
      <MaterialLibrary />
    </>
  );
}
