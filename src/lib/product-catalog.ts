export function normalizeProductCategoryInput(input: {
  name?: unknown;
  sortOrder?: unknown;
}) {
  return {
    name: requiredText(input.name, "分类名称不能为空"),
    sortOrder: nonNegativeInt(input.sortOrder),
  };
}

export function normalizeProductInput(input: {
  aiAnalysis?: unknown;
  aiAnalyzed?: unknown;
  categoryId?: unknown;
  description?: unknown;
  imageUrls?: unknown;
  keywords?: unknown;
  name?: unknown;
  primaryImageUrl?: unknown;
  scenes?: unknown;
  sellPoints?: unknown;
  tags?: unknown;
}) {
  const imageUrls = uniqueStrings(input.imageUrls, 12);
  if (!imageUrls.length) throw new Error("至少上传一张商品图片");
  const requestedPrimary = optionalText(input.primaryImageUrl);

  return {
    aiAnalysis: normalizeAnalysis(input.aiAnalysis),
    aiAnalyzed: input.aiAnalyzed === true,
    categoryId: optionalText(input.categoryId),
    description: optionalText(input.description),
    imageUrls,
    keywords: uniqueStrings(input.keywords, 20),
    name: requiredText(input.name, "商品名称不能为空"),
    primaryImageUrl: requestedPrimary && imageUrls.includes(requestedPrimary)
      ? requestedPrimary
      : imageUrls[0],
    scenes: uniqueStrings(input.scenes, 12),
    sellPoints: uniqueStrings(input.sellPoints, 12),
    tags: uniqueStrings(input.tags, 20),
  };
}

function normalizeAnalysis(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function requiredText(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
  return value.trim();
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function uniqueStrings(value: unknown, limit: number) {
  return Array.isArray(value)
    ? Array.from(new Set(value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)))
      .slice(0, limit)
    : [];
}

function nonNegativeInt(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}
