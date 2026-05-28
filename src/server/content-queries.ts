import { notFound } from "next/navigation";
import { NoteStatus } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ContentAssetFilter = "ALL" | "PRIVATE" | "PUBLISHED";

export async function listAdminContentAssets(filter: ContentAssetFilter = "ALL") {
  return prisma.note.findMany({
    where:
      filter === "ALL"
        ? undefined
        : {
            status: filter,
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
