import { ProductEditor } from "@/components/tools/product-catalog/product-editor";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireSignedInUser("/tools/products/new");
  return <><WorkspacePageHeader description="创建独立商品档案，商品图片不会自动进入素材库。" title="新建选品" /><ProductEditor /></>;
}
