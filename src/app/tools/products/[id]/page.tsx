import { ProductEditor } from "@/components/tools/product-catalog/product-editor";
import { WorkspacePageHeader } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSignedInUser(`/tools/products/${id}`);
  return <><WorkspacePageHeader description="编辑商品信息、图片和可见卖点；需要时再手动复制图片到素材库。" title="选品详情" /><ProductEditor productId={id} /></>;
}
