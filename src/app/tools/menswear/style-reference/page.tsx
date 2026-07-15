import { StyleReferenceGenerator } from "@/components/tools/menswear/style-reference-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearStyleReferencePage() {
  await requireSignedInUser("/tools/menswear/style-reference");

  return (
    <>
      <WorkspacePageHeader
        description="上传多张服装主图和一张风格参考图，保留商品真实细节，只借用参考图的光线、镜头、背景氛围和色彩。"
        title="男装风格参考生图"
      />
      <StyleReferenceGenerator />
    </>
  );
}
