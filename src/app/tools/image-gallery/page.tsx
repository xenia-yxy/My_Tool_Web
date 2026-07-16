import { AiImageGalleryWorkbench } from "@/components/tools/ai-image-gallery-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function ImageGalleryPage() {
  return (
    <>
      <WorkspacePageHeader
        description="统一查看所有 AI 生成图片、批量任务状态、发布文案、tags 和下载链接。"
        title="AI 图片画廊"
      />
      <AiImageGalleryWorkbench />
    </>
  );
}
