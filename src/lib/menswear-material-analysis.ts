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

export type MenswearMaterialAnalysis = {
  category: string;
  description: string;
  keywords: string[];
  name: string;
  sellPoints: string[];
  tags: string[];
};

export function buildMenswearMaterialAnalysisPrompt(category: string) {
  return [
    "你是男装选品素材识别助手。请分析上传图片中实际可见的主商品或场景素材。",
    `用户选择的初始分类：${category || "未选择"}。`,
    "不得猜测图片不可见的品牌、Logo、材质成分、尺码、价格、销量或功能。",
    "只返回 JSON，不要 Markdown 或解释。",
    "JSON 格式：{\"name\":\"简短素材名\",\"category\":\"top|inner|bottom|shoes|bag|accessory|outfit|model_face|model_body|pose|background|composition|lighting|mood|other\",\"description\":\"基于可见信息的简短描述\",\"tags\":[\"标签\"],\"sellPoints\":[\"可见卖点\"],\"keywords\":[\"搜索关键词\"]}",
  ].join("\n");
}

export function normalizeMenswearMaterialAnalysis(
  content: string,
  fallbackCategory: string,
): MenswearMaterialAnalysis {
  const source = parseJsonObject(content);
  const category = materialCategories.has(source.category as string)
    ? source.category as string
    : materialCategories.has(fallbackCategory)
      ? fallbackCategory
      : "other";

  return {
    category,
    description: text(source.description, "待人工补充素材描述"),
    keywords: list(source.keywords, 8),
    name: text(source.name, "待命名选品素材"),
    sellPoints: list(source.sellPoints, 6),
    tags: list(source.tags, 10),
  };
}

function parseJsonObject(content: string): Record<string, unknown> {
  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const value = JSON.parse(normalized) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 300)
    : fallback;
}

function list(value: unknown, limit: number) {
  return Array.isArray(value)
    ? Array.from(new Set(value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)))
      .slice(0, limit)
    : [];
}
