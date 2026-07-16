import { SceneImageGenerator } from "@/components/tools/menswear/scene-image-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearSceneImagePage() {
  await requireSignedInUser("/tools/menswear/scene-image");

  return (
    <>
      <WorkspacePageHeader
        description="上传场景图后，按人物换装、商品替换或纯背景生成，独立完成场景视觉创作。"
        title="男装场景图生成"
      />
      <SceneImageGenerator />
    </>
  );
}
