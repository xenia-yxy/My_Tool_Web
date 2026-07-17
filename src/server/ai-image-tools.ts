import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildAiRuntimeConfigsForUser } from "@/server/ai-model-configs";
import { createAiGateway } from "@/server/ai-gateway/provider-registry";
import {
  isAliyunOssEnabled,
  uploadBufferToAliyunOss,
} from "@/server/oss-storage";
import {
  imageAspectRatioToSize,
  type ImageAspectRatioPreset,
} from "@/lib/image-aspect-ratios";

export type AiImageToolMode =
  | "custom"
  | "outfit"
  | "menswear"
  | "womenswear"
  | "snack-grocery"
  | "ip-prototype";
export type ImageAspectRatio = ImageAspectRatioPreset;
export type ImageQuality = "low" | "medium" | "high";
export type OutfitModelMode = "flatlay" | "half_body" | "full_body";
export type OutfitModelGender = "female" | "male" | "unspecified";
export type OutfitModelFace = "no_face" | "show_face";

export type AiImagePromptInput = {
  mode: AiImageToolMode;
  description: string;
  purpose?: string;
  style?: string;
  extraInstructions?: string;
  category?: string;
  scene?: string;
  outfitModelMode?: string | null;
  outfitModelGender?: string | null;
  outfitModelFace?: string | null;
};

export type AizhzoImageConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  generationUrl: string;
  editUrl: string;
};

export type NormalizedGeneratedImage = {
  imageUrl: string;
  downloadUrl: string;
  fileName: string;
  revisedPrompt?: string;
  mimeType: string;
};

export type SavedGeneratedImage = NormalizedGeneratedImage & {
  storedImageUrl?: string;
};

type EnvSource = Record<string, string | undefined>;

type ImageApiResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
};

const defaultImageFileName = "ai-image.png";

export function normalizeImageBatchCount(value: unknown) {
  const count = Number(value);

  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.min(Math.max(Math.floor(count), 1), 30);
}

export function normalizeImageSize(value?: string | null) {
  return imageAspectRatioToSize(value);
}

export function normalizeImageQuality(value?: string | null): ImageQuality {
  if (value === "medium" || value === "high") {
    return value;
  }

  return "low";
}

export function normalizeOutfitModelOptions(input: {
  outfitModelMode?: string | null;
  outfitModelGender?: string | null;
  outfitModelFace?: string | null;
}) {
  const outfitModelMode =
    input.outfitModelMode === "half_body" || input.outfitModelMode === "full_body"
      ? input.outfitModelMode
      : "flatlay";
  const outfitModelGender =
    input.outfitModelGender === "female" || input.outfitModelGender === "male"
      ? input.outfitModelGender
      : "unspecified";
  const outfitModelFace =
    input.outfitModelFace === "show_face" ? input.outfitModelFace : "no_face";

  return {
    outfitModelMode,
    outfitModelGender,
    outfitModelFace,
  } satisfies {
    outfitModelMode: OutfitModelMode;
    outfitModelGender: OutfitModelGender;
    outfitModelFace: OutfitModelFace;
  };
}

export function buildAiImagePrompt(input: AiImagePromptInput) {
  const description = input.description.trim();

  if (!description) {
    throw new Error("生图描述不能为空");
  }

  if (input.mode === "outfit") {
    return buildOutfitImagePrompt(input);
  }

  return [
    "你是专业 AI 视觉设计师，请根据用户描述生成一张可直接用于网站、社媒或内容创作的图片。",
    "",
    "用户描述：",
    description,
    "",
    `用途：${input.purpose?.trim() || "自由创作"}`,
    `风格：${input.style?.trim() || "自然、清晰、有完成度"}`,
    input.extraInstructions?.trim()
      ? `补充要求：${input.extraInstructions.trim()}`
      : "",
    "",
    "输出要求：画面主体明确，构图干净，避免低质、变形、错误文字和杂乱背景；除非用户明确要求，不要在图片中生成大段文字。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildOutfitImagePrompt(input: AiImagePromptInput) {
  const modelInstruction = buildOutfitModelInstruction(input);

  return [
    "基于上传服装参考图，生成一张一衣多搭展示图。",
    "",
    "画面要求：16:9 或横版视觉优先，背景干净，整体适合电商详情页、小红书或穿搭参考。",
    "必须保留参考图中主商品的品类、廓形、颜色、材质、图案和结构，不要改款、换色或改变主商品身份。",
    "生成 3-5 套搭配组合，搭配品类丰富、美观、符合当前趋势；主商品始终是视觉核心。",
    "",
    "基础信息：",
    `品类：${input.category?.trim() || "请根据图片判断"}`,
    `使用场景：${input.scene?.trim() || "穿搭展示"}`,
    `用户要求：${input.description.trim()}`,
    "",
    "模特展示设置：",
    modelInstruction,
    "",
    "质量要求：避免肢体畸形、衣服结构错乱、主商品变形、错误文字、水印、过度复杂背景。",
  ].join("\n");
}

function buildOutfitModelInstruction(input: {
  outfitModelMode?: string | null;
  outfitModelGender?: string | null;
  outfitModelFace?: string | null;
}) {
  const { outfitModelMode, outfitModelGender, outfitModelFace } =
    normalizeOutfitModelOptions(input);

  if (outfitModelMode === "flatlay") {
    return "无模特平铺。不出现真人、身体、手部或人脸，只展示主商品和搭配单品。";
  }

  const modelLabels = {
    half_body: {
      female: "半身女模特",
      male: "半身男模特",
      unspecified: "半身模特",
    },
    full_body: {
      female: "全身女模特",
      male: "全身男模特",
      unspecified: "全身模特",
    },
  } as const;
  const poseRule =
    outfitModelMode === "half_body"
      ? "构图为半身或上半身穿搭展示，重点保证服装版型、领口、袖型、下摆和面料清晰。"
      : "构图为全身穿搭展示，完整站姿或自然轻姿势，允许鞋包配饰辅助成套搭配。";
  const faceRule =
    outfitModelFace === "show_face"
      ? "脸部设置：可露脸，但五官自然干净，不抢服装主体。"
      : "脸部设置：不露脸，使用裁脸、侧脸弱化、头部出框或低存在感处理。";

  return [
    `${modelLabels[outfitModelMode][outfitModelGender]}。`,
    poseRule,
    faceRule,
  ].join("\n");
}

export function getAizhzoImageConfig(env: EnvSource = process.env) {
  const apiKey = env.AIZHZO_API_KEY || env.AI_IMAGE_API_KEY;

  if (!apiKey) {
    throw new Error("缺少 AIZHZO_API_KEY 或 AI_IMAGE_API_KEY 环境变量");
  }

  const baseUrl = trimTrailingSlash(
    env.AIZHZO_BASE_URL || env.AI_IMAGE_BASE_URL || "https://api.aizhzo.com",
  );
  const model = env.AIZHZO_IMAGE_MODEL || env.AI_IMAGE_MODEL || "gpt-image-2";
  const generationPath =
    env.AIZHZO_IMAGE_GENERATION_PATH ||
    env.IMAGE_API_PATH ||
    "/v1/images/generations";
  const editPath =
    env.AIZHZO_IMAGE_EDIT_PATH || env.IMAGE_EDIT_API_PATH || "/v1/images/edits";

  return {
    apiKey,
    baseUrl,
    model,
    generationUrl: buildUrl(baseUrl, generationPath),
    editUrl: buildUrl(baseUrl, editPath),
  };
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, pathname: string) {
  return `${trimTrailingSlash(baseUrl)}/${pathname.replace(/^\/+/, "")}`;
}

export function normalizeGeneratedImageResponse(
  response: ImageApiResponse,
): NormalizedGeneratedImage {
  const firstImage = response.data?.[0];
  const dataUrl = firstImage?.b64_json
    ? `data:image/png;base64,${firstImage.b64_json}`
    : undefined;
  const imageUrl = dataUrl || firstImage?.url;

  if (!imageUrl) {
    throw new Error("图片接口没有返回可展示的图片");
  }

  return {
    imageUrl,
    downloadUrl: imageUrl,
    fileName: defaultImageFileName,
    revisedPrompt: firstImage?.revised_prompt,
    mimeType: "image/png",
  };
}

export async function generateImageFromText(input: {
  prompt: string;
  size: string;
  quality: ImageQuality;
  userId?: string;
}) {
  const gateway = createAiGateway({
    models: await buildAiRuntimeConfigsForUser(input.userId),
  });
  const payload = await gateway.generateImage(input);

  return normalizeGeneratedImageResponse(payload as ImageApiResponse);
}

export async function editImageWithReference(input: {
  prompt: string;
  size: string;
  quality: ImageQuality;
  image: File;
  userId?: string;
}) {
  return editImageWithReferences({
    ...input,
    images: [input.image],
  });
}

export async function editImageWithReferences(input: {
  prompt: string;
  size: string;
  quality: ImageQuality;
  images: File[];
  userId?: string;
}) {
  const gateway = createAiGateway({
    models: await buildAiRuntimeConfigsForUser(input.userId),
  });
  const payload = await gateway.editImage({
    prompt: input.prompt,
    size: input.size,
    quality: input.quality,
    image: input.images,
  });

  return normalizeGeneratedImageResponse(payload as ImageApiResponse);
}

export async function saveGeneratedImageToRuntime(
  image: NormalizedGeneratedImage,
) {
  const buffer = await generatedImageToBuffer(image.imageUrl);
  const fileName = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}.png`;
  const uploadDir = path.join(process.cwd(), ".runtime", "uploads", "ai-images");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);
  const localUrl = `/api/uploads/ai-images/${fileName}`;

  if (isAliyunOssEnabled()) {
    const uploaded = await uploadBufferToAliyunOss({
      buffer,
      fileName,
      contentType: image.mimeType,
    });

    return {
      ...image,
      fileName,
      imageUrl: uploaded.imageUrl,
      downloadUrl: uploaded.imageUrl,
      storedImageUrl: uploaded.imageUrl,
    } satisfies SavedGeneratedImage;
  }

  return {
    ...image,
    fileName,
    imageUrl: localUrl,
    downloadUrl: localUrl,
    storedImageUrl: localUrl,
  } satisfies SavedGeneratedImage;
}

export async function saveReferenceImageToRuntime(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `ref-${new Date().toISOString().slice(0, 10)}-${randomUUID()}.png`;
  const uploadDir = path.join(process.cwd(), ".runtime", "uploads", "ai-images");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  if (isAliyunOssEnabled()) {
    const uploaded = await uploadBufferToAliyunOss({
      buffer,
      fileName,
      contentType: file.type || "image/png",
    });

    return uploaded.imageUrl;
  }

  return `/api/uploads/ai-images/${fileName}`;
}

export async function hydrateReferenceImages(referenceImageUrls: string[]) {
  const files = await Promise.all(referenceImageUrls.slice(0, 8).map(hydrateReferenceImage));
  return files.filter((file): file is File => file !== null);
}

async function hydrateReferenceImage(imageUrl: string): Promise<File | null> {
  try {
    if (imageUrl.startsWith("/api/uploads/ai-images/")) {
      const fileName = path.basename(imageUrl);
      if (!/^ref-[\w-]+\.png$/i.test(fileName)) return null;
      const filePath = path.join(process.cwd(), ".runtime", "uploads", "ai-images", fileName);
      return new File([await readFile(filePath)], fileName, { type: "image/png" });
    }

    if (!/^https?:\/\//i.test(imageUrl)) return null;
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type")?.split(";", 1)[0] || "image/png";
    if (!contentType.startsWith("image/")) return null;
    const fileName = path.basename(new URL(imageUrl).pathname) || "reference.png";
    return new File([await response.arrayBuffer()], fileName, { type: contentType });
  } catch {
    return null;
  }
}

async function generatedImageToBuffer(imageUrl: string) {
  if (imageUrl.startsWith("data:image/")) {
    const [, base64] = imageUrl.split(",", 2);
    return Buffer.from(base64, "base64");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("生成图片下载失败，无法保存到网站");
  }

  return Buffer.from(await response.arrayBuffer());
}
