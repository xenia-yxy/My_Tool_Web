import { ModelProfileManager } from "@/components/tools/menswear/model-profile-manager";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearModelsPage() {
  await requireSignedInUser("/tools/menswear/models");

  return (
    <>
      <WorkspacePageHeader description="使用公开素材库中的脸部和身体参考建立模特档案，也可直接生成可复用的模特图。" title="男装模特档案" />
      <ModelProfileManager />
    </>
  );
}
