import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

const canvasNodeKinds = new Set(["ASSET", "SKILL", "TEXT"]);
const maxSnapshotBytes = 96 * 1024;
const maxNodes = 160;
const maxEdges = 360;

export type CreativeCanvasNodeInput = {
  clientId: string;
  kind: "ASSET" | "SKILL" | "TEXT";
  position: { x: number; y: number };
  snapshot: Record<string, unknown>;
  skillVersionId?: string | null;
};

export type CreativeCanvasEdgeInput = {
  sourceClientId: string;
  targetClientId: string;
  role: string;
};

export type CreativeCanvasPatch = {
  title?: string;
  status?: string;
  viewport?: { x: number; y: number; zoom: number };
  nodes?: CreativeCanvasNodeInput[];
  edges?: CreativeCanvasEdgeInput[];
};

export function normalizeCreativeCanvasPatch(value: unknown): CreativeCanvasPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("画布更新内容格式不正确");
  }

  const source = value as Record<string, unknown>;
  const allowed = new Set(["title", "status", "viewport", "nodes", "edges"]);
  const keys = Object.keys(source);

  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) {
    throw new Error("画布更新字段不正确");
  }

  const nodes = "nodes" in source ? normalizeCanvasNodes(source.nodes) : undefined;
  const edges = "edges" in source ? normalizeCanvasEdges(source.edges, nodes ?? []) : undefined;

  return {
    ...("title" in source ? { title: normalizeOptionalText(source.title, 160) } : {}),
    ...("status" in source ? { status: normalizeStatus(source.status) } : {}),
    ...("viewport" in source ? { viewport: normalizeViewport(source.viewport) } : {}),
    ...(nodes ? { nodes } : {}),
    ...(edges ? { edges } : {}),
  };
}

export async function createCreativeCanvas(authorId: string, title = "未命名创作") {
  return prisma.creativeCanvasSession.create({
    data: {
      authorId,
      title: normalizeOptionalText(title, 160) || "未命名创作",
      viewport: emptyViewport() as Prisma.InputJsonValue,
    },
    include: canvasInclude,
  });
}

export async function listCreativeCanvases(authorId: string) {
  return prisma.creativeCanvasSession.findMany({
    where: { authorId },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      _count: { select: { nodes: true, runs: true } },
    },
  });
}

export async function getCreativeCanvas(authorId: string, sessionId: string) {
  return prisma.creativeCanvasSession.findFirst({
    where: { id: sessionId, authorId },
    include: canvasInclude,
  });
}

export async function patchCreativeCanvas(authorId: string, sessionId: string, value: unknown) {
  const patch = normalizeCreativeCanvasPatch(value);
  const existing = await prisma.creativeCanvasSession.findFirst({
    where: { id: sessionId, authorId },
    select: { id: true },
  });

  if (!existing) return null;

  if ((patch.nodes && !patch.edges) || (!patch.nodes && patch.edges)) {
    throw new Error("保存画布结构时必须同时提交卡片和连线");
  }

  return prisma.$transaction(async (transaction) => {
    if (patch.nodes && patch.edges) {
      await transaction.creativeCanvasEdge.deleteMany({ where: { sessionId } });
      await transaction.creativeCanvasNode.deleteMany({ where: { sessionId } });
      await transaction.creativeCanvasNode.createMany({
        data: patch.nodes.map((node) => ({
          sessionId,
          clientId: node.clientId,
          kind: node.kind,
          position: node.position as Prisma.InputJsonValue,
          snapshot: node.snapshot as Prisma.InputJsonValue,
          skillVersionId: node.skillVersionId ?? null,
        })),
      });
      await transaction.creativeCanvasEdge.createMany({
        data: patch.edges.map((edge) => ({
          sessionId,
          sourceNodeId: edge.sourceClientId,
          targetNodeId: edge.targetClientId,
          role: edge.role,
        })),
      });
    }

    return transaction.creativeCanvasSession.update({
      where: { id: sessionId },
      data: {
        ...(patch.title ? { title: patch.title } : {}),
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.viewport ? { viewport: patch.viewport as Prisma.InputJsonValue } : {}),
      },
      include: canvasInclude,
    });
  });
}

export async function duplicateCreativeCanvas(authorId: string, sessionId: string) {
  const source = await getCreativeCanvas(authorId, sessionId);
  if (!source) return null;

  return prisma.creativeCanvasSession.create({
    data: {
      authorId,
      title: `${source.title} 副本`,
      status: "DRAFT",
      viewport: source.viewport as Prisma.InputJsonValue,
      nodes: {
        create: source.nodes.map((node) => ({
          clientId: node.clientId,
          kind: node.kind,
          position: node.position as Prisma.InputJsonValue,
          snapshot: node.snapshot as Prisma.InputJsonValue,
          skillVersionId: node.skillVersionId,
        })),
      },
      edges: {
        create: source.edges.map((edge) => ({
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          role: edge.role,
        })),
      },
    },
    include: canvasInclude,
  });
}

function normalizeCanvasNodes(value: unknown): CreativeCanvasNodeInput[] {
  if (!Array.isArray(value) || value.length > maxNodes) {
    throw new Error("画布卡片数量不正确");
  }

  const clientIds = new Set<string>();

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("画布卡片格式不正确");
    }

    const source = item as Record<string, unknown>;
    const clientId = normalizeRequiredText(source.clientId, "画布卡片标识", 120);
    if (clientIds.has(clientId)) throw new Error("画布卡片标识重复");
    clientIds.add(clientId);

    if (typeof source.kind !== "string" || !canvasNodeKinds.has(source.kind)) {
      throw new Error("画布卡片类型不正确");
    }

    return {
      clientId,
      kind: source.kind as CreativeCanvasNodeInput["kind"],
      position: normalizePosition(source.position),
      snapshot: normalizeSnapshot(source.snapshot),
      ...(typeof source.skillVersionId === "string" && source.skillVersionId.trim()
        ? { skillVersionId: source.skillVersionId.trim().slice(0, 160) }
        : {}),
    };
  });
}

function normalizeCanvasEdges(value: unknown, nodes: CreativeCanvasNodeInput[]): CreativeCanvasEdgeInput[] {
  if (!Array.isArray(value) || value.length > maxEdges) {
    throw new Error("画布连线数量不正确");
  }

  const clientIds = new Set(nodes.map((node) => node.clientId));
  const edgeKeys = new Set<string>();

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("画布连线格式不正确");
    }

    const source = item as Record<string, unknown>;
    const sourceClientId = normalizeRequiredText(source.sourceClientId, "连线来源", 120);
    const targetClientId = normalizeRequiredText(source.targetClientId, "连线目标", 120);
    const role = normalizeRequiredText(source.role, "素材角色", 80);
    const key = `${sourceClientId}:${targetClientId}:${role}`;

    if (!clientIds.has(sourceClientId) || !clientIds.has(targetClientId) || sourceClientId === targetClientId || edgeKeys.has(key)) {
      throw new Error("画布连线引用不正确");
    }

    edgeKeys.add(key);
    return { sourceClientId, targetClientId, role };
  });
}

function normalizeViewport(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("画布视口格式不正确");
  }

  const source = value as Record<string, unknown>;
  const x = normalizeFiniteNumber(source.x, "画布横向位置");
  const y = normalizeFiniteNumber(source.y, "画布纵向位置");
  const zoom = normalizeFiniteNumber(source.zoom, "画布缩放比例");
  if (zoom < 0.4 || zoom > 1.6) throw new Error("画布缩放比例不正确");
  return { x, y, zoom };
}

function normalizePosition(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("画布坐标格式不正确");
  }

  const source = value as Record<string, unknown>;
  return {
    x: normalizeFiniteNumber(source.x, "画布横坐标"),
    y: normalizeFiniteNumber(source.y, "画布纵坐标"),
  };
}

function normalizeSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("画布卡片内容格式不正确");
  }

  const serialized = JSON.stringify(value);
  if (serialized.length > maxSnapshotBytes) throw new Error("画布卡片内容过大");
  return JSON.parse(serialized) as Record<string, unknown>;
}

function normalizeStatus(value: unknown) {
  const status = normalizeRequiredText(value, "画布状态", 40).toUpperCase();
  if (!["DRAFT", "PLANNING", "RUNNING", "SUCCEEDED", "FAILED"].includes(status)) {
    throw new Error("画布状态不正确");
  }
  return status;
}

function normalizeFiniteNumber(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label}不正确`);
  return value;
}

function normalizeRequiredText(value: unknown, label: string, maxLength: number) {
  const text = normalizeOptionalText(value, maxLength);
  if (!text) throw new Error(`${label}不能为空`);
  return text;
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function emptyViewport() {
  return { x: 0, y: 0, zoom: 1 };
}

const canvasInclude = {
  nodes: { orderBy: { createdAt: "asc" } },
  edges: { orderBy: { createdAt: "asc" } },
  runs: { orderBy: { createdAt: "desc" }, take: 100 },
} as const;
