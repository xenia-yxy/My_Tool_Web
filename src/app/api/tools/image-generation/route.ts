import { NextResponse } from "next/server";
import { createAiImageJob } from "@/server/ai-image-assets";
import {
  buildAiImagePrompt,
  normalizeImageBatchCount,
  saveReferenceImageToRuntime,
  type AiImageToolMode,
} from "@/server/ai-image-tools";
import type { AiImageQueuePayload } from "@/server/ai-image-queue";
import { resolveImageWorkbenchToolId } from "@/lib/image-generation-workflow";
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
    return await (contentType.includes("multipart/form-data")
      ? handleMultipartImageRequest(request, session.user.id)
      : handleJsonImageRequest(request, session.user.id));
  } catch (error) {
    return NextResponse.json({ error: toPublicErrorMessage(error) }, { status: 400 });
  }
}

async function handleJsonImageRequest(request: Request, authorId: string) {
  const body = (await request.json()) as JsonImageRequest;
  const mode = normalizeRequestMode(body.mode);
  const batchCount = normalizeImageBatchCount(body.batchCount);
  const prompt = body.finalPrompt?.trim() || buildAiImagePrompt({
    mode: getPromptMode(mode),
    description: body.description || "",
    purpose: body.purpose,
    style: body.style,
    extraInstructions: body.extraInstructions,
  });
  const title = body.purpose?.trim() || body.description?.trim() || "AI 批量生图任务";
  const queuePayload: AiImageQueuePayload = {
    mode,
    sourceTool: body.sourceTool?.trim() || null,
    title,
    description: body.description || "",
    purpose: body.purpose || "",
    caption: body.caption || "",
    tags: normalizeListInput(body.tags),
    productKeywords: normalizeListInput(body.productKeywords),
    prompt,
    aspectRatio: body.aspectRatio || "square",
    quality: body.quality || "low",
    batchCount,
    splitOutfitMode: false,
    referenceImageUrls: [],
    referenceLabels: [],
  };

  return queueImageGeneration({
    authorId,
    workbenchSessionId: body.workbenchSessionId,
    queuePayload,
  });
}

async function handleMultipartImageRequest(request: Request, authorId: string) {
  const formData = await request.formData();
  const images = readRequiredImages(formData);
  const referenceImageUrls = await Promise.all(images.map(saveReferenceImageToRuntime));
  const mode = normalizeRequestMode(getFormText(formData, "mode"));
  const batchCount = normalizeImageBatchCount(getFormText(formData, "batchCount"));
  const description = getFormText(formData, "description") || "";
  const prompt = getFormText(formData, "finalPrompt")?.trim() || buildMultipartPrompt(formData, mode, description);
  const purpose = getFormText(formData, "purpose") || "";
  const sourceTool = getFormText(formData, "sourceTool") || null;
  const queuePayload: AiImageQueuePayload = {
    mode,
    sourceTool,
    title: purpose || description || "AI 批量生图任务",
    description,
    purpose,
    caption: getFormText(formData, "caption") || "",
    tags: parseFormList(formData, "tags"),
    productKeywords: parseFormList(formData, "productKeywords"),
    prompt,
    aspectRatio: getFormText(formData, "aspectRatio") || "square",
    quality: getFormText(formData, "quality") || "low",
    batchCount,
    splitOutfitMode: getFormText(formData, "splitOutfitMode") === "true",
    referenceImageUrls,
    referenceLabels: parseFormList(formData, "referenceLabel"),
  };

  return queueImageGeneration({
    authorId,
    workbenchSessionId: getFormText(formData, "workbenchSessionId"),
    queuePayload,
  });
}

async function queueImageGeneration(input: {
  authorId: string;
  workbenchSessionId?: string;
  queuePayload: AiImageQueuePayload;
}) {
  const job = await createAiImageJob(input.authorId, {
    mode: input.queuePayload.mode,
    sourceTool: input.queuePayload.sourceTool,
    title: input.queuePayload.title,
    prompt: input.queuePayload.prompt,
    batchCount: input.queuePayload.batchCount,
  });
  const workbenchSessionId = await ensureImageWorkbenchSession(
    input.authorId,
    input.workbenchSessionId?.trim() || null,
    job.id,
    input.queuePayload,
  );

  return NextResponse.json({
    queued: true,
    job,
    workbenchSessionId,
  }, { status: 202 });
}

function buildMultipartPrompt(formData: FormData, mode: AiImageToolMode, description: string) {
  if (mode !== "outfit") {
    return buildAiImagePrompt({
      mode: "custom",
      description: description || "基于参考图生成图片",
      purpose: getFormText(formData, "purpose"),
      style: getFormText(formData, "style"),
      extraInstructions: "基于上传参考图进行编辑生成，保留参考图里用户明确需要保留的主体、构图、材质、颜色和关键视觉元素；按用户描述修改，不要无关重绘。",
    });
  }

  return buildAiImagePrompt({
    mode,
    description: description || "生成一衣多搭展示图",
    category: getFormText(formData, "category"),
    scene: getFormText(formData, "scene"),
    outfitModelMode: getFormText(formData, "outfitModelMode"),
    outfitModelGender: getFormText(formData, "outfitModelGender"),
    outfitModelFace: getFormText(formData, "outfitModelFace"),
  });
}

function getFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function normalizeListInput(value: string[] | string | undefined) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n，、\s]+/) : [];
  return values.map((item) => item.trim()).filter(Boolean);
}

function parseFormList(formData: FormData, key: string) {
  const values = formData.getAll(key).filter((value): value is string => typeof value === "string");
  return values.length > 1 ? values.map((value) => value.trim()).filter(Boolean) : normalizeListInput(values[0]);
}

function normalizeRequestMode(value: unknown): AiImageToolMode {
  return value === "outfit" || value === "menswear" || value === "womenswear" || value === "snack-grocery"
    ? value
    : "custom";
}

function getPromptMode(mode: AiImageToolMode): AiImageToolMode {
  return mode === "outfit" ? "outfit" : "custom";
}

function readRequiredImages(formData: FormData) {
  const images = formData.getAll("image").filter((image): image is File => image instanceof File);
  if (!images.length) throw new Error("请先上传参考图");
  images.forEach((image) => {
    if (!allowedImageTypes.has(image.type)) throw new Error("仅支持 PNG、JPG、WebP 图片");
    if (image.size > maxUploadBytes) throw new Error("图片不能超过 8MB");
  });
  return images.slice(0, 8);
}

function toPublicErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "图片生成失败";
}

async function ensureImageWorkbenchSession(
  authorId: string,
  workbenchSessionId: string | null,
  externalJobId: string,
  queuePayload: AiImageQueuePayload,
) {
  const inputSnapshot = { ...queuePayload, queuePayload };
  if (workbenchSessionId) {
    const session = await updateWorkbenchSession(authorId, workbenchSessionId, {
      title: queuePayload.title,
      status: "DRAFT",
      prompt: queuePayload.prompt,
      inputSnapshot,
      outputSnapshot: {},
      imageAssetIds: [],
      externalJobId,
      errorMessage: null,
    });
    if (session) return session.id;
  }

  const session = await createWorkbenchSession(authorId, {
    toolId: resolveImageWorkbenchToolId(queuePayload.sourceTool || undefined),
    title: queuePayload.title,
    status: "DRAFT",
    prompt: queuePayload.prompt,
    inputSnapshot,
    outputSnapshot: {},
    imageAssetIds: [],
    externalJobId,
    errorMessage: null,
  });
  return session.id;
}
