export type ProductAnalysis = {
  description: string;
  keywords: string[];
  name: string;
  riskNotes: string[];
  scenes: string[];
  sellPoints: string[];
  tags: string[];
  targetAudience: string[];
  visibleAttributes: string[];
};

export function buildProductAnalysisPrompt(categoryHint: string, notes: string) {
  return [
    "你是电商选品分析助手。请根据上传商品图片中实际可见的信息，生成可编辑的商品档案。",
    `用户分类提示：${categoryHint || "未填写"}。`,
    `用户补充说明：${notes || "未填写"}。`,
    "不得猜测图片不可见的品牌、材质成分、规格、尺码、价格、销量、认证、功能或原产地。",
    "描述、卖点和属性必须基于实际可见内容；不确定的信息必须写入 riskNotes，提醒人工核对。",
    "只返回 JSON，不要 Markdown 或解释。",
    "JSON 格式：{\"name\":\"商品名称\",\"description\":\"可见商品描述\",\"tags\":[\"标签\"],\"sellPoints\":[\"可见卖点\"],\"scenes\":[\"适用场景\"],\"keywords\":[\"搜索关键词\"],\"targetAudience\":[\"适用人群\"],\"visibleAttributes\":[\"可见属性\"],\"riskNotes\":[\"人工核对项\"]}",
  ].join("\n");
}

export function normalizeProductAnalysis(content: string): ProductAnalysis {
  const source = parseJsonObject(content);

  return {
    description: text(source.description, "待人工补充商品描述"),
    keywords: list(source.keywords, 16),
    name: text(source.name, "待命名商品"),
    riskNotes: list(source.riskNotes, 8).length
      ? list(source.riskNotes, 8)
      : ["请人工核对品牌、材质成分、规格和价格等不可见信息"],
    scenes: list(source.scenes, 12),
    sellPoints: list(source.sellPoints, 12),
    tags: list(source.tags, 16),
    targetAudience: list(source.targetAudience, 10),
    visibleAttributes: list(source.visibleAttributes, 16),
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
    ? value.trim().slice(0, 500)
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
