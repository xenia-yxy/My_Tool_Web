import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("menswear workspace exposes isolated generator, material, and model routes", () => {
  const rootPage = readFileSync("src/app/tools/menswear/page.tsx", "utf8");
  const generatorPage = readFileSync(
    "src/app/tools/menswear/generate/page.tsx",
    "utf8",
  );
  const materialsPage = readFileSync(
    "src/app/tools/menswear/materials/page.tsx",
    "utf8",
  );
  const modelsPage = readFileSync(
    "src/app/tools/menswear/models/page.tsx",
    "utf8",
  );

  assert.match(rootPage, /MenswearWorkspace/);
  assert.match(generatorPage, /StrictFidelityGenerator/);
  assert.match(generatorPage, /严格保真生图/);
  assert.match(materialsPage, /MaterialLibrary/);
  assert.match(modelsPage, /ModelProfileManager/);
});

test("gallery detail renders menswear provenance only for menswear-studio assets", () => {
  const gallery = readFileSync(
    "src/components/tools/ai-image-gallery-workbench.tsx",
    "utf8",
  );

  assert.match(gallery, /sourceTool === "menswear-studio"/);
  assert.match(gallery, /sourceTool === "menswear-scene-image"/);
  assert.match(gallery, /锁定商品参考/);
  assert.match(gallery, /场景图参考/);
});

test("strict fidelity generator restores and updates the linked menswear project", () => {
  const generator = readFileSync(
    "src/components/tools/menswear/strict-fidelity-generator.tsx",
    "utf8",
  );

  assert.match(generator, /useSearchParams/);
  assert.match(generator, /\/api\/tools\/menswear\/projects\/\$\{projectId\}/);
  assert.match(generator, /setReferences/);
  assert.match(generator, /linkedProjectId \? "PATCH" : "POST"/);
  assert.doesNotMatch(generator, /<img /);
});

test("strict fidelity slots support both public materials and local image uploads", () => {
  const generator = readFileSync(
    "src/components/tools/menswear/strict-fidelity-generator.tsx",
    "utf8",
  );
  const referenceSlot = readFileSync(
    "src/components/tools/menswear/reference-slot.tsx",
    "utf8",
  );

  assert.match(referenceSlot, /MaterialPickerDialog/);
  assert.match(referenceSlot, /Upload/);
  assert.match(referenceSlot, /\/api\/tools\/menswear\/materials\/upload/);
  assert.match(referenceSlot, /onMaterialCreated/);
  assert.match(generator, /onMaterialCreated/);
  assert.match(generator, /role: "inner"/);
  assert.match(generator, /role: "accessory"/);
  assert.match(generator, /role: "outfit"/);
});

test("menswear pages require a signed-in member before showing private workflows", () => {
  const pages = [
    "src/app/tools/menswear/page.tsx",
    "src/app/tools/menswear/generate/page.tsx",
    "src/app/tools/menswear/materials/page.tsx",
    "src/app/tools/menswear/models/page.tsx",
  ];

  for (const page of pages) {
    const source = readFileSync(page, "utf8");
    assert.match(source, /requireSignedInUser/);
  }
});

test("menswear references use previewable upload boxes and a visual public material picker", () => {
  const generator = readFileSync(
    "src/components/tools/menswear/strict-fidelity-generator.tsx",
    "utf8",
  );
  const referenceSlot = readFileSync(
    "src/components/tools/menswear/reference-slot.tsx",
    "utf8",
  );
  const materials = readFileSync(
    "src/components/tools/menswear/material-library.tsx",
    "utf8",
  );

  assert.match(referenceSlot, /Upload/);
  assert.match(referenceSlot, /MaterialPickerDialog/);
  assert.match(referenceSlot, /ImagePreviewDialog/);
  assert.match(materials, /公开素材库/);
  assert.match(materials, /构图/);
  assert.match(materials, /光线/);
  assert.match(generator, /role: "model_face"/);
  assert.match(generator, /role: "model_body"/);
});

test("model manager supports reference-driven face and model image generation", () => {
  const manager = readFileSync(
    "src/components/tools/menswear/model-profile-manager.tsx",
    "utf8",
  );

  assert.match(manager, /生成脸部参考图/);
  assert.match(manager, /生成全身模特图/);
  assert.match(manager, /\/api\/tools\/menswear\/models\/\$\{profile\.id\}\/generate/);
  assert.match(manager, /ImagePreviewDialog/);
});

test("unified gallery opens reference thumbnails in a full size preview", () => {
  const gallery = readFileSync(
    "src/components/tools/ai-image-gallery-workbench.tsx",
    "utf8",
  );
  const workspace = readFileSync(
    "src/components/tools/menswear/menswear-workspace.tsx",
    "utf8",
  );

  assert.match(gallery, /ImagePreviewDialog/);
  assert.match(gallery, /参考图 \$\{index \+ 1\}/);
  assert.doesNotMatch(workspace, /男装图片画廊/);
});

test("menswear generator reveals upload slots only after material types are selected", () => {
  const generator = readFileSync(
    "src/components/tools/menswear/strict-fidelity-generator.tsx",
    "utf8",
  );

  assert.match(generator, /selectedSlotRoles/);
  assert.match(generator, /选择需要上传或引用的素材/);
  assert.match(generator, /selectedSlots\.map/);
  assert.match(generator, /系统补全设置/);
  assert.match(generator, /图片风格/);
  assert.match(generator, /ResultCard/);
});

test("model profile manager stores adjustable generation parameters and sends them to image generation", () => {
  const manager = readFileSync(
    "src/components/tools/menswear/model-profile-manager.tsx",
    "utf8",
  );
  const route = readFileSync(
    "src/app/api/tools/menswear/models/[id]/generate/route.ts",
    "utf8",
  );

  assert.match(manager, /模特参数/);
  assert.match(manager, /ageFeeling/);
  assert.match(manager, /bodyType/);
  assert.match(manager, /hairStyle/);
  assert.match(route, /buildModelImagePrompt\(profile\.name, profile\.profile, output\)/);
});

test("menswear generator defaults to custom style and opens a readable prompt preview", () => {
  const generator = readFileSync(
    "src/components/tools/menswear/strict-fidelity-generator.tsx",
    "utf8",
  );

  assert.match(generator, /useState\("自定义"\)/);
  assert.match(generator, /title="提示词预览" defaultOpen/);
  assert.match(generator, /text-sm leading-7/);
});

test("model library supports direct face and body uploads and allows a system model without reference consent", () => {
  const manager = readFileSync(
    "src/components/tools/menswear/model-profile-manager.tsx",
    "utf8",
  );
  const materials = readFileSync(
    "src/components/tools/menswear/material-library.tsx",
    "utf8",
  );

  assert.match(manager, /ImageReferenceUploader/);
  assert.match(manager, /上传脸部参考图/);
  assert.match(manager, /上传全身参考图/);
  assert.match(manager, /hasReference \? consentConfirmed : true/);
  assert.match(manager, /创建模特档案/);
  assert.match(materials, /保存选品/);
});

test("all apparel generation entry points expose a reusable face and model selector", () => {
  const selector = readFileSync(
    "src/components/tools/menswear/model-face-reference-selector.tsx",
    "utf8",
  );
  const outfitWorkbench = readFileSync(
    "src/components/tools/outfit-prompt-workbench.tsx",
    "utf8",
  );
  const multiOutfit = readFileSync(
    "src/components/tools/menswear/multi-outfit-generator.tsx",
    "utf8",
  );
  const styleReference = readFileSync(
    "src/components/tools/menswear/style-reference-generator.tsx",
    "utf8",
  );
  const uploader = readFileSync(
    "src/components/tools/image-reference-uploader.tsx",
    "utf8",
  );

  assert.match(selector, /系统生成/);
  assert.match(selector, /模特档案/);
  assert.match(selector, /素材库脸部/);
  assert.match(selector, /上传脸部参考图/);
  assert.match(uploader, /materialCategories/);
  assert.match(uploader, /categoryFilter/);
  assert.match(outfitWorkbench, /ModelFaceReferenceSelector/);
  assert.match(multiOutfit, /ModelFaceReferenceSelector/);
  assert.match(styleReference, /ModelFaceReferenceSelector/);
});

test("material library lets a user crop an uploaded image before storing it as a reusable material", () => {
  const materials = readFileSync(
    "src/components/tools/menswear/material-library.tsx",
    "utf8",
  );
  const cropDialog = readFileSync(
    "src/components/tools/image-crop-dialog.tsx",
    "utf8",
  );

  assert.match(materials, /ImageCropDialog/);
  assert.match(materials, /先框选需要的商品或素材区域/);
  assert.match(cropDialog, /canvas\.toBlob/);
  assert.match(cropDialog, /框选需要保存的区域/);
});

test("scene image creation is a separate workflow instead of strict fidelity configuration", () => {
  const generator = readFileSync(
    "src/components/tools/menswear/strict-fidelity-generator.tsx",
    "utf8",
  );
  const workspace = readFileSync(
    "src/components/tools/menswear/menswear-workspace.tsx",
    "utf8",
  );

  assert.doesNotMatch(generator, /SceneReferenceUploader/);
  assert.doesNotMatch(generator, /sceneMode/);
  assert.match(workspace, /\/tools\/menswear\/scene-image/);
  assert.match(workspace, /场景图生成/);
});

test("standalone scene image workflow owns scene modes and persistent scene image uploads", () => {
  const generator = readFileSync(
    "src/components/tools/menswear/scene-image-generator.tsx",
    "utf8",
  );
  const uploader = readFileSync(
    "src/components/tools/menswear/scene-reference-uploader.tsx",
    "utf8",
  );

  assert.match(generator, /人物换装/);
  assert.match(generator, /商品替换/);
  assert.match(generator, /纯背景生成/);
  assert.match(generator, /主商品品类/);
  assert.match(generator, /动作 \/ 场景补充要求/);
  assert.match(generator, /SceneReferenceUploader/);
  assert.match(generator, /sceneMode !== "background_only"/);
  assert.match(generator, /const activeReferences = sceneMode === "background_only"/);
  assert.match(generator, /workflow: "scene-image"/);
  assert.match(uploader, /maxFiles = 6/);
  assert.match(uploader, /\/api\/tools\/menswear\/materials\/upload/);
});

test("scene image generation uses a dedicated prompt and gallery source", () => {
  const route = readFileSync(
    "src/app/api/tools/menswear/projects/[id]/generate/route.ts",
    "utf8",
  );
  const prompts = readFileSync("src/lib/menswear-studio.ts", "utf8");

  assert.match(route, /buildSceneImagePrompt/);
  assert.match(route, /menswear-scene-image/);
  assert.match(prompts, /你是男装场景图生成助手/);
});

test("material library supports AI product recognition, editing, and private CRUD", () => {
  const materials = readFileSync(
    "src/components/tools/menswear/material-library.tsx",
    "utf8",
  );
  const analysisRoute = readFileSync(
    "src/app/api/tools/menswear/materials/analyze/route.ts",
    "utf8",
  );

  assert.match(materials, /AI 识别图片/);
  assert.match(materials, /编辑选品/);
  assert.match(materials, /\/api\/tools\/menswear\/materials\/\$\{material\.id\}/);
  assert.match(materials, /选品素材库/);
  assert.match(analysisRoute, /generateVisionText/);
});
