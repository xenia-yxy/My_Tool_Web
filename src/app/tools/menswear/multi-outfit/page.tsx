import { MenswearMultiOutfitGenerator } from "@/components/tools/menswear/multi-outfit-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearMultiOutfitPage() {
  await requireSignedInUser("/tools/menswear/multi-outfit");

  return (
    <>
      <WorkspacePageHeader
        description="上传单个或多个男装主体参考图，生成上身模特或无模特平铺的一衣多搭合集图。"
        title="男装一衣多搭合集"
      />
      <MenswearMultiOutfitGenerator />
    </>
  );
}
