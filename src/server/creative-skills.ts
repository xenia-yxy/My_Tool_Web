import type { Prisma } from "../../generated/prisma/client";
import {
  getSystemCreativeSkills,
  normalizeCreativeSkillDraft,
  type CreativeSkillDraft,
} from "@/lib/creative-skills";
import { prisma } from "@/lib/prisma";

const customOwnerType = "CUSTOM";

export type CreativeSkillCreateInput = {
  ownerType: "CUSTOM";
  config: CreativeSkillDraft;
};

export function normalizeCreativeSkillCreateInput(value: unknown): CreativeSkillCreateInput {
  return {
    ownerType: customOwnerType,
    config: normalizeCreativeSkillDraft(value),
  };
}

export async function listCreativeSkills(authorId: string, includeDisabled = false) {
  const customSkills = await prisma.creativeSkill.findMany({
    where: {
      authorId,
      ownerType: customOwnerType,
      deletedAt: null,
      ...(includeDisabled ? {} : { enabled: true }),
    },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const systemSkills = getSystemCreativeSkills().map((skill) => ({
    id: skill.id,
    authorId: null,
    ownerType: "SYSTEM" as const,
    name: skill.name,
    category: skill.category,
    enabled: true,
    deletedAt: null,
    createdAt: null,
    updatedAt: null,
    versions: [{ id: `${skill.id}:v1`, version: 1, config: skill, createdAt: null }],
  }));

  return [...systemSkills, ...customSkills];
}

export async function getCreativeSkill(authorId: string, skillId: string) {
  const systemSkill = getSystemCreativeSkills().find((skill) => skill.id === skillId);
  if (systemSkill) {
    return {
      id: systemSkill.id,
      authorId: null,
      ownerType: "SYSTEM" as const,
      name: systemSkill.name,
      category: systemSkill.category,
      enabled: true,
      deletedAt: null,
      createdAt: null,
      updatedAt: null,
      versions: [{ id: `${systemSkill.id}:v1`, version: 1, config: systemSkill, createdAt: null }],
    };
  }

  return prisma.creativeSkill.findFirst({
    where: { id: skillId, authorId, ownerType: customOwnerType, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" } } },
  });
}

export async function createCreativeSkill(authorId: string, value: unknown) {
  const input = normalizeCreativeSkillCreateInput(value);

  return prisma.creativeSkill.create({
    data: {
      authorId,
      ownerType: input.ownerType,
      name: input.config.name,
      category: input.config.category,
      versions: {
        create: {
          version: 1,
          config: input.config as Prisma.InputJsonValue,
        },
      },
    },
    include: { versions: true },
  });
}

export async function updateCreativeSkill(authorId: string, skillId: string, value: unknown) {
  const existing = await getCustomSkill(authorId, skillId);
  if (!existing) return null;

  const config = normalizeCreativeSkillDraft(value);
  const nextVersion = (existing.versions[0]?.version ?? 0) + 1;

  return prisma.creativeSkill.update({
    where: { id: skillId },
    data: {
      name: config.name,
      category: config.category,
      versions: {
        create: { version: nextVersion, config: config as Prisma.InputJsonValue },
      },
    },
    include: { versions: { orderBy: { version: "desc" } } },
  });
}

export async function setCreativeSkillEnabled(authorId: string, skillId: string, enabled: boolean) {
  const existing = await getCustomSkill(authorId, skillId);
  if (!existing) return null;

  return prisma.creativeSkill.update({
    where: { id: skillId },
    data: { enabled },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
}

export async function deleteCreativeSkill(authorId: string, skillId: string) {
  const existing = await getCustomSkill(authorId, skillId);
  if (!existing) return null;

  return prisma.creativeSkill.update({
    where: { id: skillId },
    data: { deletedAt: new Date(), enabled: false },
  });
}

async function getCustomSkill(authorId: string, skillId: string) {
  return prisma.creativeSkill.findFirst({
    where: { id: skillId, authorId, ownerType: customOwnerType, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
}
