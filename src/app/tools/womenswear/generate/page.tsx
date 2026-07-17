import { StrictFidelityGenerator } from "@/components/tools/menswear/strict-fidelity-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function WomenswearStrictFidelityPage() {
  await requireSignedInUser("/tools/womenswear/generate");
  return <><WorkspacePageHeader description="分别锁定女装商品、女模特、姿势、背景和构图素材，保持款式与细节真实。" title="女装严格保真生图" /><StrictFidelityGenerator gender="women" /></>;
}
