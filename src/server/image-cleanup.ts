import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  deleteAliyunOssObjectByUrl,
  isAliyunOssEnabled,
} from "@/server/oss-storage";

export const imageCleanupTargetIds = [
  "generated-gallery",
  "material-library",
  "product-images",
  "ip-prototypes",
  "workbench-cache",
  "runtime-files",
] as const;

export type ImageCleanupTargetId = (typeof imageCleanupTargetIds)[number];

export type ImageCleanupSummary = {
  generatedAssets: number;
  imageJobs: number;
  materialImages: number;
  materialProfileLinks: number;
  materialProjectLinks: number;
  productImages: number;
  ipPrototypeGenerations: number;
  workbenchSessions: number;
  creativeCanvasSessions: number;
  runtimeFiles: number;
  runtimeBytes: number;
  storedUrls: number;
};

export type ImageCleanupResult = ImageCleanupSummary & {
  deletedStoredObjects: number;
  failedStoredObjects: number;
};

const emptySummary: ImageCleanupSummary = {
  generatedAssets: 0,
  imageJobs: 0,
  materialImages: 0,
  materialProfileLinks: 0,
  materialProjectLinks: 0,
  productImages: 0,
  ipPrototypeGenerations: 0,
  workbenchSessions: 0,
  creativeCanvasSessions: 0,
  runtimeFiles: 0,
  runtimeBytes: 0,
  storedUrls: 0,
};

export function normalizeImageCleanupTargets(value: unknown): ImageCleanupTargetId[] {
  const rawItems = Array.isArray(value) ? value : imageCleanupTargetIds;
  const targets = rawItems
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is ImageCleanupTargetId =>
      imageCleanupTargetIds.includes(item as ImageCleanupTargetId),
    );

  return Array.from(new Set(targets));
}

export async function getImageCleanupPreview(targets: ImageCleanupTargetId[]) {
  const urls = new Set<string>();
  const summary = { ...emptySummary };

  if (targets.includes("generated-gallery")) {
    const [assets, imageJobs] = await Promise.all([
      prisma.aiImageAsset.findMany({
        select: {
          imageUrl: true,
          downloadUrl: true,
          referenceImages: true,
        },
      }),
      prisma.aiImageJob.count(),
    ]);
    summary.generatedAssets = assets.length;
    summary.imageJobs = imageJobs;
    assets.forEach((asset) => {
      addUrl(urls, asset.imageUrl);
      addUrl(urls, asset.downloadUrl);
      asset.referenceImages.forEach((url) => addUrl(urls, url));
    });
  }

  if (targets.includes("material-library")) {
    const [materials, materialProfileLinks, materialProjectLinks] = await Promise.all([
      prisma.menswearMaterial.findMany({
        select: {
          imageUrl: true,
          previewUrl: true,
          maskUrl: true,
          sourceUrl: true,
        },
      }),
      prisma.menswearModelProfileImage.count(),
      prisma.menswearProjectReference.count(),
    ]);
    summary.materialImages = materials.length;
    summary.materialProfileLinks = materialProfileLinks;
    summary.materialProjectLinks = materialProjectLinks;
    materials.forEach((material) => {
      addUrl(urls, material.imageUrl);
      addUrl(urls, material.previewUrl);
      addUrl(urls, material.maskUrl);
      addUrl(urls, material.sourceUrl);
    });
  }

  if (targets.includes("product-images")) {
    const images = await prisma.productImage.findMany({
      select: { imageUrl: true },
    });
    summary.productImages = images.length;
    images.forEach((image) => addUrl(urls, image.imageUrl));
  }

  if (targets.includes("ip-prototypes")) {
    const generations = await prisma.ipPrototypeGeneration.findMany({
      select: {
        imageUrl: true,
        downloadUrl: true,
        draftImageUrl: true,
        styleImageUrl: true,
      },
    });
    summary.ipPrototypeGenerations = generations.length;
    generations.forEach((generation) => {
      addUrl(urls, generation.imageUrl);
      addUrl(urls, generation.downloadUrl);
      addUrl(urls, generation.draftImageUrl);
      addUrl(urls, generation.styleImageUrl);
    });
  }

  if (targets.includes("workbench-cache")) {
    const [workbenchSessions, creativeCanvasSessions] = await Promise.all([
      prisma.workbenchSession.count(),
      prisma.creativeCanvasSession.count(),
    ]);
    summary.workbenchSessions = workbenchSessions;
    summary.creativeCanvasSessions = creativeCanvasSessions;
  }

  if (targets.includes("runtime-files")) {
    const runtime = await collectRuntimeUploadFiles();
    summary.runtimeFiles = runtime.files.length;
    summary.runtimeBytes = runtime.bytes;
  }

  summary.storedUrls = urls.size;

  return { summary, urls: Array.from(urls) };
}

export async function cleanupImages(targets: ImageCleanupTargetId[]) {
  const preview = await getImageCleanupPreview(targets);
  let deletedStoredObjects = 0;
  let failedStoredObjects = 0;

  for (const imageUrl of preview.urls) {
    try {
      const deleted = await deleteStoredImageByUrl(imageUrl);
      if (deleted) deletedStoredObjects += 1;
    } catch {
      failedStoredObjects += 1;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (targets.includes("generated-gallery")) {
      await tx.aiImageAsset.deleteMany({});
      await tx.aiImageJob.deleteMany({});
    }

    if (targets.includes("material-library")) {
      await tx.menswearProjectReference.deleteMany({});
      await tx.menswearModelProfileImage.deleteMany({});
      await tx.menswearMaterial.deleteMany({});
    }

    if (targets.includes("product-images")) {
      await tx.productImage.deleteMany({});
    }

    if (targets.includes("ip-prototypes")) {
      await tx.ipPrototypeGeneration.deleteMany({});
    }

    if (targets.includes("workbench-cache")) {
      await tx.creativeCanvasRun.deleteMany({});
      await tx.creativeCanvasEdge.deleteMany({});
      await tx.creativeCanvasNode.deleteMany({});
      await tx.creativeCanvasSession.deleteMany({});
      await tx.workbenchSession.updateMany({
        data: {
          imageAssetIds: [],
          outputSnapshot: {},
          externalJobId: null,
          errorMessage: null,
        },
      });
    }
  });

  if (targets.includes("runtime-files")) {
    const runtime = await collectRuntimeUploadFiles();
    for (const filePath of runtime.files.map((file) => file.path)) {
      await rm(filePath, { force: true }).catch(() => undefined);
    }
  }

  return {
    ...preview.summary,
    deletedStoredObjects,
    failedStoredObjects,
  } satisfies ImageCleanupResult;
}

async function deleteStoredImageByUrl(imageUrl: string) {
  if (isAliyunOssEnabled()) {
    const deleted = await deleteAliyunOssObjectByUrl(imageUrl).catch(() => false);
    if (deleted) return true;
  }

  const localFilePath = getLocalRuntimeImagePath(imageUrl);
  if (!localFilePath) return false;

  await rm(localFilePath, { force: true });
  return true;
}

function getLocalRuntimeImagePath(imageUrl: string) {
  const match = imageUrl.match(
    /^\/api\/uploads\/(ai-images|ip-prototypes)\/([^/]+)$/i,
  );

  if (!match) return null;

  const baseDir = path.join(process.cwd(), ".runtime", "uploads", match[1]);
  const filePath = path.resolve(baseDir, match[2]);

  return filePath.startsWith(`${baseDir}${path.sep}`) ? filePath : null;
}

async function collectRuntimeUploadFiles() {
  const uploadRoot = path.join(process.cwd(), ".runtime", "uploads");
  const allowedDirs = ["ai-images", "ip-prototypes"];
  const files: Array<{ path: string; bytes: number }> = [];

  for (const dir of allowedDirs) {
    await collectFiles(path.join(uploadRoot, dir), files);
  }

  return {
    files,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
  };
}

async function collectFiles(dir: string, files: Array<{ path: string; bytes: number }>) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(entryPath, files);
      continue;
    }

    if (!entry.isFile()) continue;

    const fileStat = await stat(entryPath).catch(() => null);
    files.push({ path: entryPath, bytes: fileStat?.size ?? 0 });
  }
}

function addUrl(urls: Set<string>, value: string | null | undefined) {
  const url = value?.trim();
  if (url) urls.add(url);
}
