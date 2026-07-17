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
    modelFaceMode: "hidden_face",
    modelGender: "female",
    outfitCount: 5,
    preserveInstructions: "保留卫衣的紫色、印花、连帽和宽松版型",
    season: "spring_autumn",
    styleInstructions: "干净白底横版合集",
    targetAudience: "小红书年轻女性用户",
    textMode: "with_labels",
    usageScene: "社媒种草封面",
  });
  const flatlayPrompt = buildMenswearMultiOutfitPrompt({
    aspectRatio: "square",
    cameraDistance: "product_grid",
    subjectImageCount: 1,
    displayMode: "flatlay",
    modelFaceMode: "no_model",
    modelGender: "none",
    outfitCount: 4,
    preserveInstructions: "",
    season: "winter",
    styleInstructions: "",
    textMode: "no_text",
  });

  assert.match(modelPrompt, /前 2 张为服装主体参考图/);
  assert.match(modelPrompt, /同一件主商品必须出现在每一套搭配里/);
  assert.match(modelPrompt, /上身模特/);
  assert.match(modelPrompt, /女模特/);
  assert.match(modelPrompt, /不露脸|无头/);
  assert.match(modelPrompt, /目标客群：小红书年轻女性用户/);
  assert.match(modelPrompt, /使用场景：社媒种草封面/);
  assert.match(modelPrompt, /5 套/);
  assert.match(modelPrompt, /春秋过渡搭配/);
  assert.match(modelPrompt, /输出比例：landscape/);
  assert.match(modelPrompt, /七分身或膝上到全身之间/);
  assert.match(modelPrompt, /可包含标题和每套搭配名/);
  assert.match(flatlayPrompt, /无模特平铺/);
  assert.match(flatlayPrompt, /不出现真人模特/);
  assert.match(flatlayPrompt, /冬季保暖搭配/);
  assert.match(flatlayPrompt, /输出比例：square/);
  assert.match(flatlayPrompt, /不要出现文字/);
});

test("womenswear exposes the same image workflows with dedicated female defaults", () => {
  const workspace = readFileSync("src/components/tools/womenswear/womenswear-workspace.tsx", "utf8");
  const singleOutfitPage = readFileSync("src/app/tools/womenswear/single-outfit/page.tsx", "utf8");
  const multiOutfitPage = readFileSync("src/app/tools/womenswear/multi-outfit/page.tsx", "utf8");
  const singleOutfit = readFileSync("src/components/tools/menswear/single-outfit-generator.tsx", "utf8");
  const multiOutfit = readFileSync("src/components/tools/menswear/multi-outfit-generator.tsx", "utf8");

  assert.match(workspace, /女装严格保真生图/);
  assert.match(workspace, /女装一衣多搭合集/);
  assert.match(workspace, /女装平铺多搭拆分生图/);
  assert.match(singleOutfitPage, /gender="women"/);
  assert.match(multiOutfitPage, /gender="women"/);
  assert.match(singleOutfit, /gender\?: "men" \| "women"/);
  assert.match(multiOutfit, /gender\?: "men" \| "women"/);
});

test("multi-outfit split mode locks each output to its matching flatlay look", () => {
  const prompt = buildMenswearMultiOutfitPrompt({
    subjectImageCount: 1,
    displayMode: "model",
    modelGender: "male",
    modelFaceMode: "visible_face",
    outfitCount: 6,
    textMode: "no_text",
    hasLayoutReference: true,
    hasStyleReference: true,
    outputFormat: "split",
  });
  const component = readFileSync("src/components/tools/menswear/multi-outfit-generator.tsx", "utf8");
  const imageQueue = readFileSync("src/server/ai-image-queue.ts", "utf8");

  assert.match(prompt, /最后一张为平铺多搭参考图/);
  assert.match(prompt, /不复制其主商品、文字、品牌或人物/);
  assert.match(prompt, /必须生成 6 张独立人物穿搭图/);
  assert.match(prompt, /第 N 张只呈现参考图第 N 套搭配/);
  assert.match(component, /splitOutfitMode/);
  assert.match(imageQueue, /平铺多搭拆分序号/);
});

test("multi-outfit prompt offers independent background and pose controls for split images", () => {
  const prompt = buildMenswearMultiOutfitPrompt({
    subjectImageCount: 1,
    displayMode: "model",
    modelGender: "male",
    modelFaceMode: "hidden_face",
    outfitCount: 3,
    textMode: "no_text",
    hasLayoutReference: true,
    hasStyleReference: true,
    outputFormat: "split",
    backgroundMode: "inherit",
    compositionMode: "custom",
    poseMode: "random",
    maskMode: "wear_mask",
  });

  assert.match(prompt, /构图：平铺参考图只锁定每套组合顺序/);
  assert.match(prompt, /背景：保持参考图的背景空间、光线和环境关系/);
  assert.match(prompt, /动作：不设定固定动作，按真实穿搭展示生成自然随机动作/);
  assert.match(prompt, /口罩：佩戴干净简洁的口罩/);
});

test("menswear workspace exposes one-piece multi outfit generation and registers its history tool", () => {
  const workspace = readFileSync("src/components/tools/menswear/menswear-workspace.tsx", "utf8");
  const page = readFileSync("src/app/tools/menswear/multi-outfit/page.tsx", "utf8");
  const component = readFileSync("src/components/tools/menswear/multi-outfit-generator.tsx", "utf8");

  assert.match(workspace, /一衣多搭合集/);
  assert.match(workspace, /\/tools\/menswear\/multi-outfit/);
  assert.match(page, /MenswearMultiOutfitGenerator/);
  assert.match(component, /menswear-multi-outfit/);
  assert.match(component, /模特性别/);
  assert.match(component, /脸部/);
  assert.match(component, /目标客群/);
  assert.match(component, /使用场景/);
  assert.equal(getWorkbenchTool("menswear-multi-outfit")?.label, "男装一衣多搭生图");
  assert.equal(resolveImageWorkbenchToolId("menswear-multi-outfit"), "menswear-multi-outfit");
});

test("menswear separates outfit-board generation from flatlay split generation", () => {
  const workspace = readFileSync("src/components/tools/menswear/menswear-workspace.tsx", "utf8");
  const page = readFileSync("src/app/tools/menswear/flatlay-outfit-split/page.tsx", "utf8");
  const generator = readFileSync("src/components/tools/menswear/multi-outfit-generator.tsx", "utf8");
  const sessions = readFileSync("src/lib/workbench-sessions.ts", "utf8");
  const workflow = readFileSync("src/lib/image-generation-workflow.ts", "utf8");

  assert.match(workspace, /一衣多搭合集/);
  assert.match(workspace, /平铺多搭拆分生图/);
  assert.match(workspace, /\/tools\/menswear\/flatlay-outfit-split/);
  assert.match(page, /variant="split"/);
  assert.match(generator, /variant\?: "board" \| "split"/);
  assert.match(sessions, /menswear-flatlay-outfit-split/);
  assert.match(workflow, /menswear-flatlay-outfit-split/);
});

test("flatlay split generation uses one flatlay source and an optional visual reference instead of duplicate product uploads", () => {
  const generator = readFileSync("src/components/tools/menswear/multi-outfit-generator.tsx", "utf8");
  const prompt = buildMenswearMultiOutfitPrompt({
    subjectImageCount: 0,
    flatlayImageCount: 1,
    hasLayoutReference: true,
    hasStyleReference: true,
    outputFormat: "split",
    displayMode: "model",
    outfitCount: 4,
    textMode: "no_text",
  });

  assert.match(generator, /平铺多搭图/);
  assert.match(generator, /人物穿搭参考图/);
  assert.match(generator, /!isSplit \? <ImageReferenceUploader/);
  assert.match(prompt, /第 1 张为平铺多搭图/);
  assert.match(prompt, /人物穿搭参考图只控制构图、背景、动作、镜头和视觉风格/);
});

test("ai image prompt editor opens with the current form prompt instead of a stale session prompt", () => {
  const tool = readFileSync("src/components/tools/ai-image-tool.tsx", "utf8");

  assert.match(tool, /setPromptDraft\(fullPrompt\)/);
  assert.doesNotMatch(tool, /setPromptDraft\(session\?\.prompt\.trim\(\) \|\| fullPrompt\)/);
});

test("all prompt-confirmed image tools expose optional person scale and body proportion controls", () => {
  const dialog = readFileSync("src/components/tools/prompt-editor-dialog.tsx", "utf8");
  const confirmDialog = readFileSync("src/components/tools/prompt-preview-panel.tsx", "utf8");
  const imageTool = readFileSync("src/components/tools/ai-image-tool.tsx", "utf8");
  const scene = readFileSync("src/components/tools/menswear/scene-image-generator.tsx", "utf8");

  assert.match(dialog, /人物大小/);
  assert.match(dialog, /身材比例/);
  assert.match(dialog, /修长男模/);
  assert.match(dialog, /人物画面控制/);
  assert.match(confirmDialog, /人物画面控制/);
  assert.match(confirmDialog, /人物突出（70%-80%）/);
  assert.match(confirmDialog, /街头宽松/);
  assert.match(imageTool, /PromptEditorDialog/);
  assert.match(scene, /PromptEditorDialog/);
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
