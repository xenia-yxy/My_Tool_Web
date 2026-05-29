import { notFound } from "next/navigation";
import { NoteStatus } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeContentAssetFilter,
  normalizeContentAssetQuery,
  summarizeContentAssetStats,
  type ContentAssetFilter,
} from "@/server/content-assets";

export type { ContentAssetFilter };

export type ContentAssetListInput = {
  status?: ContentAssetFilter;
  query?: string;
};

export async function listAdminContentAssets(input: ContentAssetListInput = {}) {
  const status = normalizeContentAssetFilter(input.status);
  const query = normalizeContentAssetQuery(input.query);

  return prisma.note.findMany({
    where: {
      ...(status === "ALL" ? {} : { status }),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function getAdminContentAssetStats() {
  const assets = await prisma.note.findMany({
    select: {
      status: true,
    },
  });

  return summarizeContentAssetStats(assets);
}

export async function listRecentAdminContentAssets(limit = 5) {
  return prisma.note.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function getAdminContentAsset(id: string) {
  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) {
    notFound();
  }

  return note;
}

export async function listPublishedContentAssets() {
  return prisma.note.findMany({
    where: {
      status: NoteStatus.PUBLISHED,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

export async function getPublishedContentAssetBySlug(slug: string) {
  const note = await prisma.note.findFirst({
    where: {
      slug,
      status: NoteStatus.PUBLISHED,
    },
  });

  if (!note) {
    notFound();
  }

  return note;
}
