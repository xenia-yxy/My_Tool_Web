import { AiImageTool } from "@/components/tools/ai-image-tool";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function AiImagePage() {
  return (
    <>
      <WorkspacePageHeader
        description="输入任意话语直接生成图片，也可以上传参考图后按描述编辑生成，适合内容封面、海报、头像和电商素材。"
        title="AI 自定义生图"
      />
      <AiImageTool mode="custom" />
    </>
  );
}
