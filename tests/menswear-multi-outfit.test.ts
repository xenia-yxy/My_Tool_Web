import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildMenswearMultiOutfitPrompt } from "@/lib/menswear-multi-outfit";

test("flatlay split generation requests one full-bleed outfit image without editorial framing", () => {
  const prompt = buildMenswearMultiOutfitPrompt({
    aspectRatio: "9:16",
    displayMode: "model",
    flatlayImageCount: 1,
    hasLayoutReference: true,
    modelFaceMode: "visible_face",
    modelGender: "male",
    outfitCount: 6,
    outputFormat: "split",
    textMode: "no_text",
    subjectImageCount: 0,
  });

  assert.match(prompt, /单张完整人物穿搭图片/);
  assert.match(prompt, /输出比例：9:16/);
  assert.match(prompt, /禁止.*画框.*留白.*拼贴/);
  assert.doesNotMatch(prompt, /版式要求：横向排列/);
});

test("multi outfit generator exposes platform ratio presets and previews with selected ratio", () => {
  const component = readFileSync("src/components/tools/menswear/multi-outfit-generator.tsx", "utf8");
  const ratios = readFileSync("src/lib/image-aspect-ratios.ts", "utf8");

  assert.match(ratios, /小红书 3:4/);
  assert.match(ratios, /短视频 9:16/);
  assert.match(ratios, /横版 16:9/);
  assert.match(ratios, /商品横图 4:3/);
  assert.match(component, /getImageAspectClass\(aspectRatio\)/);
});
