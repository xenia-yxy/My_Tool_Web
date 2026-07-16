import { SkillManager } from "@/components/creative-center/skill-manager";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ skillId: string }> };

export default async function CreativeSkillDetailPage({ params }: PageProps) {
  await requireSignedInUser("/tools/creative-center/skills");
  const { skillId } = await params;

  return (
    <>
      <WorkspacePageHeader description="查看并调整 Skill 的当前配置，保存后会创建新的版本。" title="Skill 详情" />
      <SkillManager initialSkillId={skillId} />
    </>
  );
}
