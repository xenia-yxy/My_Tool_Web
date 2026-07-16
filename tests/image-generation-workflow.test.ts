import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAiPromptPreview,
  buildImageGenerationSessionOutput,
  buildIpPromptPreview,
  resolveImageWorkbenchToolId,
  withNoTextImageRule,
} from "../src/lib/image-generation-workflow";

test("buildAiPromptPreview includes multi-reference edit instructions for custom mode", () => {
  const prompt = buildAiPromptPreview({
    mode: "custom",
    description: "把两张参考图融合成商品场景图",
    purpose: "电商图",
    style: "自然清晰",
    hasReferenceImages: true,
  });

  assert.match(prompt, /上传参考图/);
  assert.match(prompt, /两张参考图/);
  assert.match(prompt, /用途：电商图/);
  assert.match(prompt, /风格：自然清晰/);
  assert.match(prompt, /不要出现任何文字/);
});

test("buildAiPromptPreview explains outfit options as a complete editable prompt", () => {
  const prompt = buildAiPromptPreview({
    mode: "outfit",
    description: "保持白衬衫主体",
    category: "衬衫",
    scene: "通勤电梯厅",
    outfitModelMode: "full_body",
    outfitModelGender: "male",
    outfitModelFace: "no_face",
    hasReferenceImages: true,
  });

  assert.match(prompt, /保持主商品/);
  assert.match(prompt, /品类：衬衫/);
  assert.match(prompt, /使用场景：通勤电梯厅/);
  assert.match(prompt, /全身模特/);
  assert.match(prompt, /男模特，不露脸/);
});

test("buildIpPromptPreview mirrors the IP generation flow", () => {
  const prompt = buildIpPromptPreview({
    projectName: "Bingou 日常",
    projectDescription: "租房生活 IP",
    brandTone: "真实、轻松",
    ipType: "person",
    outputGoal: "prototype",
    prompt: "一个普通打工人形象",
    styleText: "白墙走廊真实照片",
    hasDraftImage: true,
    hasStyleImage: true,
  });

  assert.match(prompt, /项目：Bingou 日常/);
  assert.match(prompt, /类型：人物 IP/);
  assert.match(prompt, /输出目标：原型图/);
  assert.match(prompt, /草稿图/);
  assert.match(prompt, /风格图/);
});

test("withNoTextImageRule appends the image-only rule", () => {
  assert.match(withNoTextImageRule("生成商品图"), /只生成画面本身/);
});

test("buildImageGenerationSessionOutput keeps generated image references for restoration", () => {
  assert.deepEqual(
    buildImageGenerationSessionOutput({
      jobId: "job-1",
      imageUrls: ["/api/uploads/ai-images/one.png", "/api/uploads/ai-images/two.png"],
      title: "夏日海报",
    }),
    {
      imageUrl: "/api/uploads/ai-images/one.png",
      imageUrls: ["/api/uploads/ai-images/one.png", "/api/uploads/ai-images/two.png"],
      jobId: "job-1",
      summary: "夏日海报已生成 2 张图片。",
    },
  );
});

test("maps image source tools to persistent workbench history", () => {
  assert.equal(resolveImageWorkbenchToolId("menswear"), "menswear");
  assert.equal(resolveImageWorkbenchToolId("custom"), "ai-image");
  assert.equal(resolveImageWorkbenchToolId("outfit"), "outfit-image");
  assert.equal(resolveImageWorkbenchToolId("ip-factory"), "ip-factory");
  assert.equal(resolveImageWorkbenchToolId("unknown"), "ai-image");
});
