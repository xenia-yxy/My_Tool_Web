import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildMenswearStyleReferencePrompt } from "../src/lib/menswear-style-reference";
import { buildMenswearMultiOutfitPrompt } from "../src/lib/menswear-multi-outfit";
import { resolveImageWorkbenchToolId } from "../src/lib/image-generation-workflow";
import {
  getWorkbenchTool,
  normalizeWorkbenchSessionInput,
} from "../src/server/workbench-sessions";

test("builds a real fashion image prompt that keeps main image details and borrows only reference style", () => {
  const prompt = buildMenswearStyleReferencePrompt({
    aspectRatio: "portrait",
    cameraDistance: "full_body",
    mainImageCount: 3,
    preserveInstructions: "保留衬衫颜色、版型和纽扣",
    styleInstructions: "参考图的柔和日光和城市街拍镜头",
  });

  assert.match(prompt, /前 3 张为服装主图/);
  assert.match(prompt, /保留衬衫颜色、版型和纽扣/);
  assert.match(prompt, /风格参考图只影响光线、镜头、背景氛围和色彩倾向/);
  assert.match(prompt, /真实服装摄影/);
  assert.match(prompt, /不要照搬风格参考图中的服装/);
  assert.match(prompt, /参考图中的人物身份、衣服款式和商品细节都不能替换主图商品/);
  assert.match(prompt, /输出比例：portrait/);
  assert.match(prompt, /全身或接近全身/);
  assert.match(prompt, /保持风格参考图的构图比例、镜头距离、主体占比和留白关系/);
});

test("menswear workspace exposes the style reference generator and gallery labels reference roles", () => {
  const workspace = readFileSync("src/components/tools/menswear/menswear-workspace.tsx", "utf8");
  const gallery = readFileSync("src/components/tools/ai-image-gallery-workbench.tsx", "utf8");

  assert.match(workspace, /风格参考生图/);
  assert.match(workspace, /\/tools\/menswear\/style-reference/);
  assert.match(gallery, /风格参考图/);
  assert.match(gallery, /主 IP 图/);
});

test("style reference workbench tool is registered so generation sessions do not reject it", () => {
  assert.equal(getWorkbenchTool("menswear-style-reference")?.label, "男装风格参考生图");
  assert.equal(resolveImageWorkbenchToolId("menswear-style-reference"), "menswear-style-reference");
  assert.equal(
    normalizeWorkbenchSessionInput({
      toolId: "menswear-style-reference",
      title: "男装风格参考生图",
      prompt: "完整提示词",
      status: "RUNNING",
    }).toolId,
    "menswear-style-reference",
  );
});

test("builds a menswear one-piece multi outfit prompt for model and flatlay layouts", () => {
  const modelPrompt = buildMenswearMultiOutfitPrompt({
    aspectRatio: "landscape",
    cameraDistance: "three_quarter",
    subjectImageCount: 2,
    displayMode: "model",
    outfitCount: 5,
    preserveInstructions: "保留卫衣的紫色、印花、连帽和宽松版型",
    season: "spring_autumn",
    styleInstructions: "干净白底横版合集",
    textMode: "with_labels",
  });
  const flatlayPrompt = buildMenswearMultiOutfitPrompt({
    aspectRatio: "square",
    cameraDistance: "product_grid",
    subjectImageCount: 1,
    displayMode: "flatlay",
    outfitCount: 4,
    preserveInstructions: "",
    season: "winter",
    styleInstructions: "",
    textMode: "no_text",
  });

  assert.match(modelPrompt, /前 2 张为服装主体参考图/);
  assert.match(modelPrompt, /同一件主商品必须出现在每一套搭配里/);
  assert.match(modelPrompt, /上身模特/);
  assert.match(modelPrompt, /5 套/);
  assert.match(modelPrompt, /春秋过渡搭配/);
  assert.match(modelPrompt, /输出比例：landscape/);
  assert.match(modelPrompt, /七分身或膝上到全身之间/);
  assert.match(modelPrompt, /可包含标题和每套搭配名/);
  assert.match(flatlayPrompt, /无模特平铺/);
  assert.match(flatlayPrompt, /冬季保暖搭配/);
  assert.match(flatlayPrompt, /输出比例：square/);
  assert.match(flatlayPrompt, /不要出现文字/);
});

test("menswear workspace exposes one-piece multi outfit generation and registers its history tool", () => {
  const workspace = readFileSync("src/components/tools/menswear/menswear-workspace.tsx", "utf8");
  const page = readFileSync("src/app/tools/menswear/multi-outfit/page.tsx", "utf8");
  const component = readFileSync("src/components/tools/menswear/multi-outfit-generator.tsx", "utf8");

  assert.match(workspace, /一衣多搭生图/);
  assert.match(workspace, /\/tools\/menswear\/multi-outfit/);
  assert.match(page, /MenswearMultiOutfitGenerator/);
  assert.match(component, /menswear-multi-outfit/);
  assert.equal(getWorkbenchTool("menswear-multi-outfit")?.label, "男装一衣多搭生图");
  assert.equal(resolveImageWorkbenchToolId("menswear-multi-outfit"), "menswear-multi-outfit");
});

test("ai image prompt editor opens with the current form prompt instead of a stale session prompt", () => {
  const tool = readFileSync("src/components/tools/ai-image-tool.tsx", "utf8");

  assert.match(tool, /setPromptDraft\(fullPrompt\)/);
  assert.doesNotMatch(tool, /setPromptDraft\(session\?\.prompt\.trim\(\) \|\| fullPrompt\)/);
});

test("commerce navigation uses formal workspace names instead of account-starting labels", () => {
  const nav = readFileSync("src/components/tools/nav-config.ts", "utf8");
  const menswearPage = readFileSync("src/app/tools/menswear/page.tsx", "utf8");

  assert.match(nav, /男装视觉工作台/);
  assert.match(nav, /女装视觉工作台/);
  assert.doesNotMatch(nav, /男装起号|女装起号|服装起号/);
  assert.match(menswearPage, /男装视觉工作台/);
  assert.doesNotMatch(menswearPage, /私人素材|男装起号/);
});
