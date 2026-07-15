import { NoteStatus } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeContentAssetFilter,
  normalizeContentAssetInput,
  normalizeContentAssetQuery,
  resolvePublication,
  type ContentAssetStatus,
} from "@/server/content-assets";
import {
  getAdminContentAssetStats,
  listAdminContentAssets,
  listRecentAdminContentAssets,
} from "@/server/content-queries";

export type AdminContentAssetBody = {
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  content?: unknown;
  status?: unknown;
};

export type AdminContentStatusBody = {
  action?: unknown;
  status?: unknown;
};

export function normalizeAdminContentAssetBody(body: AdminContentAssetBody) {
  const input = normalizeContentAssetInput({
    title: typeof body.title === "string" ? body.title : "",
    slug: typeof body.slug === "string" ? body.slug : "",
    excerpt: typeof body.excerpt === "string" ? body.excerpt : "",
    content: typeof body.content === "string" ? body.content : "",
  });

  return {
    ...input,
    status: body.status === "PUBLISHED" ? "PUBLISHED" : "PRIVATE",
  } satisfies ReturnType<typeof normalizeContentAssetInput> & {
    status: ContentAssetStatus;
  };
}

export function normalizeAdminContentStatusBody(body: AdminContentStatusBody) {
  if (body.action === "publish" || body.status === "PUBLISHED") {
    return "PUBLISHED";
  }

  if (body.action === "withdraw" || body.status === "PRIVATE") {
    return "PRIVATE";
  }

  throw new Error("不支持的发布状态");
}

export async function getAdminDashboardPayload() {
  const [stats, recent] = await Promise.all([
    getAdminContentAssetStats(),
    listRecentAdminContentAssets(5),
  ]);

  return { stats, recent };
}

export async function listAdminContentPayload(url: URL) {
  const status = normalizeContentAssetFilter(url.searchParams.get("status") || undefined);
  const query = normalizeContentAssetQuery(url.searchParams.get("q") || undefined);
  const [assets, stats] = await Promise.all([
    listAdminContentAssets({ status, query }),
    getAdminContentAssetStats(),
  ]);

  return {
    assets,
    stats,
    filter: { status, query: query || "" },
  };
}

export async function getAdminContentPayload(id: string) {
  return prisma.note.findUnique({
    where: { id },
  });
}

export async function createAdminContentPayload(
  body: AdminContentAssetBody,
  authorId: string,
) {
  const input = normalizeAdminContentAssetBody(body);
  const publication = resolvePublication(input.status, null);

  return prisma.note.create({
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      status:
        publication.status === "PUBLISHED"
          ? NoteStatus.PUBLISHED
          : NoteStatus.PRIVATE,
      publishedAt: publication.publishedAt,
      authorId,
    },
  });
}

export async function updateAdminContentPayload(
  id: string,
  body: AdminContentAssetBody,
) {
  const input = normalizeAdminContentAssetBody(body);
  const existing = await prisma.note.findUnique({
    where: { id },
    select: { publishedAt: true },
  });

  if (!existing) {
    return null;
  }

  const publication = resolvePublication(input.status, existing.publishedAt);

  return prisma.note.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      status:
        publication.status === "PUBLISHED"
          ? NoteStatus.PUBLISHED
          : NoteStatus.PRIVATE,
      publishedAt: publication.publishedAt,
    },
  });
}

export async function updateAdminContentStatusPayload(
  id: string,
  body: AdminContentStatusBody,
) {
  const status = normalizeAdminContentStatusBody(body);
  const existing = await prisma.note.findUnique({
    where: { id },
    select: { publishedAt: true },
  });

  if (!existing) {
    return null;
  }

  const publication = resolvePublication(status, existing.publishedAt);

  return prisma.note.update({
    where: { id },
    data: {
      status:
        publication.status === "PUBLISHED"
          ? NoteStatus.PUBLISHED
          : NoteStatus.PRIVATE,
      publishedAt: publication.publishedAt,
    },
  });
}

export async function deleteAdminContentPayload(id: string) {
  try {
    await prisma.note.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function findAdminAuthorId() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", disabledAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!admin) {
    throw new Error("没有可用的管理员作者账号");
  }

  return admin.id;
}

