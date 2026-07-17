import { MenswearMultiOutfitGenerator } from "@/components/tools/menswear/multi-outfit-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function WomenswearMultiOutfitPage() {
  await requireSignedInUser("/tools/womenswear/multi-outfit");
  return <><WorkspacePageHeader description="围绕同一女装主商品生成不同季节、不同场景的可穿搭配合集。" title="女装一衣多搭合集" /><MenswearMultiOutfitGenerator gender="women" /></>;
}
