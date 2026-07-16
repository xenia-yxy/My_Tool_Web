import { SkillManager } from "@/components/creative-center/skill-manager";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function NewCreativeSkillPage() {
  await requireSignedInUser("/tools/creative-center/skills/new");

  return (
    <>
      <WorkspacePageHeader description="新建一个可在创作画布中调用的自定义 Skill。" title="新建 Skill" />
      <SkillManager openCreateOnLoad />
    </>
  );
}
