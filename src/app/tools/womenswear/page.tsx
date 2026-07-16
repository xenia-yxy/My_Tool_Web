import { OutfitPromptWorkbench } from "@/components/tools/outfit-prompt-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function WomenswearPromptPage() {
  return (
    <>
      <WorkspacePageHeader
        description="上传女装参考图或输入商品描述，批量生成气质通勤、甜妹、小个子显高、微胖显瘦等图文提示词和带货文案。"
        title="女装视觉工作台"
      />
      <OutfitPromptWorkbench fixedGender="women" />
    </>
  );
}
