import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildMenswearSingleOutfitPrompt } from "../src/lib/menswear-single-outfit";
import { resolveImageWorkbenchToolId } from "../src/lib/image-generation-workflow";
import { getWorkbenchTool } from "../src/server/workbench-sessions";

test("builds a single-look menswear prompt that separates product, reference, face, and person scale", () => {
  const prompt = buildMenswearSingleOutfitPrompt({
    backgroundInstruction: "室内白墙，改为自然窗边光",
    compositionFidelity: "locked",
    cameraDistance: "three_quarter",
    faceMode: "show_face",
    hasCompositionReference: true,
    hasFaceReference: true,
    maskMode: "no_mask",
    productImageCount: 2,
    personScale: "balanced",
    poseInstruction: "自然站立，双手放松",
  });

  assert.match(prompt, /前 2 张为锁定服装单品参考图/);
  assert.match(prompt, /构图参考图为硬约束/);
  assert.match(prompt, /必须复刻构图参考图的人物位置、姿势、镜头角度、人物占比、裁切范围、留白和背景空间关系/);
  assert.match(prompt, /脸部身份参考图/);
  assert.match(prompt, /人物完整露头/);
  assert.match(prompt, /不戴口罩/);
  assert.match(prompt, /主体占画面约 55%-70%/);
  assert.match(prompt, /一张图片只生成一套完整穿搭/);
  assert.match(prompt, /自然站立，双手放松/);
  assert.match(prompt, /室内白墙，改为自然窗边光/);
});

test("single-look prompt supports independent background, composition, and pose reference controls", () => {
  const prompt = buildMenswearSingleOutfitPrompt({
    backgroundMode: "inherit",
    compositionFidelity: "locked",
    hasCompositionReference: true,
    hasFaceReference: false,
    poseMode: "random",
    productImageCount: 1,
  });

  assert.match(prompt, /背景：保持构图参考图中的背景、光线和空间关系不变/);
  assert.match(prompt, /动作：不设定固定动作，生成自然随机动作/);
});

test("registers the single-look menswear workflow across workspace, history, and skills", () => {
  const workspace = readFileSync("src/components/tools/menswear/menswear-workspace.tsx", "utf8");
  const page = readFileSync("src/app/tools/menswear/single-outfit/page.tsx", "utf8");
  const skillCatalog = readFileSync("src/lib/creative-skills.ts", "utf8");
  const generator = readFileSync("src/components/tools/menswear/single-outfit-generator.tsx", "utf8");

  assert.match(workspace, /单品穿搭生图/);
  assert.match(workspace, /\/tools\/menswear\/single-outfit/);
  assert.match(page, /MenswearSingleOutfitGenerator/);
  assert.match(skillCatalog, /menswear-single-outfit/);
  assert.match(generator, /materialCategories=\{\["model_face"\]\}/);
  assert.doesNotMatch(generator, /allowMaterialPicker=\{false\}/);
  assert.equal(getWorkbenchTool("menswear-single-outfit")?.label, "男装单品穿搭生图");
  assert.equal(resolveImageWorkbenchToolId("menswear-single-outfit"), "menswear-single-outfit");
});
