import { DigitalProductPackWorkbench } from "@/components/tools/digital-product-pack-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function DigitalProductPackPage() {
  return (
    <>
      <WorkspacePageHeader
        description="把 AI 封面提示词、电商主图工作流和电商 Agent 资料，快速整理成可上架的闲鱼数字资料包。"
        title="资料售卖包生成器"
      />
      <DigitalProductPackWorkbench />
    </>
  );
}
