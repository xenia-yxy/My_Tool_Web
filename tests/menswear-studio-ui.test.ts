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
  assert.match(gallery, /锁定商品参考/);
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
  assert.match(materials, /保存到公开素材库/);
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
  assert.match(materials, /先框选需要的区域/);
  assert.match(cropDialog, /canvas\.toBlob/);
  assert.match(cropDialog, /框选需要保存的区域/);
});
