import { MenswearMultiOutfitGenerator } from "@/components/tools/menswear/multi-outfit-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function WomenswearFlatlayOutfitSplitPage() {
  await requireSignedInUser("/tools/womenswear/flatlay-outfit-split");
  return <><WorkspacePageHeader description="上传女装平铺多搭图，按套装顺序生成对应数量的单张人物穿搭图。" title="女装平铺多搭拆分生图" /><MenswearMultiOutfitGenerator gender="women" variant="split" /></>;
}
