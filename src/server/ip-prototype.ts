import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { isImageAspectRatioPreset } from "@/lib/image-aspect-ratios";
import {
  editImageWithReferences,
  generateImageFromText,
  normalizeImageQuality,
  normalizeImageSize,
  saveGeneratedImageToRuntime,
} from "@/server/ai-image-tools";

export type IpPrototypeType = "person" | "product" | "content";
export type IpPrototypeOutputGoal =
  | "prototype"
  | "refine"
  | "character-sheet"
  | "avatar"
  | "cover"
  | "poster"
  | "series";

export type IpPrototypeProjectInput = {
  name?: unknown;
  ipType?: unknown;
  description?: unknown;
  brandTone?: unknown;
};

export type IpPrototypeGenerationInput = {
  ipType?: unknown;
  outputGoal?: unknown;
  prompt?: unknown;
  styleText?: unknown;
  conceptStatement?: unknown;
  targetAudience?: unknown;
  personality?: unknown;
  visualAnchors?: unknown;
  avoidDirections?: unknown;
  scenario?: unknown;
  aspectRatio?: unknown;
  quality?: unknown;
};

export type IpPrototypeTaskDraft = {
  title: string;
  note: string;
  source: "IP_PROTOTYPE";
  quadrant: "SCHEDULE";
  priority: "MEDIUM";
  estimateMinutes: number;
};

const maxNameLength = 48;
const maxDescriptionLength = 500;
const maxBrandToneLength = 240;
const maxPromptLength = 1200;
const maxStyleTextLength = 500;
const maxConceptFieldLength = 500;
const uploadDir = path.join(process.cwd(), ".runtime", "uploads", "ip-prototypes");

const ipTypeLabels: Record<IpPrototypeType, string> = {
  person: "人物 IP",
  product: "产品 IP",
  content: "内容 IP",
};

const outputGoalLabels: Record<IpPrototypeOutputGoal, string> = {
  prototype: "原型图",
  refine: "精修图",
  "character-sheet": "角色设定图",
  avatar: "头像",
  cover: "封面",
  poster: "海报",
  series: "系列图",
};

export function normalizeIpPrototypeProjectInput(
  input: IpPrototypeProjectInput,
) {
  return {
    name: normalizeRequiredText(input.name, "项目名称", maxNameLength),
    ipType: normalizeIpType(input.ipType),
    description: normalizeOptionalText(
      input.description,
      "项目描述",
      maxDescriptionLength,
    ),
    brandTone: normalizeOptionalText(input.brandTone, "气质关键词", maxBrandToneLength),
  };
}

export function normalizeIpPrototypeGenerationInput(
  input: IpPrototypeGenerationInput,
) {
  return {
    ipType: normalizeIpType(input.ipType),
    outputGoal: normalizeOutputGoal(input.outputGoal),
    prompt: normalizeRequiredText(input.prompt, "当前想法", maxPromptLength),
    styleText: normalizeOptionalText(input.styleText, "风格描述", maxStyleTextLength),
    conceptStatement: normalizeOptionalText(
      input.conceptStatement,
      "IP 立意",
      maxConceptFieldLength,
    ),
    targetAudience: normalizeOptionalText(
      input.targetAudience,
      "目标用户",
      maxConceptFieldLength,
    ),
    personality: normalizeOptionalText(
      input.personality,
      "性格关键词",
      maxConceptFieldLength,
    ),
    visualAnchors: normalizeOptionalText(
      input.visualAnchors,
      "视觉锚点",
      maxConceptFieldLength,
    ),
    avoidDirections: normalizeOptionalText(
      input.avoidDirections,
      "避免方向",
      maxConceptFieldLength,
    ),
    scenario: normalizeOptionalText(
      input.scenario,
      "应用场景",
      maxConceptFieldLength,
    ),
    aspectRatio: normalizeAspectRatio(input.aspectRatio),
    quality: normalizeImageQuality(
      typeof input.quality === "string" ? input.quality : undefined,
    ),
  };
}

export function buildIpPrototypePrompt(input: {
  projectName?: string | null;
  projectDescription?: string | null;
  brandTone?: string | null;
  conceptStatement?: string | null;
  targetAudience?: string | null;
  personality?: string | null;
  visualAnchors?: string | null;
  avoidDirections?: string | null;
  scenario?: string | null;
  ipType: IpPrototypeType;
  outputGoal: IpPrototypeOutputGoal;
  prompt: string;
  styleText?: string | null;
  hasDraftImage: boolean;
  hasStyleImage: boolean;
}) {
  return [
    "你是个人 IP 原型设计师，任务是把用户还没完全成型的想法先变成一张可继续修改的视觉原型。",
    "",
    "项目基础：",
    `项目：${input.projectName?.trim() || "未命名 IP 项目"}`,
    `类型：${ipTypeLabels[input.ipType]}`,
    `输出目标：${outputGoalLabels[input.outputGoal]}`,
    input.projectDescription?.trim()
      ? `项目描述：${input.projectDescription.trim()}`
      : "",
    input.brandTone?.trim() ? `整体气质：${input.brandTone.trim()}` : "",
    hasIpConcept(input)
      ? [
          "",
          "IP 立意定义：",
          input.conceptStatement?.trim()
            ? `立意：${input.conceptStatement.trim()}`
            : "",
          input.targetAudience?.trim()
            ? `目标用户：${input.targetAudience.trim()}`
            : "",
          input.personality?.trim() ? `性格：${input.personality.trim()}` : "",
          input.visualAnchors?.trim()
            ? `视觉锚点：${input.visualAnchors.trim()}`
            : "",
          input.avoidDirections?.trim()
            ? `避免方向：${input.avoidDirections.trim()}`
            : "",
          input.scenario?.trim() ? `应用场景：${input.scenario.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    "",
    "用户当前想法：",
    input.prompt.trim(),
    "",
    "参考资料：",
    input.hasDraftImage
      ? "参考用户上传的草稿图，保留核心构图、主体关系和原始想法。"
      : "没有草稿图，请根据文字直接建立第一版原型。",
    input.hasStyleImage
      ? "参考用户上传的风格图，提取色彩、质感、镜头语言和视觉情绪，但不要直接复制图中主体。"
      : "没有风格参考图，请根据风格描述建立视觉方向。",
    input.styleText?.trim() ? `风格描述：${input.styleText.trim()}` : "",
    "",
    "输出要求：主体明确，构图干净，有可继续迭代的设计余量；不要生成水印、错误文字、畸形结构和杂乱背景。",
    "如果是人物 IP，优先保证辨识度、脸型/姿态/服装气质统一；如果是产品 IP，优先保证轮廓、材质、包装和品牌感；如果是内容 IP，优先保证封面识别、系列感和社媒可用性。",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildIpPrototypeTaskDrafts(input: {
  projectName: string;
  outputGoal: IpPrototypeOutputGoal;
}): IpPrototypeTaskDraft[] {
  const goalLabel = outputGoalLabels[input.outputGoal];

  return [
    {
      title: `整理 ${input.projectName} 的 ${goalLabel} 可用点`,
      note: "从生成图里挑出可以保留的主体、色彩、构图和风格关键词。",
      source: "IP_PROTOTYPE",
      quadrant: "SCHEDULE",
      priority: "MEDIUM",
      estimateMinutes: 25,
    },
    {
      title: `继续优化 ${input.projectName} 的下一版提示词`,
      note: "写清楚要保留什么、删掉什么、下一版要往哪个方向长。",
      source: "IP_PROTOTYPE",
      quadrant: "SCHEDULE",
      priority: "MEDIUM",
      estimateMinutes: 20,
    },
    {
      title: `沉淀 ${input.projectName} 的 IP 资产说明`,
      note: "把人设、产品气质或内容栏目定位写进知识库，避免后续生成跑偏。",
      source: "IP_PROTOTYPE",
      quadrant: "SCHEDULE",
      priority: "MEDIUM",
      estimateMinutes: 30,
    },
  ];
}

export async function listIpPrototypeProjects(authorId: string) {
  return prisma.ipPrototypeProject.findMany({
    where: { authorId },
    include: {
      generations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getIpPrototypeProject(authorId: string, id: string) {
  return prisma.ipPrototypeProject.findFirst({
    where: { id, authorId },
    include: {
      generations: {
        orderBy: { createdAt: "desc" },
        take: 24,
      },
    },
  });
}

export async function createIpPrototypeProject(
  authorId: string,
  input: IpPrototypeProjectInput,
) {
  const data = normalizeIpPrototypeProjectInput(input);

  return prisma.ipPrototypeProject.create({
    data: {
      ...data,
      authorId,
    },
  });
}

export async function updateIpPrototypeProject(
  authorId: string,
  id: string,
  input: Partial<IpPrototypeProjectInput>,
) {
  const existing = await prisma.ipPrototypeProject.findFirst({
    where: { id, authorId },
  });

  if (!existing) {
    throw new Error("IP 项目不存在。");
  }

  const data = normalizeIpPrototypeProjectInput({
    name: "name" in input ? input.name : existing.name,
    ipType: "ipType" in input ? input.ipType : existing.ipType,
    description:
      "description" in input ? input.description : existing.description,
    brandTone: "brandTone" in input ? input.brandTone : existing.brandTone,
  });

  return prisma.ipPrototypeProject.update({
    where: { id },
    data,
  });
}

export async function deleteIpPrototypeProject(authorId: string, id: string) {
  const existing = await getIpPrototypeProject(authorId, id);

  if (!existing) {
    throw new Error("IP 项目不存在。");
  }

  await prisma.ipPrototypeProject.delete({ where: { id } });

  for (const generation of existing.generations) {
    await deleteRuntimeIpImage(generation.draftImageUrl);
    await deleteRuntimeIpImage(generation.styleImageUrl);
    await deleteRuntimeAiImage(generation.imageUrl);
  }
}

export async function generateIpPrototype(input: {
  authorId: string;
  projectId: string;
  generationInput: IpPrototypeGenerationInput;
  draftImage?: File | null;
  styleImage?: File | null;
  draftImages?: File[];
  styleImages?: File[];
  finalPrompt?: string | null;
}) {
  const project = await prisma.ipPrototypeProject.findFirst({
    where: { id: input.projectId, authorId: input.authorId },
  });

  if (!project) {
    throw new Error("IP 项目不存在。");
  }

  const normalized = normalizeIpPrototypeGenerationInput(input.generationInput);
  const draftImages = input.draftImages?.length
    ? input.draftImages
    : input.draftImage
      ? [input.draftImage]
      : [];
  const styleImages = input.styleImages?.length
    ? input.styleImages
    : input.styleImage
      ? [input.styleImage]
      : [];
  const references = [...draftImages, ...styleImages].filter(
    (image): image is File => image instanceof File,
  );
  const prompt =
    input.finalPrompt?.trim() ||
    buildIpPrototypePrompt({
      projectName: project.name,
      projectDescription: project.description,
      brandTone: project.brandTone,
      conceptStatement: normalized.conceptStatement,
      targetAudience: normalized.targetAudience,
      personality: normalized.personality,
      visualAnchors: normalized.visualAnchors,
      avoidDirections: normalized.avoidDirections,
      scenario: normalized.scenario,
      ipType: normalized.ipType,
      outputGoal: normalized.outputGoal,
      prompt: normalized.prompt,
      styleText: normalized.styleText,
      hasDraftImage: draftImages.length > 0,
      hasStyleImage: styleImages.length > 0,
    });
  const generated =
    references.length > 0
      ? await editImageWithReferences({
          prompt,
          images: references,
          size: normalizeImageSize(normalized.aspectRatio),
          quality: normalized.quality,
          userId: input.authorId,
        })
      : await generateImageFromText({
          prompt,
          size: normalizeImageSize(normalized.aspectRatio),
          quality: normalized.quality,
          userId: input.authorId,
        });
  const saved = await saveGeneratedImageToRuntime(generated);
  const draftImageUrl = draftImages[0]
    ? await saveIpReferenceImage(draftImages[0], "draft")
    : null;
  const styleImageUrl = styleImages[0]
    ? await saveIpReferenceImage(styleImages[0], "style")
    : null;
  const generation = await prisma.ipPrototypeGeneration.create({
    data: {
      projectId: project.id,
      authorId: input.authorId,
      ipType: normalized.ipType,
      outputGoal: normalized.outputGoal,
      prompt,
      userPrompt: normalized.prompt,
      styleText: normalized.styleText,
      draftImageUrl,
      styleImageUrl,
      imageUrl: saved.imageUrl,
      downloadUrl: saved.downloadUrl,
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      title: `${project.name} - ${outputGoalLabels[normalized.outputGoal]}`,
    },
  });

  await prisma.ipPrototypeProject.update({
    where: { id: project.id },
    data: {
      ipType: normalized.ipType,
      updatedAt: new Date(),
    },
  });

  return {
    generation,
    projectName: project.name,
    imageUrl: saved.imageUrl,
    downloadUrl: saved.downloadUrl,
    fileName: saved.fileName,
    prompt,
    tasks: buildIpPrototypeTaskDrafts({
      projectName: project.name,
      outputGoal: normalized.outputGoal,
    }),
  };
}

export async function updateIpPrototypeGeneration(
  authorId: string,
  id: string,
  input: { title?: unknown; note?: unknown },
) {
  const existing = await prisma.ipPrototypeGeneration.findFirst({
    where: { id, authorId },
  });

  if (!existing) {
    throw new Error("生成记录不存在。");
  }

  return prisma.ipPrototypeGeneration.update({
    where: { id },
    data: {
      title: normalizeRequiredText(input.title, "标题", 80),
      note: normalizeOptionalText(input.note, "备注", 500),
    },
  });
}

export async function deleteIpPrototypeGeneration(authorId: string, id: string) {
  const existing = await prisma.ipPrototypeGeneration.findFirst({
    where: { id, authorId },
  });

  if (!existing) {
    throw new Error("生成记录不存在。");
  }

  await prisma.ipPrototypeGeneration.delete({ where: { id } });
  await deleteRuntimeIpImage(existing.draftImageUrl);
  await deleteRuntimeIpImage(existing.styleImageUrl);
  await deleteRuntimeAiImage(existing.imageUrl);
}

async function saveIpReferenceImage(image: File, prefix: "draft" | "style") {
  const extension = imageExtension(image.type);
  const fileName = `${prefix}-${new Date().toISOString().slice(0, 10)}-${randomUUID()}${extension}`;
  const buffer = Buffer.from(await image.arrayBuffer());

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return `/api/uploads/ip-prototypes/${fileName}`;
}

function imageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return ".png";
}

async function deleteRuntimeIpImage(imageUrl: string | null) {
  if (!imageUrl) return;

  const match = imageUrl.match(
    /^\/api\/uploads\/ip-prototypes\/([^/]+\.(png|jpg|jpeg|webp))$/i,
  );

  if (!match) return;

  await deleteRuntimeFile(path.join(uploadDir, match[1]));
}

async function deleteRuntimeAiImage(imageUrl: string | null) {
  if (!imageUrl) return;

  const match = imageUrl.match(/^\/api\/uploads\/ai-images\/([^/]+\.png)$/i);

  if (!match) return;

  await deleteRuntimeFile(
    path.join(process.cwd(), ".runtime", "uploads", "ai-images", match[1]),
  );
}

async function deleteRuntimeFile(filePath: string) {
  try {
    await unlink(filePath);
  } catch {
    // Database cleanup should not fail if the runtime file has already gone.
  }
}

function normalizeIpType(value: unknown): IpPrototypeType {
  if (value === "person" || value === "product" || value === "content") {
    return value;
  }

  return "person";
}

function normalizeOutputGoal(value: unknown): IpPrototypeOutputGoal {
  if (
    value === "prototype" ||
    value === "refine" ||
    value === "character-sheet" ||
    value === "avatar" ||
    value === "cover" ||
    value === "poster" ||
    value === "series"
  ) {
    return value;
  }

  return "prototype";
}

function normalizeAspectRatio(value: unknown) {
  if (isImageAspectRatioPreset(value)) {
    return value;
  }

  return "3:4";
}

function normalizeRequiredText(value: unknown, label: string, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) throw new Error(`${label}不能为空。`);
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字。`);

  return text;
}

function normalizeOptionalText(value: unknown, label: string, maxLength: number) {
  if (value === null || value === undefined) return null;

  const text = typeof value === "string" ? value.trim() : "";

  if (!text) return null;
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字。`);

  return text;
}

function hasIpConcept(input: {
  conceptStatement?: string | null;
  targetAudience?: string | null;
  personality?: string | null;
  visualAnchors?: string | null;
  avoidDirections?: string | null;
  scenario?: string | null;
}) {
  return Boolean(
    input.conceptStatement?.trim() ||
      input.targetAudience?.trim() ||
      input.personality?.trim() ||
      input.visualAnchors?.trim() ||
      input.avoidDirections?.trim() ||
      input.scenario?.trim(),
  );
}
