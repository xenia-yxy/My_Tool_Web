import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSnackGroceryPublishingPack,
  getSnackGroceryPublishingPresets,
} from "../src/lib/snack-grocery-publishing-pack";

test("publishing pack recommends scenes when product image exists but scene image is missing", () => {
  const pack = buildSnackGroceryPublishingPack({
    accountStage: "cold_start",
    publishingGoal: "traffic",
    contentType: "checklist",
    columnTemplate: "office_snack_drawer",
    audience: "办公室打工人",
    category: "办公室零食",
    itemDescription: "小包装无糖茶饮料",
    materialMode: "product_only",
    sceneStrategy: "recommended",
  });

  assert.equal(pack.materialLevel, "B");
  assert.match(pack.materialSummary, /商品图 \+ 无场景图/);
  assert.ok(pack.recommendedScenes.includes("办公室抽屉"));
  assert.ok(pack.recommendedScenes.includes("工位桌面"));
  assert.match(pack.missingMaterialPlan, /系统自动推荐场景/);
  assert.equal(pack.storyboard.length, 6);
  assert.match(pack.storyboard[0].imagePrompt, /保持商品包装/);
  assert.match(pack.storyboard[0].imagePrompt, /不要出现任何中文、英文、数字标题/);
});

test("publishing pack switches to category content without product image", () => {
  const pack = buildSnackGroceryPublishingPack({
    accountStage: "cold_start",
    publishingGoal: "effective_followers",
    contentType: "avoidance",
    columnTemplate: "rental_kitchen_goods",
    audience: "租房党",
    category: "厨房小物",
    itemDescription: "小厨房收纳",
    materialMode: "description_only",
    sceneStrategy: "recommended",
  });

  assert.equal(pack.materialLevel, "C");
  assert.match(pack.materialSummary, /无商品图 \+ 有商品描述/);
  assert.match(pack.storyboard[0].imagePrompt, /不要生成具体品牌/);
  assert.ok(pack.riskNotes.some((note) => note.includes("未实测")));
  assert.ok(pack.reviewFields.includes("是否有人问清单"));
});

test("publishing pack supports custom scene override", () => {
  const pack = buildSnackGroceryPublishingPack({
    accountStage: "low_follower",
    publishingGoal: "test_product",
    contentType: "scenario",
    columnTemplate: "dorm_snack_checklist",
    audience: "宿舍党",
    category: "零食饮料",
    itemDescription: "独立包装饼干和坚果",
    materialMode: "product_only",
    sceneStrategy: "custom",
    customScene: "宿舍床边小桌，晚上台灯暖光，旁边有书和水杯",
  });

  assert.equal(pack.selectedScene, "宿舍床边小桌，晚上台灯暖光，旁边有书和水杯");
  assert.match(pack.storyboard[1].imagePrompt, /宿舍床边小桌/);
});

test("publishing presets expose six first-stage columns", () => {
  const presets = getSnackGroceryPublishingPresets();

  assert.equal(presets.columnTemplates.length, 6);
  assert.ok(presets.columnTemplates.some((item) => item.value === "office_snack_drawer"));
  assert.ok(presets.columnTemplates.some((item) => item.value === "rental_bathroom_cleaning"));
});
