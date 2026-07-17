import type { Prisma } from "../../generated/prisma/client";
import {
  createAiImageAsset,
  markAiImageJobCompleted,
  markAiImageJobFailed,
} from "@/server/ai-image-assets";
import {
  editImageWithReferences,
  generateImageFromText,
  hydrateReferenceImages,
  normalizeImageQuality,
  normalizeImageSize,
  saveGeneratedImageToRuntime,
  type AiImageToolMode,
} from "@/server/ai-image-tools";
import { buildImageGenerationSessionOutput } from "@/lib/image-generation-workflow";
import { updateWorkbenchSession } from "@/server/workbench-sessions";
import { prisma } from "@/lib/prisma";

export type AiImageQueuePayload = {
  mode: AiImageToolMode;
  sourceTool: string | null;
  title: string;
  description: string;
  purpose: string;
  caption: string;
  tags: string[];
  productKeywords: string[];
  prompt: string;
  aspectRatio: string;
  quality: string;
  batchCount: number;
  splitOutfitMode: boolean;
  referenceImageUrls: string[];
  referenceLabels: string[];
};

export function getQueuePayload(snapshot: Prisma.JsonValue): AiImageQueuePayload | null {
  if (!isRecord(snapshot) || !isRecord(snapshot.queuePayload)) {
    return null;
  }

  const value = snapshot.queuePayload;
  const mode = value.mode;
  if (!isMode(mode) || typeof value.prompt !== "string" || !value.prompt.trim()) {
    return null;
  }

  return {
    mode,
    sourceTool: textOrNull(value.sourceTool),
    title: text(value.title, "AI 批量生图任务"),
    description: text(value.description),
    purpose: text(value.purpose),
    caption: text(value.caption),
    tags: stringList(value.tags),
    productKeywords: stringList(value.productKeywords),
    prompt: value.prompt.trim(),
    aspectRatio: text(value.aspectRatio, "square"),
    quality: text(value.quality, "low"),
    batchCount: normalizeBatchCount(value.batchCount),
    splitOutfitMode: value.splitOutfitMode === true,
    referenceImageUrls: stringList(value.referenceImageUrls),
    referenceLabels: stringList(value.referenceLabels),
  };
}

export async function processAiImageJob(input: {
  id: string;
  authorId: string;
  batchCount: number;
}) {
  const session = await prisma.workbenchSession.findFirst({
    where: { authorId: input.authorId, externalJobId: input.id },
  });

  if (!session) {
    await markAiImageJobFailed(input.authorId, input.id, "未找到该任务的工作台会话");
    return { status: "failed" as const, reason: "session_missing" };
  }

  const payload = getQueuePayload(session.inputSnapshot);
  if (!payload) {
    const errorMessage = "任务输入已损坏，无法恢复生成";
    await markAiImageJobFailed(input.authorId, input.id, errorMessage);
    await updateWorkbenchSession(input.authorId, session.id, {
      status: "FAILED",
      errorMessage,
    });
    return { status: "failed" as const, reason: "payload_invalid" };
  }

  await updateWorkbenchSession(input.authorId, session.id, { status: "RUNNING", errorMessage: null });

  try {
    const images = payload.referenceImageUrls.length
      ? await hydrateReferenceImages(payload.referenceImageUrls)
      : [];
    if (payload.referenceImageUrls.length > 0 && images.length === 0) {
      throw new Error("参考图已无法读取，请重新上传后再生成");
    }
    const results = [];

    for (let index = 0; index < payload.batchCount; index += 1) {
      const prompt = buildBatchPrompt(payload, index);
      const generated = await retryAiImageGeneration(() =>
        images.length
          ? editImageWithReferences({
              prompt,
              images,
              size: normalizeImageSize(payload.aspectRatio),
              quality: normalizeImageQuality(payload.quality),
              userId: input.authorId,
            })
          : generateImageFromText({
              prompt,
              size: normalizeImageSize(payload.aspectRatio),
              quality: normalizeImageQuality(payload.quality),
              userId: input.authorId,
            }),
      );
      const saved = await saveGeneratedImageToRuntime(generated);
      const asset = await createAiImageAsset(input.authorId, {
        mode: payload.mode,
        sourceTool: payload.sourceTool,
        status: "SUCCEEDED",
        jobId: input.id,
        title: buildAssetTitle(payload.purpose, payload.description, index, payload.batchCount),
        description: payload.mode === "outfit" ? payload.description : payload.purpose,
        caption: payload.caption,
        tags: payload.tags,
        productKeywords: payload.productKeywords,
        prompt: payload.prompt,
        imageUrl: saved.imageUrl,
        downloadUrl: saved.downloadUrl,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        referenceImages: payload.referenceImageUrls,
        referenceLabels: payload.referenceLabels,
      });
      results.push({ ...saved, asset });
    }

    await markAiImageJobCompleted(input.authorId, input.id, { completedCount: results.length });
    await updateWorkbenchSession(input.authorId, session.id, {
      status: "SUCCEEDED",
      imageAssetIds: results.map((result) => result.asset.id),
      outputSnapshot: buildImageGenerationSessionOutput({
        jobId: input.id,
        imageUrls: results.map((result) => result.imageUrl),
        title: payload.title,
      }),
      errorMessage: null,
    });
    return { status: "succeeded" as const, count: results.length };
  } catch (error) {
    const errorMessage = toPublicErrorMessage(error);
    await markAiImageJobFailed(input.authorId, input.id, errorMessage);
    await updateWorkbenchSession(input.authorId, session.id, {
      status: "FAILED",
      errorMessage,
    });
    return { status: "failed" as const, reason: errorMessage };
  }
}

export async function retryAiImageGeneration<T>(
  operation: () => Promise<T>,
  options: { delayMs?: number; maxAttempts?: number } = {},
) {
  const maxAttempts = Math.min(Math.max(options.maxAttempts ?? 2, 1), 3);
  const delayMs = Math.max(options.delayMs ?? 5_000, 0);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isRetryableImageError(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

function isRetryableImageError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /模型请求失败：HTTP (408|409|425|429|5\d\d)\b|fetch failed|network|timeout/i.test(message);
}

function buildBatchPrompt(payload: AiImageQueuePayload, index: number) {
  if (payload.splitOutfitMode) {
    return `${payload.prompt}\n\n平铺多搭拆分序号：${index + 1}/${payload.batchCount}。只生成平铺多搭参考图中从左到右、从上到下的第 ${index + 1} 套完整组合；该图只能出现这一套，不得拼图、合集或使用其他序号搭配。`;
  }

  if (payload.batchCount > 1) {
    return `${payload.prompt}\n\n批量生成序号：${index + 1}/${payload.batchCount}。请在不偏离主体要求的前提下，调整构图、光线或细节，避免每张完全重复。`;
  }

  return payload.prompt;
}

function buildAssetTitle(purpose: string, description: string, index: number, batchCount: number) {
  const base = purpose.trim() || description.trim() || "AI 图片";
  return batchCount > 1 ? `${base} ${index + 1}` : base;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMode(value: unknown): value is AiImageToolMode {
  return ["custom", "outfit", "menswear", "womenswear", "snack-grocery", "ip-prototype"].includes(value as string);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function textOrNull(value: unknown) {
  return text(value) || null;
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 8)
    : [];
}

function normalizeBatchCount(value: unknown) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.min(Math.max(Math.floor(count), 1), 30) : 1;
}

function toPublicErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "图片生成失败";
}
