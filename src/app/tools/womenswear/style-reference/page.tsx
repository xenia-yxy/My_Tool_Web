import { StyleReferenceGenerator } from "@/components/tools/menswear/style-reference-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function WomenswearStyleReferencePage() {
  await requireSignedInUser("/tools/womenswear/style-reference");
  return <><WorkspacePageHeader description="锁定女装主商品，再按参考图控制构图、人物远近、光线与氛围。" title="女装风格参考生图" /><StyleReferenceGenerator gender="women" /></>;
}
