import { EmotionalReleaseTool } from "@/components/tools/emotional-release-tool";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function EmotionalReleasePage() {
  return (
    <>
      <WorkspacePageHeader
        description="把不爽写下来，换一组不伤害具体人的表达。内容只留在当前浏览器页面。"
        title="情绪解压"
      />
      <EmotionalReleaseTool />
    </>
  );
}
