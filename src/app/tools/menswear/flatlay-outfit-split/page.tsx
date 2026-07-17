import { MenswearMultiOutfitGenerator } from "@/components/tools/menswear/multi-outfit-generator";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function MenswearFlatlayOutfitSplitPage() {
  await requireSignedInUser("/tools/menswear/flatlay-outfit-split");

  return (
    <>
      <WorkspacePageHeader
        description="上传平铺一衣多搭图，系统识别搭配数量并按顺序输出对应数量的单张人物穿搭图。"
        title="男装平铺多搭拆分生图"
      />
      <MenswearMultiOutfitGenerator variant="split" />
    </>
  );
}
