import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMenswearMultiOutfitPrompt } from "@/lib/menswear-multi-outfit";

test("flatlay split generation requests one full-bleed outfit image without editorial framing", () => {
  const prompt = buildMenswearMultiOutfitPrompt({
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
  assert.match(prompt, /禁止.*画框.*留白.*拼贴/);
  assert.doesNotMatch(prompt, /版式要求：横向排列/);
});
