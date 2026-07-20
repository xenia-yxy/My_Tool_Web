import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildProductAnalysisPrompt,
  normalizeProductAnalysis,
} from "../src/lib/product-analysis";

test("product analysis prompt requires visible facts and editable e-commerce fields", () => {
  const prompt = buildProductAnalysisPrompt("夏季服装", "优先识别商品版型与可见细节");

  assert.match(prompt, /实际可见/);
  assert.match(prompt, /不得猜测/);
  assert.match(prompt, /targetAudience/);
  assert.match(prompt, /riskNotes/);
});

test("normalizes AI product analysis without preserving unsupported claims", () => {
  const analysis = normalizeProductAnalysis(JSON.stringify({
    name: "浅蓝色短袖衬衫",
    description: "浅蓝色宽松短袖衬衫，正面可见翻领和前襟。",
    tags: ["男装", "短袖", "男装"],
    sellPoints: ["浅蓝色", "宽松版型"],
    scenes: ["通勤", "校园"],
    keywords: ["浅蓝短袖衬衫", "男士夏季衬衫"],
    targetAudience: ["偏好宽松通勤穿搭的人群"],
    visibleAttributes: ["翻领", "前襟"],
    riskNotes: ["品牌、面料成分和尺码需人工补充"],
  }));

  assert.equal(analysis.name, "浅蓝色短袖衬衫");
  assert.deepEqual(analysis.tags, ["男装", "短袖"]);
  assert.deepEqual(analysis.visibleAttributes, ["翻领", "前襟"]);
  assert.deepEqual(analysis.riskNotes, ["品牌、面料成分和尺码需人工补充"]);
});

test("product analysis returns safe editable fallbacks when model content is invalid", () => {
  assert.deepEqual(normalizeProductAnalysis("not-json"), {
    description: "待人工补充商品描述",
    keywords: [],
    name: "待命名商品",
    riskNotes: ["请人工核对品牌、材质成分、规格和价格等不可见信息"],
    scenes: [],
    sellPoints: [],
    tags: [],
    targetAudience: [],
    visibleAttributes: [],
  });
});
