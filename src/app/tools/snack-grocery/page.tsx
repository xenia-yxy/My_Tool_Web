import { SnackGroceryPromptWorkbench } from "@/components/tools/snack-grocery-prompt-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function SnackGroceryPromptPage() {
  return (
    <>
      <WorkspacePageHeader
        description="面向大学生、职场人、租房党和宿舍党，批量生成零食饮料、速食夜宵、百货收纳和暑假热点清单图文。"
        title="零食百货起号提示词"
      />
      <SnackGroceryPromptWorkbench />
    </>
  );
}
