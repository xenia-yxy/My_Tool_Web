import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildOutfitPromptBatch,
  getStylePresetsForGender,
} from "../src/lib/outfit-prompt-workbench";

test("buildOutfitPromptBatch generates requested men outfit prompt packs", () => {
  const results = buildOutfitPromptBatch({
    batchCount: 3,
    gender: "men",
    outputType: "one_piece",
    stylePreset: "干净男友风",
    itemDescription: "浅蓝色短袖衬衫",
    hasReferenceImages: true,
  });

  assert.equal(results.length, 3);
  assert.match(results[0].imagePrompt, /上传服装参考图/);
  assert.match(results[0].imagePrompt, /浅蓝色短袖衬衫/);
  assert.match(results[0].imagePrompt, /一衣多搭展示图/);
  assert.match(results[0].imagePrompt, /5套搭配/);
  assert.match(results[0].postTitle, /男友风|男生|夏季/);
  assert.ok(results[0].tags.includes("#男生穿搭"));
  assert.ok(results[0].productKeywords.some((keyword) => keyword.includes("短袖")));
});

test("buildOutfitPromptBatch supports women real outfit prompt packs", () => {
  const [result] = buildOutfitPromptBatch({
    batchCount: 1,
    gender: "women",
    outputType: "real_outfit",
    stylePreset: "气质通勤",
    itemDescription: "白色短袖衬衫",
  });

  assert.match(result.imagePrompt, /中国年轻女性/);
  assert.match(result.imagePrompt, /真实生活照片风格/);
  assert.match(result.negativePrompt, /品牌logo/);
  assert.ok(result.tags.includes("#女生穿搭"));
  assert.ok(result.copyText.includes("白色短袖衬衫"));
});

test("buildOutfitPromptBatch falls back when optional controls are omitted", () => {
  const results = buildOutfitPromptBatch({});

  assert.equal(results.length, 6);
  assert.match(results[0].imagePrompt, /基于服装主商品/);
  assert.notEqual(results[0].copyAll.length, 0);
  assert.match(results[0].copyAll, /生图提示词/);
  assert.match(results[0].copyAll, /选品关键词/);
});

test("getStylePresetsForGender exposes men and women presets", () => {
  assert.ok(getStylePresetsForGender("men").includes("170显高"));
  assert.ok(getStylePresetsForGender("women").includes("小个子显高"));
  assert.ok(getStylePresetsForGender("unisex").includes("夏季日常"));
});
