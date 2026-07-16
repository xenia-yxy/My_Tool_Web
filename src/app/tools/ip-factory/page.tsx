import { IpDerivativeFactoryWorkbench } from "@/components/tools/ip-derivative-factory-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function IpFactoryPage() {
  await requireSignedInUser("/tools/ip-factory");

  return (
    <>
      <WorkspacePageHeader
        description="把已有 IP 延展成表情包、动作姿势、换装装饰和场景海报。主 IP 图锁定身份，参考图只影响本次指定修改。"
        title="IP 衍生工厂"
      />
      <IpDerivativeFactoryWorkbench />
    </>
  );
}
