import type { Prisma } from "../../generated/prisma/client";
import { normalizeProductCategoryInput, normalizeProductInput } from "@/lib/product-catalog";
import { prisma } from "@/lib/prisma";

export async function listProductCategories(authorId: string) {
  return prisma.productCategory.findMany({ where: { authorId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function createProductCategory(authorId: string, input: Parameters<typeof normalizeProductCategoryInput>[0]) {
  return prisma.productCategory.create({ data: { authorId, ...normalizeProductCategoryInput(input) } });
}

export async function updateProductCategory(authorId: string, id: string, input: Parameters<typeof normalizeProductCategoryInput>[0]) {
  const existing = await prisma.productCategory.findFirst({ where: { authorId, id } });
  return existing ? prisma.productCategory.update({ where: { id }, data: normalizeProductCategoryInput(input) }) : null;
}

export async function deleteProductCategory(authorId: string, id: string) {
  const existing = await prisma.productCategory.findFirst({ where: { authorId, id }, include: { _count: { select: { products: true } } } });
  if (!existing) return null;
  if (existing._count.products > 0) throw new Error("分类下仍有选品，请先迁移或删除选品");
  return prisma.productCategory.delete({ where: { id } });
}

export async function listProducts(authorId: string, input: { categoryId?: string | null; query?: string | null }) {
  const query = input.query?.trim();
  return prisma.product.findMany({
    where: { authorId, ...(input.categoryId ? { categoryId: input.categoryId } : {}), ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { tags: { has: query } }, { keywords: { has: query } }] } : {}) },
    include: { category: true, images: { orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" }, take: 120,
  });
}

export async function getProduct(authorId: string, id: string) {
  return prisma.product.findFirst({ where: { authorId, id }, include: { category: true, images: { orderBy: { position: "asc" } } } });
}

export async function createProduct(authorId: string, input: Parameters<typeof normalizeProductInput>[0]) {
  const data = normalizeProductInput(input);
  await assertCategory(authorId, data.categoryId);
  return prisma.product.create({ data: { authorId, categoryId: data.categoryId, name: data.name, description: data.description, tags: data.tags, sellPoints: data.sellPoints, scenes: data.scenes, keywords: data.keywords, images: { create: data.imageUrls.map((imageUrl, position) => ({ imageUrl, position, isPrimary: imageUrl === data.primaryImageUrl })) } }, include: { category: true, images: { orderBy: { position: "asc" } } } });
}

export async function updateProduct(authorId: string, id: string, input: Parameters<typeof normalizeProductInput>[0]) {
  const existing = await getProduct(authorId, id);
  if (!existing) return null;
  const data = normalizeProductInput(input);
  await assertCategory(authorId, data.categoryId);
  return prisma.product.update({ where: { id }, data: { categoryId: data.categoryId, name: data.name, description: data.description, tags: data.tags, sellPoints: data.sellPoints, scenes: data.scenes, keywords: data.keywords, images: { deleteMany: {}, create: data.imageUrls.map((imageUrl, position) => ({ imageUrl, position, isPrimary: imageUrl === data.primaryImageUrl })) } }, include: { category: true, images: { orderBy: { position: "asc" } } } });
}

export async function deleteProduct(authorId: string, id: string) {
  const existing = await getProduct(authorId, id);
  return existing ? prisma.product.delete({ where: { id } }) : null;
}

async function assertCategory(authorId: string, categoryId: string | null) {
  if (!categoryId) return;
  const category = await prisma.productCategory.findFirst({ where: { authorId, id: categoryId }, select: { id: true } });
  if (!category) throw new Error("只能选择自己的选品分类");
}

export function toProductAnalysis(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
