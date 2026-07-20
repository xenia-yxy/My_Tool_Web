import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  shouldMigrateRuntimeUrl,
  uploadBufferToAliyunOss,
} from "@/server/oss-storage";

const apply = process.argv.includes("--apply");
const runtimeDirectory = path.join(process.cwd(), ".runtime", "uploads", "ai-images");

type MigrationRecord = {
  id: string;
  kind: "asset" | "material";
  url: string;
};

async function main() {
  const [assets, materials] = await Promise.all([
    prisma.aiImageAsset.findMany({ select: { id: true, imageUrl: true } }),
    prisma.menswearMaterial.findMany({ select: { id: true, imageUrl: true } }),
  ]);
  const records: MigrationRecord[] = [
    ...assets.filter((item) => shouldMigrateRuntimeUrl(item.imageUrl)).map((item) => ({ id: item.id, kind: "asset" as const, url: item.imageUrl })),
    ...materials.filter((item) => shouldMigrateRuntimeUrl(item.imageUrl)).map((item) => ({ id: item.id, kind: "material" as const, url: item.imageUrl })),
  ];

  console.log(`${apply ? "开始迁移" : "演练模式"}：发现 ${records.length} 条本地图片记录。`);
  if (!apply) {
    console.log("未写入 OSS 或数据库。确认备份完成后使用 pnpm oss:migrate-runtime -- --apply 执行。");
    return;
  }

  const recordsByUrl = new Map<string, MigrationRecord[]>();
  for (const record of records) {
    recordsByUrl.set(record.url, [...(recordsByUrl.get(record.url) ?? []), record]);
  }

  for (const [runtimeUrl, matchingRecords] of recordsByUrl) {
    const fileName = path.basename(runtimeUrl);
    const buffer = await readFile(path.join(runtimeDirectory, fileName));
    const folder = fileName.startsWith("ref-") ? "references" : "generated";
    const contentType = mimeTypeForFileName(fileName);
    const uploaded = await uploadBufferToAliyunOss({ buffer, contentType, fileName, folder });

    await prisma.$transaction(matchingRecords.map((record) => record.kind === "asset"
      ? prisma.aiImageAsset.update({
          where: { id: record.id },
          data: { imageUrl: uploaded.imageUrl, downloadUrl: uploaded.imageUrl },
        })
      : prisma.menswearMaterial.update({
          where: { id: record.id },
          data: { imageUrl: uploaded.imageUrl, previewUrl: uploaded.imageUrl },
        })));

    await unlink(path.join(runtimeDirectory, fileName));
    console.log(`已迁移 ${matchingRecords.length} 条图片引用：${fileName}`);
  }
}

function mimeTypeForFileName(fileName: string) {
  if (/\.jpe?g$/i.test(fileName)) return "image/jpeg";
  if (/\.webp$/i.test(fileName)) return "image/webp";
  return "image/png";
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
