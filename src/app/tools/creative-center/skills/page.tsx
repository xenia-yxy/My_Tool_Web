import { SkillManager } from "@/components/creative-center/skill-manager";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function CreativeSkillsPage() {
  await requireSignedInUser("/tools/creative-center/skills");

  return (
    <>
      <WorkspacePageHeader
        description="维护可复用的创作能力。系统 Skill 保持稳定，自定义 Skill 可修改参数、提示词与 Agent 调用说明。"
        title="Skill 管理"
      />
      <SkillManager />
    </>
  );
}
