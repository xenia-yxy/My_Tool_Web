import { WomenswearWorkspace } from "@/components/tools/womenswear/womenswear-workspace";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function WomenswearPromptPage() {
  await requireSignedInUser("/tools/womenswear");

  return (
    <>
      <WorkspacePageHeader
        description="从女装商品锁定、模特脸部和构图参考开始，完成严格保真、场景、风格、一衣多搭等完整生图流程。"
        title="女装视觉工作台"
      />
      <WomenswearWorkspace />
    </>
  );
}
