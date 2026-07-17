import { MenswearSingleOutfitGenerator } from "@/components/tools/menswear/single-outfit-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function WomenswearSingleOutfitPage() {
  await requireSignedInUser("/tools/womenswear/single-outfit");
  return <><WorkspacePageHeader description="锁定女装单品，按脸部、构图、背景、动作与人物比例生成一张一套的真实穿搭图。" title="女装单品穿搭生图" /><MenswearSingleOutfitGenerator gender="women" /></>;
}
