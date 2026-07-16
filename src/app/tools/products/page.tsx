import { ProductCatalogPage } from "@/components/tools/product-catalog/product-catalog-page";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireSignedInUser("/tools/products");

  return (
    <>
      <WorkspacePageHeader
        description="独立管理商品档案、商品图片和 AI 选品信息；不会与生图素材库互相修改。"
        title="选品中心"
      />
      <ProductCatalogPage />
    </>
  );
}
