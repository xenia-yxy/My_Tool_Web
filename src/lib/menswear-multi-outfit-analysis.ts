export type MenswearMultiOutfitAnalysis = {
  outfitCount: number;
  summary: string;
};

export function normalizeMenswearMultiOutfitAnalysis(content: string): MenswearMultiOutfitAnalysis {
  const parsed = parseJson(content);
  const count = normalizeOutfitCount(parsed?.outfitCount);
  const summary = typeof parsed?.summary === "string" && parsed.summary.trim()
    ? parsed.summary.trim().slice(0, 240)
    : `已识别 ${count} 套按从左到右、从上到下排列的平铺搭配。`;

  return { outfitCount: count, summary };
}

export function buildMenswearMultiOutfitAnalysisPrompt() {
  return [
    "你是服装搭配图片识别助手。",
    "识别平铺一衣多搭图片中可独立输出的人体穿搭组合数量。",
    "按从左到右、从上到下统计，不把同一套的鞋、裤子、配饰拆成多套。",
    "只依据图片可见内容，不猜测被遮挡的服装。",
    '只返回 JSON：{"outfitCount": 3, "summary": "识别到 3 套搭配，按从左到右顺序。"}。',
    "outfitCount 必须是 1 到 8 的整数。",
  ].join("\n");
}

function parseJson(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  const candidate = trimmed.match(/\{[\s\S]*\}/)?.[0] || trimmed;
  try {
    const parsed = JSON.parse(candidate) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function normalizeOutfitCount(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 8) return numberValue;
  return 3;
}
