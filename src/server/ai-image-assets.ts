import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import type { AiImageToolMode } from "@/server/ai-image-tools";
import {
  deleteAliyunOssObjectByUrl,
  isAliyunOssEnabled,
} from "@/server/oss-storage";

type AiImageAssetCreateInput = {
  mode: string;
  sourceTool?: string | null;
  status?: string | null;
  jobId?: string | null;
  title?: string | null;
  description?: string | null;
  caption?: string | null;
  tags?: string[] | null;
  productKeywords?: string[] | null;
  prompt: string;
  imageUrl: string;
  downloadUrl: string;
  fileName: string;
  mimeType?: string | null;
  errorMessage?: string | null;
  referenceImages?: string[] | null;
  referenceLabels?: string[] | null;
};

type AiImageAssetUpdateInput = {
  title?: string | null;
  note?: string | null;
};

type AiImageAssetBulkDeleteInput = {
  ids?: unknown;
};

type AiImageZipEntry = {
  content: Buffer;
  fileName: string;
};

const allowedModes = new Set<AiImageToolMode>([
  "custom",
  "outfit",
  "menswear",
  "womenswear",
  "snack-grocery",
  "ip-prototype",
]);

const allowedStatuses = new Set([
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

export function normalizeAiImageAssetCreateInput(
  input: AiImageAssetCreateInput,
) {
  if (!allowedModes.has(input.mode as AiImageToolMode)) {
    throw new Error("工具类型不正确");
  }

  const prompt = input.prompt.trim();
  const imageUrl = input.imageUrl.trim();
  const downloadUrl = input.downloadUrl.trim();
  const fileName = input.fileName.trim();

  if (!prompt) {
    throw new Error("生图提示词不能为空");
  }

  if (!imageUrl || !downloadUrl || !fileName) {
    throw new Error("图片信息不完整");
  }

  return {
    mode: input.mode as AiImageToolMode,
    sourceTool: normalizeOptionalText(input.sourceTool),
    status: normalizeStatus(input.status, "SUCCEEDED"),
    jobId: normalizeOptionalText(input.jobId),
    title: normalizeRequiredText(input.title, "未命名生图"),
    description: normalizeOptionalText(input.description),
    caption: normalizeOptionalText(input.caption),
    tags: normalizeStringList(input.tags),
    productKeywords: normalizeStringList(input.productKeywords),
    prompt,
    imageUrl,
    downloadUrl,
    fileName,
    mimeType: normalizeRequiredText(input.mimeType, "image/png"),
    errorMessage: normalizeOptionalText(input.errorMessage),
    referenceImages: normalizeStringList(input.referenceImages),
    referenceLabels: normalizeStringList(input.referenceLabels),
  };
}

export function normalizeAiImageAssetUpdateInput(
  input: AiImageAssetUpdateInput,
) {
  return {
    title: normalizeRequiredText(input.title, "未命名生图"),
    note: normalizeOptionalText(input.note),
  };
}

export function normalizeAiImageAssetBulkDeleteInput(
  input: AiImageAssetBulkDeleteInput,
) {
  const ids = Array.isArray(input.ids)
    ? input.ids
    : typeof input.ids === "string"
      ? [input.ids]
      : [];
  const normalizedIds = Array.from(
    new Set(
      ids
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean),
    ),
  ).slice(0, 60);

  if (normalizedIds.length === 0) {
    throw new Error("请选择要删除的图片");
  }

  return normalizedIds;
}

export function normalizeAiImageAssetZipDownloadInput(input: {
  ids?: unknown;
}) {
  const ids = Array.isArray(input.ids)
    ? input.ids
    : typeof input.ids === "string"
      ? [input.ids]
      : [];
  const normalizedIds = Array.from(
    new Set(
      ids
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean),
    ),
  ).slice(0, 60);

  if (normalizedIds.length === 0) {
    throw new Error("请选择要打包的图片");
  }

  return normalizedIds;
}

export function buildAiImageZipArchive(entries: AiImageZipEntry[]) {
  const fileNames = new Set<string>();
  const localEntries: Buffer[] = [];
  const centralEntries: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileName = createUniqueZipFileName(entry.fileName, fileNames);
    const fileNameBuffer = Buffer.from(fileName, "utf8");
    const checksum = calculateCrc32(entry.content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(entry.content.length, 18);
    localHeader.writeUInt32LE(entry.content.length, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localEntry = Buffer.concat([localHeader, fileNameBuffer, entry.content]);
    localEntries.push(localEntry);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(entry.content.length, 20);
    centralHeader.writeUInt32LE(entry.content.length, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralEntries.push(Buffer.concat([centralHeader, fileNameBuffer]));
    offset += localEntry.length;
  }

  const centralDirectory = Buffer.concat(centralEntries);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localEntries, centralDirectory, endRecord]);
}

function createUniqueZipFileName(fileName: string, usedNames: Set<string>) {
  const sanitized = path.basename(fileName).replace(/[\\/:*?"<>|]/g, "-") || "image.png";
  const extension = path.extname(sanitized);
  const baseName = extension ? sanitized.slice(0, -extension.length) : sanitized;
  let candidate = sanitized;
  let occurrence = 2;

  while (usedNames.has(candidate)) {
    candidate = `${baseName}-${occurrence}${extension}`;
    occurrence += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function calculateCrc32(content: Buffer) {
  let checksum = 0xffffffff;

  for (const byte of content) {
    checksum ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      checksum = checksum & 1 ? (checksum >>> 1) ^ 0xedb88320 : checksum >>> 1;
    }
  }

  return (checksum ^ 0xffffffff) >>> 0;
}

function normalizeRequiredText(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function normalizeOptionalText(value: string | null | undefined) {
  return value?.trim() || null;
}

function normalizeStringList(value: string[] | null | undefined) {
  return Array.from(
    new Set((value ?? []).map((item) => item.trim()).filter(Boolean)),
  );
}

function normalizeStatus(
  value: string | null | undefined,
  fallback: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED",
) {
  return value && allowedStatuses.has(value) ? value : fallback;
}

export async function createAiImageAsset(
  authorId: string,
  input: AiImageAssetCreateInput,
) {
  const data = normalizeAiImageAssetCreateInput(input);

  return prisma.aiImageAsset.create({
    data: {
      ...data,
      authorId,
    },
  });
}

export async function listAiImageAssets(authorId: string, mode?: string | null) {
  const normalizedMode = allowedModes.has(mode as AiImageToolMode)
    ? (mode as AiImageToolMode)
    : undefined;

  return prisma.aiImageAsset.findMany({
    where: {
      authorId,
      ...(normalizedMode ? { mode: normalizedMode } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });
}

export async function listAiImageGalleryItems(input: {
  authorId: string;
  mode?: string | null;
  status?: string | null;
  take?: number;
}) {
  const normalizedMode = allowedModes.has(input.mode as AiImageToolMode)
    ? (input.mode as AiImageToolMode)
    : undefined;
  const normalizedStatus = input.status && allowedStatuses.has(input.status)
    ? input.status
    : undefined;

  return prisma.aiImageAsset.findMany({
    where: {
      authorId: input.authorId,
      ...(normalizedMode ? { mode: normalizedMode } : {}),
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: Math.min(Math.max(input.take ?? 120, 1), 200),
  });
}

export async function createAiImageJob(
  authorId: string,
  input: {
    mode: string;
    sourceTool?: string | null;
    title?: string | null;
    prompt: string;
    batchCount?: number | null;
  },
) {
  if (!allowedModes.has(input.mode as AiImageToolMode)) {
    throw new Error("工具类型不正确");
  }

  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("生图提示词不能为空");
  }

  return prisma.aiImageJob.create({
    data: {
      authorId,
      mode: input.mode,
      sourceTool: normalizeOptionalText(input.sourceTool),
      title: normalizeRequiredText(input.title, "AI 批量生图任务"),
      prompt,
      batchCount: Math.min(Math.max(Math.floor(input.batchCount ?? 1), 1), 30),
      status: "PENDING",
    },
  });
}

export async function markAiImageJobRunning(authorId: string, id: string) {
  const existing = await getAiImageJob(authorId, id);

  if (!existing) {
    return null;
  }

  return prisma.aiImageJob.update({
    where: { id },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });
}

/**
 * Atomically claims the oldest queued job. The conditional update prevents two
 * worker requests from processing the same job when a poll overlaps.
 */
export async function claimNextAiImageJob() {
  const candidate = await prisma.aiImageJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  if (!candidate) {
    return null;
  }

  const claim = await prisma.aiImageJob.updateMany({
    where: { id: candidate.id, status: "PENDING" },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  if (claim.count !== 1) {
    return null;
  }

  return prisma.aiImageJob.findUnique({ where: { id: candidate.id } });
}

export async function requeueStaleAiImageJobs() {
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  return prisma.aiImageJob.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: staleBefore },
    },
    data: {
      status: "PENDING",
      startedAt: null,
    },
  });
}

export async function markAiImageJobCompleted(
  authorId: string,
  id: string,
  input: {
    completedCount: number;
    failedCount?: number;
  },
) {
  const existing = await getAiImageJob(authorId, id);

  if (!existing) {
    return null;
  }

  return prisma.aiImageJob.update({
    where: { id },
    data: {
      status: input.failedCount ? "FAILED" : "SUCCEEDED",
      completedCount: input.completedCount,
      failedCount: input.failedCount ?? 0,
      completedAt: new Date(),
    },
  });
}

export async function markAiImageJobFailed(
  authorId: string,
  id: string,
  errorMessage: string,
) {
  const existing = await getAiImageJob(authorId, id);

  if (!existing) {
    return null;
  }

  return prisma.aiImageJob.update({
    where: { id },
    data: {
      status: "FAILED",
      failedCount: 1,
      errorMessage,
      completedAt: new Date(),
    },
  });
}

export async function getAiImageJob(authorId: string, id: string) {
  return prisma.aiImageJob.findFirst({
    where: {
      id,
      authorId,
    },
  });
}

export async function listAiImageJobs(input: {
  authorId: string;
  mode?: string | null;
  status?: string | null;
  take?: number;
}) {
  const normalizedMode = allowedModes.has(input.mode as AiImageToolMode)
    ? (input.mode as AiImageToolMode)
    : undefined;
  const normalizedStatus = input.status && allowedStatuses.has(input.status)
    ? input.status
    : undefined;

  return prisma.aiImageJob.findMany({
    where: {
      authorId: input.authorId,
      ...(normalizedMode ? { mode: normalizedMode } : {}),
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: Math.min(Math.max(input.take ?? 60, 1), 120),
  });
}

export async function getAiImageAsset(authorId: string, id: string) {
  return prisma.aiImageAsset.findFirst({
    where: {
      id,
      authorId,
    },
  });
}

export async function updateAiImageAsset(
  authorId: string,
  id: string,
  input: AiImageAssetUpdateInput,
) {
  const existing = await getAiImageAsset(authorId, id);

  if (!existing) {
    return null;
  }

  return prisma.aiImageAsset.update({
    where: { id },
    data: normalizeAiImageAssetUpdateInput(input),
  });
}

export async function deleteAiImageAsset(authorId: string, id: string) {
  const existing = await getAiImageAsset(authorId, id);

  if (!existing) {
    return null;
  }

  await prisma.aiImageAsset.delete({
    where: { id },
  });
  await deleteStoredRuntimeImage(existing.imageUrl);

  return existing;
}

export async function deleteAiImageAssets(authorId: string, input: AiImageAssetBulkDeleteInput) {
  const ids = normalizeAiImageAssetBulkDeleteInput(input);
  const deleted = [];

  for (const id of ids) {
    const asset = await deleteAiImageAsset(authorId, id);
    if (asset) {
      deleted.push(asset);
    }
  }

  return deleted;
}

async function deleteStoredRuntimeImage(imageUrl: string) {
  if (isAliyunOssEnabled() && /^https?:\/\//i.test(imageUrl)) {
    try {
      await deleteAliyunOssObjectByUrl(imageUrl);
    } catch {
      // Deleting the DB record should not fail because remote cleanup failed.
    }
    return;
  }

  const match = imageUrl.match(/^\/api\/uploads\/ai-images\/([^/]+\.png)$/i);

  if (!match) {
    return;
  }

  const filePath = path.join(
    process.cwd(),
    ".runtime",
    "uploads",
    "ai-images",
    match[1],
  );

  try {
    await unlink(filePath);
  } catch {
    // Deleting the DB record should not fail because the file was already gone.
  }
}
