import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAiImagePrompt,
  getAizhzoImageConfig,
  normalizeGeneratedImageResponse,
  normalizeImageBatchCount,
  normalizeImageSize,
  normalizeOutfitModelOptions,
} from "../src/server/ai-image-tools";

test("normalizeImageSize maps tool aspect ratios to image API sizes", () => {
  assert.equal(normalizeImageSize("square"), "1024x1024");
  assert.equal(normalizeImageSize("portrait"), "1024x1536");
  assert.equal(normalizeImageSize("landscape"), "1536x1024");
  assert.equal(normalizeImageSize("unexpected"), "1024x1024");
});

test("normalizeImageBatchCount clamps batch generation size", () => {
  assert.equal(normalizeImageBatchCount(undefined), 1);
  assert.equal(normalizeImageBatchCount("3"), 3);
  assert.equal(normalizeImageBatchCount(30), 30);
  assert.equal(normalizeImageBatchCount(31), 30);
  assert.equal(normalizeImageBatchCount(0), 1);
  assert.equal(normalizeImageBatchCount("bad"), 1);
});

test("buildAiImagePrompt creates a freeform prompt with user intent and style", () => {
  const prompt = buildAiImagePrompt({
    mode: "custom",
    description: "  做一张红色跑车海报  ",
    purpose: "小红书封面",
    style: "商业摄影",
    extraInstructions: "不要出现文字",
  });

  assert.match(prompt, /红色跑车海报/);
  assert.match(prompt, /用途：小红书封面/);
  assert.match(prompt, /风格：商业摄影/);
  assert.match(prompt, /不要出现文字/);
});

test("buildAiImagePrompt creates an outfit prompt with model display settings", () => {
  const prompt = buildAiImagePrompt({
    mode: "outfit",
    description: "保持这件白衬衫为主体",
    category: "衬衫",
    scene: "电商详情页",
    outfitModelMode: "full_body",
    outfitModelGender: "female",
    outfitModelFace: "no_face",
  });

  assert.match(prompt, /一衣多搭/);
  assert.match(prompt, /品类：衬衫/);
  assert.match(prompt, /使用场景：电商详情页/);
  assert.match(prompt, /全身女模特/);
  assert.match(prompt, /不露脸/);
});

test("normalizeOutfitModelOptions falls back to flatlay-safe defaults", () => {
  assert.deepEqual(normalizeOutfitModelOptions({}), {
    outfitModelMode: "flatlay",
    outfitModelGender: "unspecified",
    outfitModelFace: "no_face",
  });

  assert.deepEqual(
    normalizeOutfitModelOptions({
      outfitModelMode: "half_body",
      outfitModelGender: "male",
      outfitModelFace: "show_face",
    }),
    {
      outfitModelMode: "half_body",
      outfitModelGender: "male",
      outfitModelFace: "show_face",
    },
  );
});

test("normalizeGeneratedImageResponse accepts b64_json and url responses", () => {
  assert.deepEqual(
    normalizeGeneratedImageResponse({
      data: [{ b64_json: "abc123", revised_prompt: "final prompt" }],
    }),
    {
      imageUrl: "data:image/png;base64,abc123",
      downloadUrl: "data:image/png;base64,abc123",
      fileName: "ai-image.png",
      revisedPrompt: "final prompt",
      mimeType: "image/png",
    },
  );

  assert.deepEqual(
    normalizeGeneratedImageResponse({
      data: [{ url: "https://example.com/image.png" }],
    }),
    {
      imageUrl: "https://example.com/image.png",
      downloadUrl: "https://example.com/image.png",
      fileName: "ai-image.png",
      revisedPrompt: undefined,
      mimeType: "image/png",
    },
  );
});

test("getAizhzoImageConfig reads image endpoint settings from env", () => {
  const config = getAizhzoImageConfig({
    AIZHZO_API_KEY: "secret",
    AIZHZO_BASE_URL: "https://api.aizhzo.com/",
    AIZHZO_IMAGE_MODEL: "gpt-image-2",
    AIZHZO_IMAGE_GENERATION_PATH: "/v1/images/generations",
    AIZHZO_IMAGE_EDIT_PATH: "/v1/images/edits",
  });

  assert.deepEqual(config, {
    apiKey: "secret",
    baseUrl: "https://api.aizhzo.com",
    model: "gpt-image-2",
    generationUrl: "https://api.aizhzo.com/v1/images/generations",
    editUrl: "https://api.aizhzo.com/v1/images/edits",
  });
});
