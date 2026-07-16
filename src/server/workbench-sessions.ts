import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getWorkbenchTool,
  type WorkbenchSessionStatus,
} from "@/lib/workbench-sessions";

export { getWorkbenchTool } from "@/lib/workbench-sessions";

const allowedStatuses = new Set<WorkbenchSessionStatus>([
  "DRAFT",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);
const maxSnapshotBytes = 96 * 1024;

export type WorkbenchSessionInput = {
  toolId: string;
  title?: unknown;
  status?: unknown;
  prompt?: unknown;
  inputSnapshot?: unknown;
  outputSnapshot?: unknown;
  imageAssetIds?: unknown;
  externalJobId?: unknown;
  errorMessage?: unknown;
};

export type WorkbenchSessionPatch = Omit<WorkbenchSessionInput, "toolId">;

export function normalizeWorkbenchSessionInput(input: WorkbenchSessionInput) {
  const toolId = typeof input.toolId === "string" ? input.toolId.trim() : "";
  const tool = getWorkbenchTool(toolId);

  if (!tool) {
    throw new Error("工具类型不正确");
  }

  const status = normalizeStatus(input.status);
  const prompt = normalizeText(input.prompt, 30_000);
  const title = normalizeText(input.title, 160) || tool.label;

  return {
    toolId,
    title,
    prompt,
    status,
    inputSnapshot: normalizeSnapshot(input.inputSnapshot),
    outputSnapshot: normalizeSnapshot(input.outputSnapshot),
    imageAssetIds: normalizeStringList(input.imageAssetIds, 30),
    externalJobId: normalizeOptionalText(input.externalJobId, 160),
    errorMessage: normalizeOptionalText(input.errorMessage, 4_000),
  };
}

export async function createWorkbenchSession(authorId: string, input: WorkbenchSessionInput) {
  const data = normalizeWorkbenchSessionInput(input);

  return prisma.workbenchSession.create({
    data: {
      ...data,
      authorId,
      inputSnapshot: data.inputSnapshot as Prisma.InputJsonValue,
      outputSnapshot: data.outputSnapshot as Prisma.InputJsonValue,
      completedAt: isCompleteStatus(data.status) ? new Date() : null,
    },
  });
}

export async function listWorkbenchSessions(authorId: string, toolId: string) {
  if (!getWorkbenchTool(toolId)) {
    throw new Error("工具类型不正确");
  }

  return prisma.workbenchSession.findMany({
    where: { authorId, toolId },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });
}

export async function getWorkbenchSession(authorId: string, id: string) {
  return prisma.workbenchSession.findFirst({ where: { id, authorId } });
}

export async function updateWorkbenchSession(
  authorId: string,
  id: string,
  input: WorkbenchSessionPatch,
) {
  const existing = await getWorkbenchSession(authorId, id);

  if (!existing) {
    return null;
  }

  const data = normalizeWorkbenchSessionInput({
    toolId: existing.toolId,
    title: input.title ?? existing.title,
    status: input.status ?? existing.status,
    prompt: input.prompt ?? existing.prompt,
    inputSnapshot: input.inputSnapshot ?? existing.inputSnapshot,
    outputSnapshot: input.outputSnapshot ?? existing.outputSnapshot,
    imageAssetIds: input.imageAssetIds ?? existing.imageAssetIds,
    externalJobId: input.externalJobId ?? existing.externalJobId,
    errorMessage: input.errorMessage ?? existing.errorMessage,
  });

  return prisma.workbenchSession.update({
    where: { id },
    data: {
      ...data,
      inputSnapshot: data.inputSnapshot as Prisma.InputJsonValue,
      outputSnapshot: data.outputSnapshot as Prisma.InputJsonValue,
      completedAt: isCompleteStatus(data.status) ? new Date() : null,
    },
  });
}

export function normalizeWorkbenchSessionPatch(value: unknown): WorkbenchSessionPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("会话更新内容格式不正确");
  }

  const source = value as Record<string, unknown>;
  const allowedKeys = new Set([
    "title",
    "status",
    "prompt",
    "inputSnapshot",
    "outputSnapshot",
    "imageAssetIds",
    "externalJobId",
    "errorMessage",
  ]);

  for (const key of Object.keys(source)) {
    if (!allowedKeys.has(key)) {
      throw new Error("会话更新字段不正确");
    }
  }

  if (Object.keys(source).length === 0) {
    throw new Error("会话更新内容不能为空");
  }

  return source;
}

function normalizeStatus(value: unknown): WorkbenchSessionStatus {
  if (typeof value === "undefined" || value === null) {
    return "DRAFT";
  }

  if (typeof value !== "string" || !allowedStatuses.has(value as WorkbenchSessionStatus)) {
    throw new Error("会话状态不正确");
  }

  return value as WorkbenchSessionStatus;
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  return normalizeText(value, maxLength) || null;
}

function normalizeSnapshot(value: unknown) {
  const snapshot = value ?? {};

  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    throw new Error("会话内容格式不正确");
  }

  const serialized = JSON.stringify(snapshot);

  if (serialized.length > maxSnapshotBytes) {
    throw new Error("会话内容过大");
  }

  return JSON.parse(serialized) as Record<string, unknown>;
}

function normalizeStringList(value: unknown, limit: number) {
  const values = Array.isArray(value) ? value : [];

  return Array.from(
    new Set(
      values
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

function isCompleteStatus(status: WorkbenchSessionStatus) {
  return status === "SUCCEEDED" || status === "FAILED";
}
