import { NextResponse } from "next/server";
import {
  createAiImageAsset,
  createAiImageJob,
  markAiImageJobCompleted,
  markAiImageJobFailed,
  markAiImageJobRunning,
} from "@/server/ai-image-assets";
import {
  buildAiImagePrompt,
  editImageWithReferences,
  generateImageFromText,
  normalizeImageBatchCount,
  normalizeImageQuality,
  normalizeImageSize,
  saveGeneratedImageToRuntime,
  saveReferenceImageToRuntime,
  type AiImageToolMode,
} from "@/server/ai-image-tools";
import {
  buildImageGenerationSessionOutput,
  resolveImageWorkbenchToolId,
} from "@/lib/image-generation-workflow";
import {
  createWorkbenchSession,
  updateWorkbenchSession,
} from "@/server/workbench-sessions";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxUploadBytes = 8 * 1024 * 1024;

type JsonImageRequest = {
  mode?: AiImageToolMode;
  description?: string;
  purpose?: string;
  style?: string;
  extraInstructions?: string;
  aspectRatio?: string;
  quality?: string;
  batchCount?: unknown;
  sourceTool?: string;
  caption?: string;
  tags?: string[] | string;
  productKeywords?: string[] | string;
  finalPrompt?: string;
  workbenchSessionId?: string;
};

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      return await handleMultipartImageRequest(request, session.user.id);
    }

    return await handleJsonImageRequest(request, session.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: toPublicErrorMessage(error) },
      { status: 400 },
    );
  }
}

async function handleJsonImageRequest(request: Request, authorId: string) {
  const body = (await request.json()) as JsonImageRequest;
  const mode = normalizeRequestMode(body.mode);
  const batchCount = normalizeImageBatchCount(body.batchCount);
  const prompt =
    body.finalPrompt?.trim() ||
    buildAiImagePrompt({
      mode: getPromptMode(mode),
      description: body.description || "",
      purpose: body.purpose,
      style: body.style,
      extraInstructions: body.extraInstructions,
    });
  const results = [];
  let workbenchSessionId = body.workbenchSessionId?.trim() || null;
  const job = await createAiImageJob(authorId, {
    mode,
    sourceTool: body.sourceTool,
    title: body.purpose || body.description || "AI 批量生图任务",
    prompt,
    batchCount,
  });

  await markAiImageJobRunning(authorId, job.id);
  workbenchSessionId = await ensureImageWorkbenchSession(authorId, workbenchSessionId, {
    sourceTool: body.sourceTool,
    title: body.purpose || body.description || "AI 批量生图任务",
    prompt,
    externalJobId: job.id,
    inputSnapshot: {
      mode,
      sourceTool: body.sourceTool || null,
      description: body.description || "",
      purpose: body.purpose || "",
      style: body.style || "",
      aspectRatio: body.aspectRatio || "square",
      quality: body.quality || "low",
      batchCount,
      hasReferenceImages: false,
    },
  });
  await updateImageWorkbenchSession(authorId, workbenchSessionId, {
    status: "RUNNING",
    externalJobId: job.id,
  });

  try {
    for (let index = 0; index < batchCount; index += 1) {
      const generated = await generateImageFromText({
        prompt:
          batchCount > 1
            ? `${prompt}\n\n批量生成序号：${index + 1}/${batchCount}。请在不偏离主体要求的前提下，调整构图、光线或细节，避免每张完全重复。`
            : prompt,
        size: normalizeImageSize(body.aspectRatio),
        quality: normalizeImageQuality(body.quality),
        userId: authorId,
      });
      const saved = await saveGeneratedImageToRuntime(generated);
      const asset = await createAiImageAsset(authorId, {
        mode,
        sourceTool: body.sourceTool,
        status: "SUCCEEDED",
        jobId: job.id,
        title: buildAssetTitle(body.purpose, body.description, index, batchCount),
        description: body.purpose,
        caption: body.caption,
        tags: normalizeListInput(body.tags),
        productKeywords: normalizeListInput(body.productKeywords),
        prompt,
        imageUrl: saved.imageUrl,
        downloadUrl: saved.downloadUrl,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
      });

      results.push({
        ...saved,
        prompt,
        asset,
      });
    }

    await markAiImageJobCompleted(authorId, job.id, {
      completedCount: results.length,
    });
    await updateImageWorkbenchSession(authorId, workbenchSessionId, {
      status: "SUCCEEDED",
      externalJobId: job.id,
      imageAssetIds: results.map((result) => result.asset.id),
      outputSnapshot: buildImageGenerationSessionOutput({
        jobId: job.id,
        imageUrls: results.map((result) => result.imageUrl),
        title: body.purpose || body.description || "AI 图片",
      }),
    });
  } catch (error) {
    const errorMessage = toPublicErrorMessage(error);
    await markAiImageJobFailed(authorId, job.id, errorMessage);
    await updateImageWorkbenchSession(authorId, workbenchSessionId, {
      status: "FAILED",
      externalJobId: job.id,
      errorMessage,
    });
    throw error;
  }
  const firstResult = results[0];

  return NextResponse.json({
    ...firstResult,
    results,
    job,
  });
}

async function handleMultipartImageRequest(request: Request, authorId: string) {
  const formData = await request.formData();
  const images = readRequiredImages(formData);
  const referenceImageUrls: string[] = [];
  for (const image of images) {
    try {
      const refUrl = await saveReferenceImageToRuntime(image);
      referenceImageUrls.push(refUrl);
    } catch {
      // 参考图保存失败不阻断生图流程
    }
  }
  const batchCount = normalizeImageBatchCount(getFormText(formData, "batchCount"));
  const mode = normalizeRequestMode(getFormText(formData, "mode"));
  const description = getFormText(formData, "description");
  const finalPrompt = getFormText(formData, "finalPrompt");
  const prompt =
    finalPrompt?.trim() ||
    (mode !== "outfit"
      ? buildAiImagePrompt({
          mode: "custom",
          description: description || "基于参考图生成图片",
          purpose: getFormText(formData, "purpose"),
          style: getFormText(formData, "style"),
          extraInstructions:
            "基于上传参考图进行编辑生成，保留参考图里用户明确需要保留的主体、构图、材质、颜色和关键视觉元素；按用户描述修改，不要无关重绘。",
        })
      : buildAiImagePrompt({
          mode,
          description: description || "生成一衣多搭展示图",
          category: getFormText(formData, "category"),
          scene: getFormText(formData, "scene"),
          outfitModelMode: getFormText(formData, "outfitModelMode"),
          outfitModelGender: getFormText(formData, "outfitModelGender"),
          outfitModelFace: getFormText(formData, "outfitModelFace"),
        }));
  const results = [];
  let workbenchSessionId = getFormText(formData, "workbenchSessionId") || null;
  const sourceTool = getFormText(formData, "sourceTool");
  const job = await createAiImageJob(authorId, {
    mode,
    sourceTool,
    title: getFormText(formData, "purpose") || description || "AI 批量生图任务",
    prompt,
    batchCount,
  });

  await markAiImageJobRunning(authorId, job.id);
  workbenchSessionId = await ensureImageWorkbenchSession(authorId, workbenchSessionId, {
    sourceTool,
    title: getFormText(formData, "purpose") || description || "AI 批量生图任务",
    prompt,
    externalJobId: job.id,
    inputSnapshot: {
      mode,
      sourceTool: sourceTool || null,
      description: description || "",
      purpose: getFormText(formData, "purpose") || "",
      style: getFormText(formData, "style") || "",
      category: getFormText(formData, "category") || "",
      scene: getFormText(formData, "scene") || "",
      aspectRatio: getFormText(formData, "aspectRatio") || "square",
      quality: getFormText(formData, "quality") || "low",
      batchCount,
      outfitModelMode: getFormText(formData, "outfitModelMode") || "",
      outfitModelGender: getFormText(formData, "outfitModelGender") || "",
      outfitModelFace: getFormText(formData, "outfitModelFace") || "",
      referenceImageCount: images.length,
      referenceImageUrls,
    },
  });
  await updateImageWorkbenchSession(authorId, workbenchSessionId, {
    status: "RUNNING",
    externalJobId: job.id,
  });

  try {
    for (let index = 0; index < batchCount; index += 1) {
      const generated = await editImageWithReferences({
        prompt:
          batchCount > 1
            ? `${prompt}\n\n批量生成序号：${index + 1}/${batchCount}。请保持主商品一致，但让搭配组合、陈列顺序或拍摄细节有所区别。`
            : prompt,
        images,
        size: normalizeImageSize(getFormText(formData, "aspectRatio")),
        quality: normalizeImageQuality(getFormText(formData, "quality")),
        userId: authorId,
      });
      const saved = await saveGeneratedImageToRuntime(generated);
      const purpose = getFormText(formData, "purpose");
      const asset = await createAiImageAsset(authorId, {
        mode,
        sourceTool: getFormText(formData, "sourceTool"),
        status: "SUCCEEDED",
        jobId: job.id,
        title: buildAssetTitle(purpose, description, index, batchCount),
        description:
          mode === "outfit"
            ? getFormText(formData, "scene")
            : purpose,
        caption: getFormText(formData, "caption"),
        tags: parseFormList(formData, "tags"),
        productKeywords: parseFormList(formData, "productKeywords"),
        prompt,
        imageUrl: saved.imageUrl,
        downloadUrl: saved.downloadUrl,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        referenceImages: referenceImageUrls,
      });

      results.push({
        ...saved,
        prompt,
        asset,
      });
    }

    await markAiImageJobCompleted(authorId, job.id, {
      completedCount: results.length,
    });
    await updateImageWorkbenchSession(authorId, workbenchSessionId, {
      status: "SUCCEEDED",
      externalJobId: job.id,
      imageAssetIds: results.map((result) => result.asset.id),
      outputSnapshot: buildImageGenerationSessionOutput({
        jobId: job.id,
        imageUrls: results.map((result) => result.imageUrl),
        title: getFormText(formData, "purpose") || description || "AI 图片",
      }),
    });
  } catch (error) {
    const errorMessage = toPublicErrorMessage(error);
    await markAiImageJobFailed(authorId, job.id, errorMessage);
    await updateImageWorkbenchSession(authorId, workbenchSessionId, {
      status: "FAILED",
      externalJobId: job.id,
      errorMessage,
    });
    throw error;
  }
  const firstResult = results[0];

  return NextResponse.json({
    ...firstResult,
    results,
    job,
  });
}

function getFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function buildAssetTitle(
  purpose: string | undefined,
  description: string | undefined,
  index: number,
  batchCount: number,
) {
  const base = purpose?.trim() || description?.trim() || "AI 图片";
  return batchCount > 1 ? `${base} ${index + 1}` : base;
}

function normalizeListInput(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n，、\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseFormList(formData: FormData, key: string) {
  const directValues = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");

  if (directValues.length > 1) {
    return directValues;
  }

  return normalizeListInput(directValues[0]);
}

function normalizeRequestMode(value: unknown): AiImageToolMode {
  if (
    value === "outfit" ||
    value === "menswear" ||
    value === "womenswear" ||
    value === "snack-grocery"
  ) {
    return value;
  }

  return "custom";
}

function getPromptMode(mode: AiImageToolMode): AiImageToolMode {
  return mode === "outfit" ? "outfit" : "custom";
}

function readRequiredImages(formData: FormData) {
  const images = formData
    .getAll("image")
    .filter((image): image is File => image instanceof File);

  if (images.length === 0) {
    throw new Error("请先上传参考图");
  }

  images.forEach((image) => {
    if (!allowedImageTypes.has(image.type)) {
      throw new Error("仅支持 PNG、JPG、WebP 图片");
    }

    if (image.size > maxUploadBytes) {
      throw new Error("图片不能超过 8MB");
    }
  });

  return images.slice(0, 8);
}

function toPublicErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "图片生成失败";
}

async function updateImageWorkbenchSession(
  authorId: string,
  workbenchSessionId: string | null,
  patch: Parameters<typeof updateWorkbenchSession>[2],
) {
  if (!workbenchSessionId) {
    return;
  }

  await updateWorkbenchSession(authorId, workbenchSessionId, patch);
}

async function ensureImageWorkbenchSession(
  authorId: string,
  workbenchSessionId: string | null,
  input: {
    sourceTool?: string;
    title: string;
    prompt: string;
    externalJobId: string;
    inputSnapshot: Record<string, unknown>;
  },
) {
  if (workbenchSessionId) {
    return workbenchSessionId;
  }

  const session = await createWorkbenchSession(authorId, {
    toolId: resolveImageWorkbenchToolId(input.sourceTool),
    title: input.title,
    status: "RUNNING",
    prompt: input.prompt,
    inputSnapshot: input.inputSnapshot,
    outputSnapshot: {},
    imageAssetIds: [],
    externalJobId: input.externalJobId,
    errorMessage: null,
  });

  return session.id;
}
