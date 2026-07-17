import { SceneImageGenerator } from "@/components/tools/menswear/scene-image-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function WomenswearSceneImagePage() {
  await requireSignedInUser("/tools/womenswear/scene-image");
  return <><WorkspacePageHeader description="用女装商品、人物、背景与构图参考完成换装、商品替换或纯场景生成。" title="女装场景图生成" /><SceneImageGenerator gender="women" /></>;
}
