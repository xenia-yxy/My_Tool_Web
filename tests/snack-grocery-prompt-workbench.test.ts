import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSnackGroceryPromptBatch,
  getSnackGroceryPresets,
} from "../src/lib/snack-grocery-prompt-workbench";

test("buildSnackGroceryPromptBatch generates dorm snack prompt packs", () => {
  const results = buildSnackGroceryPromptBatch({
    batchCount: 3,
    audience: "大学生",
    outputType: "dorm_list",
    category: "零食饮料",
    itemDescription: "宿舍低卡零食组合",
    hasReferenceImages: true,
  });

  assert.equal(results.length, 3);
  assert.match(results[0].imagePrompt, /上传商品参考图/);
  assert.match(results[0].imagePrompt, /宿舍低卡零食组合/);
  assert.match(results[0].imagePrompt, /宿舍囤货清单/);
  assert.match(results[0].postTitle, /宿舍|大学生|囤货/);
  assert.ok(results[0].tags.includes("#宿舍好物"));
  assert.ok(results[0].productKeywords.some((keyword) => keyword.includes("零食")));
  assert.ok(results[0].riskNotes.some((note) => note.includes("保质期")));
});

test("buildSnackGroceryPromptBatch supports rental daily goods", () => {
  const [result] = buildSnackGroceryPromptBatch({
    batchCount: 1,
    audience: "租房党",
    outputType: "rental_goods",
    category: "百货收纳",
    itemDescription: "厨房沥水篮和密封收纳盒",
  });

  assert.match(result.imagePrompt, /租房好物清单/);
  assert.match(result.copyText, /厨房沥水篮和密封收纳盒/);
  assert.ok(result.tags.includes("#租房好物"));
  assert.ok(result.sellingPoints.some((point) => point.includes("省空间")));
});

test("buildSnackGroceryPromptBatch falls back with optional controls omitted", () => {
  const results = buildSnackGroceryPromptBatch({});

  assert.equal(results.length, 6);
  assert.match(results[0].imagePrompt, /基于商品主图或商品描述/);
  assert.match(results[0].copyAll, /生图提示词/);
  assert.match(results[0].copyAll, /风险提醒/);
});

test("getSnackGroceryPresets exposes core audiences and categories", () => {
  const presets = getSnackGroceryPresets();

  assert.ok(presets.audiences.includes("大学生"));
  assert.ok(presets.audiences.includes("职场人"));
  assert.ok(presets.categories.includes("零食饮料"));
  assert.ok(presets.categories.includes("百货收纳"));
});
