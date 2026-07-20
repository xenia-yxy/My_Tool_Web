import { prisma } from "@/lib/prisma";
import {
  buildOssProxyUrl,
  getAliyunOssConfig,
  getOssObjectKeyFromUrl,
} from "@/server/oss-storage";

const apply = process.argv.includes("--apply");

async function main() {
  const config = getAliyunOssConfig();
  const [assets, materials, productImages] = await Promise.all([
    prisma.aiImageAsset.findMany({
      select: { id: true, imageUrl: true, downloadUrl: true, referenceImages: true },
    }),
    prisma.menswearMaterial.findMany({
      select: { id: true, imageUrl: true, previewUrl: true, sourceUrl: true, maskUrl: true },
    }),
    prisma.productImage.findMany({ select: { id: true, imageUrl: true } }),
  ]);

  const updates = [
    ...assets.map((asset) => ({
      kind: "asset" as const,
      id: asset.id,
      data: {
        imageUrl: toProxyUrl(asset.imageUrl, config),
        downloadUrl: toProxyUrl(asset.downloadUrl, config),
        referenceImages: asset.referenceImages.map((url) => toProxyUrl(url, config)),
      },
      changed: asset.imageUrl !== toProxyUrl(asset.imageUrl, config)
        || asset.downloadUrl !== toProxyUrl(asset.downloadUrl, config)
        || asset.referenceImages.some((url) => url !== toProxyUrl(url, config)),
    })),
    ...materials.map((material) => ({
      kind: "material" as const,
      id: material.id,
      data: {
        imageUrl: toProxyUrl(material.imageUrl, config),
        previewUrl: toProxyUrl(material.previewUrl, config),
        sourceUrl: toProxyUrl(material.sourceUrl, config),
        maskUrl: toProxyUrl(material.maskUrl, config),
      },
      changed: material.imageUrl !== toProxyUrl(material.imageUrl, config)
        || material.previewUrl !== toProxyUrl(material.previewUrl, config)
        || material.sourceUrl !== toProxyUrl(material.sourceUrl, config)
        || material.maskUrl !== toProxyUrl(material.maskUrl, config),
    })),
    ...productImages.map((image) => ({
      kind: "product" as const,
      id: image.id,
      data: { imageUrl: toProxyUrl(image.imageUrl, config) },
      changed: image.imageUrl !== toProxyUrl(image.imageUrl, config),
    })),
  ].filter((item) => item.changed);

  console.log(`${apply ? "开始转换" : "演练模式"}：发现 ${updates.length} 条需要切换到私有 OSS 代理的图片记录。`);
  if (!apply) return;

  for (const update of updates) {
    if (update.kind === "asset") {
      await prisma.aiImageAsset.update({ where: { id: update.id }, data: update.data });
    } else if (update.kind === "material") {
      await prisma.menswearMaterial.update({ where: { id: update.id }, data: update.data });
    } else {
      await prisma.productImage.update({ where: { id: update.id }, data: update.data });
    }
  }

  console.log(`已转换 ${updates.length} 条图片记录。`);
}

function toProxyUrl<T extends string | null>(
  value: T,
  config: ReturnType<typeof getAliyunOssConfig>,
): T {
  if (!value) return value;
  const objectKey = getOssObjectKeyFromUrl(value, config);
  return (objectKey ? buildOssProxyUrl(objectKey) : value) as T;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
