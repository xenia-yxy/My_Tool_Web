import { MenswearSingleOutfitGenerator } from "@/components/tools/menswear/single-outfit-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearSingleOutfitPage() {
  await requireSignedInUser("/tools/menswear/single-outfit");
  return <><WorkspacePageHeader description="上传单件或多件男装单品，生成一张一套的真实上身穿搭图；可控制脸部、动作、人物占比和背景变化。" title="男装单品穿搭生图" /><MenswearSingleOutfitGenerator /></>;
}
