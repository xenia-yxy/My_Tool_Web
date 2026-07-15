import { OutfitPromptWorkbench } from "@/components/tools/outfit-prompt-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function OutfitImagePage() {
  return (
    <>
      <WorkspacePageHeader
        description="上传服装参考图或直接输入商品描述，批量生成男装、女装的一衣多搭、平铺图、真实穿搭图和抖音图文文案。"
        title="服装图文起号提示词"
      />
      <OutfitPromptWorkbench />
    </>
  );
}
