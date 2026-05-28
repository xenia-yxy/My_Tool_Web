"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NoteStatus } from "../../generated/prisma/client";
import {
  normalizeContentAssetInput,
  resolvePublication,
  type ContentAssetStatus,
} from "@/server/content-assets";
import { requireAdminUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";

function readContentAssetForm(formData: FormData) {
  return normalizeContentAssetInput({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
  });
}

function readIntentStatus(formData: FormData): ContentAssetStatus {
  return formData.get("intent") === "publish" ? "PUBLISHED" : "PRIVATE";
}

function revalidateContentPaths(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/knowledge");

  if (slug) {
    revalidatePath(`/knowledge/${slug}`);
  }
}

export async function createContentAsset(formData: FormData) {
  const admin = await requireAdminUser();
  const input = readContentAssetForm(formData);
  const publication = resolvePublication(readIntentStatus(formData), null);

  const note = await prisma.note.create({
    data: {
      ...input,
      status:
        publication.status === "PUBLISHED"
          ? NoteStatus.PUBLISHED
          : NoteStatus.PRIVATE,
      publishedAt: publication.publishedAt,
      authorId: admin.id,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  revalidateContentPaths(note.slug);
  redirect(`/admin/content/${note.id}`);
}

export async function updateContentAsset(id: string, formData: FormData) {
  await requireAdminUser();
  const input = readContentAssetForm(formData);
  const existing = await prisma.note.findUniqueOrThrow({
    where: { id },
    select: { publishedAt: true, slug: true },
  });
  const publication = resolvePublication(
    readIntentStatus(formData),
    existing.publishedAt,
  );

  const note = await prisma.note.update({
    where: { id },
    data: {
      ...input,
      status:
        publication.status === "PUBLISHED"
          ? NoteStatus.PUBLISHED
          : NoteStatus.PRIVATE,
      publishedAt: publication.publishedAt,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  revalidateContentPaths(existing.slug);
  revalidateContentPaths(note.slug);
  redirect(`/admin/content/${note.id}`);
}

export async function publishContentAsset(id: string) {
  await requireAdminUser();
  const existing = await prisma.note.findUniqueOrThrow({
    where: { id },
    select: { publishedAt: true, slug: true },
  });
  const publication = resolvePublication("PUBLISHED", existing.publishedAt);

  await prisma.note.update({
    where: { id },
    data: {
      status: NoteStatus.PUBLISHED,
      publishedAt: publication.publishedAt,
    },
  });

  revalidateContentPaths(existing.slug);
}

export async function withdrawContentAsset(id: string) {
  await requireAdminUser();
  const existing = await prisma.note.findUniqueOrThrow({
    where: { id },
    select: { slug: true },
  });

  await prisma.note.update({
    where: { id },
    data: {
      status: NoteStatus.PRIVATE,
      publishedAt: null,
    },
  });

  revalidateContentPaths(existing.slug);
}

export async function deleteContentAsset(id: string) {
  await requireAdminUser();
  const existing = await prisma.note.delete({
    where: { id },
    select: { slug: true },
  });

  revalidateContentPaths(existing.slug);
}
