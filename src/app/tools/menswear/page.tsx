import { MenswearWorkspace } from "@/components/tools/menswear/menswear-workspace";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearPromptPage() {
  await requireSignedInUser("/tools/menswear");

  return (
    <>
      <WorkspacePageHeader
        description="从公开素材、模特档案和严格保真生图开始建立男装图文生产流程。"
        title="男装视觉工作台"
      />
      <MenswearWorkspace />
    </>
  );
}
