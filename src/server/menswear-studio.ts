import type { Prisma } from "../../generated/prisma/client";
import {
  menswearReferencePolicies,
  menswearReferenceRoles,
  isMenswearProductRole,
  type MenswearReferencePolicy,
  type MenswearReferenceRole,
} from "@/lib/menswear-studio";
import { prisma } from "@/lib/prisma";

const materialCategories = new Set([
  "top",
  "inner",
  "bottom",
  "shoes",
  "bag",
  "accessory",
  "outfit",
  "model_face",
  "model_body",
  "pose",
  "background",
  "composition",
  "lighting",
  "mood",
  "other",
]);

const materialSourceTypes = new Set([
  "UPLOAD",
  "EXTRACT",
  "TRANSFORM",
  "GENERATED",
]);

export function normalizeMenswearMaterialInput(input: {
  analysis?: unknown;
  category?: unknown;
  imageUrl?: unknown;
  maskUrl?: unknown;
  name?: unknown;
  previewUrl?: unknown;
  promptNotes?: unknown;
  rightsStatus?: unknown;
  sourceType?: unknown;
  sourceUrl?: unknown;
  tags?: unknown;
}) {
  const category = normalizeMaterialCategory(input.category);
  const imageUrl = normalizeRequiredText(input.imageUrl, "图片地址不能为空");

  return {
    analysis: normalizeObject(input.analysis),
    category,
    imageUrl,
    maskUrl: normalizeOptionalText(input.maskUrl),
    name: normalizeRequiredText(input.name, "素材名称不能为空"),
    previewUrl: normalizeOptionalText(input.previewUrl),
    promptNotes: normalizeOptionalText(input.promptNotes),
    rightsStatus: "PUBLIC",
    sourceType: materialSourceTypes.has(input.sourceType as string)
      ? (input.sourceType as string)
      : "UPLOAD",
    sourceUrl: normalizeOptionalText(input.sourceUrl),
    tags: normalizeStringList(input.tags),
  };
}

export function buildOwnedMenswearMaterialWhere(authorId: string, id: string) {
  return { authorId, id };
}

export function normalizeMenswearModelProfileInput(input: {
  bodyLockStrength?: unknown;
  consentConfirmed?: unknown;
  faceLockStrength?: unknown;
  hairLockStrength?: unknown;
  name?: unknown;
  profile?: unknown;
  status?: unknown;
}) {
  const consentConfirmed = input.consentConfirmed === true;

  return {
    bodyLockStrength: clampStrength(input.bodyLockStrength, 85),
    consentConfirmed,
    faceLockStrength: clampStrength(input.faceLockStrength, 90),
    hairLockStrength: clampStrength(input.hairLockStrength, 80),
    name: normalizeRequiredText(input.name, "模特名称不能为空"),
    profile: normalizeObject(input.profile),
    status: consentConfirmed && input.status !== "DRAFT" ? "READY" : consentConfirmed ? "READY" : "DRAFT",
  };
}

export function normalizeMenswearModelProfileImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const positions = new Map<string, number>();
  const seen = new Set<string>();

  return value.flatMap((item) => {
    const source = item && typeof item === "object"
      ? (item as Record<string, unknown>)
      : {};
    const materialId = normalizeOptionalText(source.materialId);
    const role = source.role === "body" || source.role === "hair"
      ? source.role
      : source.role === "face"
        ? source.role
        : null;

    if (!materialId || !role || seen.has(`${role}:${materialId}`)) {
      return [];
    }

    seen.add(`${role}:${materialId}`);
    const position = positions.get(role) ?? 0;
    positions.set(role, position + 1);

    return [{ materialId, position, role }];
  });
}

export function normalizeMenswearProjectReference(input: {
  allowedChanges?: unknown;
  fidelity?: unknown;
  materialId?: unknown;
  policy?: unknown;
  position?: unknown;
  role?: unknown;
}) {
  if (!menswearReferenceRoles.includes(input.role as MenswearReferenceRole)) {
    throw new Error("参考素材角色不正确");
  }
  if (!menswearReferencePolicies.includes(input.policy as MenswearReferencePolicy)) {
    throw new Error("参考素材控制方式不正确");
  }

  const role = input.role as MenswearReferenceRole;
  const isProduct = isMenswearProductRole(role);

  return {
    allowedChanges: normalizeStringList(input.allowedChanges),
    fidelity: isProduct ? 100 : clampStrength(input.fidelity, 0),
    materialId: normalizeRequiredText(input.materialId, "参考素材不能为空"),
    policy: isProduct ? "LOCKED" : input.policy as MenswearReferencePolicy,
    position: normalizePosition(input.position),
    role,
  };
}

export function normalizeMenswearProjectInput(input: {
  description?: unknown;
  modelProfileId?: unknown;
  name?: unknown;
  references?: unknown;
  settings?: unknown;
  status?: unknown;
}) {
  return {
    description: normalizeOptionalText(input.description),
    modelProfileId: normalizeOptionalText(input.modelProfileId),
    name: normalizeRequiredText(input.name, "项目名称不能为空"),
    references: Array.isArray(input.references)
      ? input.references.map((reference) =>
          normalizeMenswearProjectReference(
            reference && typeof reference === "object"
              ? (reference as Record<string, unknown>)
              : {},
          ),
        )
      : [],
    settings: normalizeObject(input.settings),
    status: input.status === "READY" ? "READY" : "DRAFT",
  };
}

export async function listMenswearMaterials(input: {
  authorId: string;
  category?: string | null;
  query?: string | null;
}) {
  const category = materialCategories.has(input.category ?? "")
    ? input.category
    : undefined;
  const query = input.query?.trim();

  const materials = await prisma.menswearMaterial.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { tags: { has: query } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 120,
  });

  return materials
    .map((material) => ({
      ...material,
      category: resolveMaterialCategory(material),
    }))
    .filter((material) => !category || material.category === category);
}

export function resolveMaterialCategory(input: {
  category?: unknown;
  name?: unknown;
  tags?: unknown;
}) {
  const category = typeof input.category === "string" ? input.category : "other";
  if (category !== "other") return category;

  const tags = Array.isArray(input.tags)
    ? input.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const haystack = `${typeof input.name === "string" ? input.name : ""} ${tags.join(" ")}`.toLowerCase();

  if (/(脸部|人脸|面部|肖像|头像)/.test(haystack)) return "model_face";
  if (/(全身|身体|身材|体型)/.test(haystack)) return "model_body";
  if (/(姿势|动作|站姿|坐姿)/.test(haystack)) return "pose";
  if (/(背景|场景|街景|室内)/.test(haystack)) return "background";
  if (/(构图|镜头|机位)/.test(haystack)) return "composition";
  if (/(光线|灯光|光影)/.test(haystack)) return "lighting";
  if (/(氛围|风格|色调)/.test(haystack)) return "mood";
  if (/(鞋|靴)/.test(haystack)) return "shoes";
  if (/(包|背包|手提)/.test(haystack)) return "bag";
  if (/(裤|牛仔)/.test(haystack)) return "bottom";
  if (/(内搭|背心|打底)/.test(haystack)) return "inner";
  if (/(上衣|衬衫|t恤|短袖|外套|夹克|毛衣|卫衣)/i.test(haystack)) return "top";
  if (/(整套|穿搭|套装)/.test(haystack)) return "outfit";
  if (/(帽|眼镜|饰品|配饰)/.test(haystack)) return "accessory";

  return "other";
}

export async function createMenswearMaterial(authorId: string, input: Parameters<typeof normalizeMenswearMaterialInput>[0]) {
  const data = normalizeMenswearMaterialInput(input);

  return prisma.menswearMaterial.create({
    data: {
      ...data,
      analysis: toJson(data.analysis),
      authorId,
    },
  });
}

export async function getMenswearMaterial(authorId: string, id: string) {
  return prisma.menswearMaterial.findFirst({
    where: buildOwnedMenswearMaterialWhere(authorId, id),
  });
}

export async function updateMenswearMaterial(
  authorId: string,
  id: string,
  input: Parameters<typeof normalizeMenswearMaterialInput>[0],
) {
  const existing = await getMenswearMaterial(authorId, id);
  if (!existing) return null;

  const data = normalizeMenswearMaterialInput(input);
  return prisma.menswearMaterial.update({
    where: { id },
    data: {
      ...data,
      analysis: toJson(data.analysis),
    },
  });
}

export async function deleteMenswearMaterial(authorId: string, id: string) {
  const existing = await getMenswearMaterial(authorId, id);
  if (!existing) return null;

  return prisma.menswearMaterial.delete({ where: { id } });
}

export async function listMenswearModelProfiles(authorId: string) {
  return prisma.menswearModelProfile.findMany({
    where: { authorId },
    include: {
      images: {
        include: { material: true },
        orderBy: [{ role: "asc" }, { position: "asc" }],
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function createMenswearModelProfile(
  authorId: string,
  input: Parameters<typeof normalizeMenswearModelProfileInput>[0] & {
    images?: unknown;
  },
) {
  const data = normalizeMenswearModelProfileInput(input);
  const images = normalizeMenswearModelProfileImages(input.images);
  await assertReadableMaterials(images.map((image) => image.materialId));

  return prisma.menswearModelProfile.create({
    data: {
      authorId,
      bodyLockStrength: data.bodyLockStrength,
      consentConfirmedAt: data.consentConfirmed ? new Date() : null,
      faceLockStrength: data.faceLockStrength,
      hairLockStrength: data.hairLockStrength,
      name: data.name,
      profile: toJson(data.profile),
      status: data.status,
      images: { create: images },
    },
    include: { images: true },
  });
}

export async function getMenswearModelProfile(authorId: string, id: string) {
  return prisma.menswearModelProfile.findFirst({
    where: { authorId, id },
    include: {
      images: {
        include: { material: true },
        orderBy: [{ role: "asc" }, { position: "asc" }],
      },
    },
  });
}

export async function updateMenswearModelProfile(
  authorId: string,
  id: string,
  input: Parameters<typeof normalizeMenswearModelProfileInput>[0] & {
    images?: unknown;
  },
) {
  const existing = await getMenswearModelProfile(authorId, id);
  if (!existing) return null;

  const data = normalizeMenswearModelProfileInput(input);
  const images = normalizeMenswearModelProfileImages(input.images);
  await assertReadableMaterials(images.map((image) => image.materialId));

  return prisma.$transaction(async (transaction) => {
    await transaction.menswearModelProfileImage.deleteMany({
      where: { profileId: id },
    });

    return transaction.menswearModelProfile.update({
      where: { id },
      data: {
        bodyLockStrength: data.bodyLockStrength,
        consentConfirmedAt: data.consentConfirmed ? new Date() : null,
        faceLockStrength: data.faceLockStrength,
        hairLockStrength: data.hairLockStrength,
        name: data.name,
        profile: toJson(data.profile),
        status: data.status,
        images: { create: images },
      },
      include: { images: true },
    });
  });
}

export async function deleteMenswearModelProfile(authorId: string, id: string) {
  const existing = await getMenswearModelProfile(authorId, id);
  if (!existing) return null;

  return prisma.menswearModelProfile.delete({ where: { id } });
}

export async function attachMenswearModelProfileImage(input: {
  authorId: string;
  materialId: string;
  profileId: string;
  role: "body" | "face" | "hair";
}) {
  const profile = await getMenswearModelProfile(input.authorId, input.profileId);
  if (!profile) return null;

  await assertReadableMaterials([input.materialId]);
  const alreadyAttached = profile.images.some(
    (image) => image.materialId === input.materialId && image.role === input.role,
  );

  if (!alreadyAttached) {
    const position = profile.images.filter((image) => image.role === input.role).length;
    await prisma.menswearModelProfileImage.create({
      data: {
        materialId: input.materialId,
        position,
        profileId: input.profileId,
        role: input.role,
      },
    });
  }

  return getMenswearModelProfile(input.authorId, input.profileId);
}

export async function listMenswearProjects(authorId: string) {
  return prisma.menswearProject.findMany({
    where: { authorId },
    include: {
      modelProfile: { select: { id: true, name: true, status: true } },
      _count: { select: { references: true, prompts: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 80,
  });
}

export async function createMenswearProject(
  authorId: string,
  input: Parameters<typeof normalizeMenswearProjectInput>[0],
) {
  const data = normalizeMenswearProjectInput(input);
  await assertProjectOwnership(authorId, data.modelProfileId, data.references.map((reference) => reference.materialId));

  return prisma.menswearProject.create({
    data: {
      authorId,
      description: data.description,
      modelProfileId: data.modelProfileId,
      name: data.name,
      settings: toJson(data.settings),
      status: data.status,
      references: { create: data.references },
    },
    include: {
      modelProfile: { select: { id: true, name: true, status: true } },
      references: { include: { material: true }, orderBy: { position: "asc" } },
    },
  });
}

export async function getMenswearProject(authorId: string, id: string) {
  return prisma.menswearProject.findFirst({
    where: { authorId, id },
    include: {
      modelProfile: {
        include: {
          images: { include: { material: true }, orderBy: [{ role: "asc" }, { position: "asc" }] },
        },
      },
      references: { include: { material: true }, orderBy: { position: "asc" } },
      prompts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function updateMenswearProject(
  authorId: string,
  id: string,
  input: Parameters<typeof normalizeMenswearProjectInput>[0],
) {
  const existing = await getMenswearProject(authorId, id);
  if (!existing) return null;

  const data = normalizeMenswearProjectInput(input);
  await assertProjectOwnership(authorId, data.modelProfileId, data.references.map((reference) => reference.materialId));

  return prisma.menswearProject.update({
    where: { id },
    data: {
      description: data.description,
      modelProfileId: data.modelProfileId,
      name: data.name,
      settings: toJson(data.settings),
      status: data.status,
      references: {
        deleteMany: {},
        create: data.references,
      },
    },
    include: {
      modelProfile: { select: { id: true, name: true, status: true } },
      references: { include: { material: true }, orderBy: { position: "asc" } },
    },
  });
}

function normalizeMaterialCategory(value: unknown) {
  if (!materialCategories.has(value as string)) {
    throw new Error("素材分类不正确");
  }

  return value as string;
}

function normalizeRequiredText(value: unknown, errorMessage: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(errorMessage);
  }

  return value.trim();
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      )
    : [];
}

function normalizeObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function clampStrength(value: unknown, fallback: number) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
  return Math.min(Math.max(normalized, 0), 100);
}

function normalizePosition(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(Math.floor(parsed), 0) : 0;
}

async function assertReadableMaterials(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return;

  const count = await prisma.menswearMaterial.count({
    where: { id: { in: uniqueIds } },
  });

  if (count !== uniqueIds.length) {
    throw new Error("引用的公开素材不存在或已被删除");
  }
}

async function assertProjectOwnership(
  authorId: string,
  modelProfileId: string | null,
  materialIds: string[],
) {
  await assertReadableMaterials(materialIds);

  if (!modelProfileId) return;
  const profile = await prisma.menswearModelProfile.findFirst({
    where: { authorId, id: modelProfileId },
    select: { id: true },
  });

  if (!profile) {
    throw new Error("只能选择自己的模特档案");
  }
}

function toJson(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
