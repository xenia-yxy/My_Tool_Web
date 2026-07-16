import { PlatformCoverDesignWorkbench } from "@/components/tools/platform-cover-design-workbench";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";

export const dynamic = "force-dynamic";

export default function PlatformCoverDesignPage() {
  return (
    <>
      <WorkspacePageHeader
        description="上传封面原图和可选风格参考图，为小红书、抖音图文、视频号、公众号和闲鱼生成平台封面设计。"
        title="平台封面设计"
      />
      <PlatformCoverDesignWorkbench />
    </>
  );
}
