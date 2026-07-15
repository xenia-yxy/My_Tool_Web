import { IpPrototypeWorkbench } from "@/components/tools/ip-prototype-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function IpPrototypePage() {
  await requireSignedInUser("/tools/ip-prototype");

  return (
    <>
      <WorkspacePageHeader
        description="按 4 步生成 IP 原型：定方向、给参考、写想法、确认提示词。结果统一进入图片画廊记录和下载。"
        title="IP 原型工坊"
      />
      <IpPrototypeWorkbench />
    </>
  );
}
