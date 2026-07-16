import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFashionImageRequests,
  buildSnackGroceryImageRequests,
  getFashionPresets,
} from "../src/lib/commerce-image-workflow";

test("fashion presets keep one-piece multi outfit display for men and women", () => {
  assert.ok(getFashionPresets("menswear").outputTypes.includes("一衣多搭展示"));
  assert.ok(getFashionPresets("womenswear").outputTypes.includes("一衣多搭展示"));
});

test("one-piece multi outfit prompt generates image-only landscape visuals", () => {
  const [request] = buildFashionImageRequests({
    mode: "menswear",
    itemDescription: "白色短袖T恤",
    outputType: "一衣多搭展示",
    batchCount: 1,
    hasReferenceImages: true,
  });

  assert.equal(request.aspectRatio, "landscape");
  assert.match(request.prompt, /5 套不同搭配/);
  assert.match(request.prompt, /不要生成标题/);
  assert.match(request.prompt, /不要生成.*搭配公式/);
  assert.match(request.prompt, /任何图中文字/);
});

test("fashion prompt asks model to analyze current product instead of using fixed templates", () => {
  const [request] = buildFashionImageRequests({
    mode: "womenswear",
    itemDescription: "绿色针织短开衫，短款，细腻纹理",
    outputType: "真实穿搭图",
    batchCount: 1,
    hasReferenceImages: true,
  });

  assert.match(request.prompt, /先分析上传服装参考图/);
  assert.match(request.prompt, /颜色、版型、材质/);
  assert.match(request.prompt, /绿色针织短开衫/);
  assert.match(request.prompt, /不要套用固定穿搭模板/);
});

test("fashion batch supports small custom counts and varies each request", () => {
  const requests = buildFashionImageRequests({
    mode: "menswear",
    itemDescription: "浅蓝色短袖衬衫，宽松版型",
    outputType: "真实穿搭图",
    batchCount: 2,
    hasReferenceImages: true,
  });

  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].prompt, requests[1].prompt);
  assert.match(requests[0].prompt, /浅蓝色短袖衬衫/);
  assert.match(requests[1].prompt, /浅蓝色短袖衬衫/);
});

test("snack grocery prompt asks model to analyze current product and scene", () => {
  const [request] = buildSnackGroceryImageRequests({
    itemDescription: "小包装无糖茶饮料，适合办公室冰箱",
    outputType: "真实场景图",
    batchCount: 1,
    hasReferenceImages: true,
  });

  assert.match(request.prompt, /先分析上传商品参考图/);
  assert.match(request.prompt, /包装外观、颜色、规格感/);
  assert.match(request.prompt, /小包装无糖茶饮料/);
  assert.match(request.prompt, /不要套用固定宿舍清单/);
});

test("snack grocery batch supports small custom counts and varies each request", () => {
  const requests = buildSnackGroceryImageRequests({
    itemDescription: "小包装无糖茶饮料，适合办公室冰箱",
    outputType: "真实场景图",
    batchCount: 3,
    hasReferenceImages: true,
  });

  assert.equal(requests.length, 3);
  assert.notEqual(requests[0].prompt, requests[1].prompt);
  assert.notEqual(requests[1].prompt, requests[2].prompt);
  assert.match(requests[0].prompt, /小包装无糖茶饮料/);
  assert.match(requests[2].prompt, /小包装无糖茶饮料/);
});
