import { SocialCommerceWorkbench } from "@/components/tools/social-commerce-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function SocialCommercePage() {
  return (
    <>
      <WorkspacePageHeader
        description="面向小红书笔记和闲鱼商品发布，生成封面方向、标题文案、图片提示词和发布检查。"
        title="小红书 / 闲鱼内容设计"
      />
      <SocialCommerceWorkbench />
    </>
  );
}
