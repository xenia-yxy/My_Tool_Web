import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildMenswearGenerationProvenance,
  buildStrictMenswearPrompt,
  normalizeMenswearGenerationInput,
} from "../src/lib/menswear-studio";
import { normalizeMenswearMaterialAnalysis } from "../src/lib/menswear-material-analysis";

test("normalizes reference roles and forces product attributes to remain locked", () => {
  const input = normalizeMenswearGenerationInput({
    aspectRatio: "portrait",
    batchCount: 4,
    description: "浅黄色短袖衬衫和浅色牛仔裤",
    references: [
      { materialId: "shirt", role: "top", policy: "LOCKED", fidelity: 100 },
      { materialId: "pose", role: "pose", policy: "SYSTEM", fidelity: 40 },
    ],
  });

  assert.deepEqual(input, {
    aspectRatio: "portrait",
    batchCount: 4,
    cameraDistance: "three_quarter",
    customInstructions: "",
    description: "浅黄色短袖衬衫和浅色牛仔裤",
    modelProfileId: null,
    sceneMode: "try_on",
    references: [
      {
        allowedChanges: [],
        fidelity: 100,
        materialId: "shirt",
        policy: "LOCKED",
        role: "top",
      },
      {
        allowedChanges: [],
        fidelity: 40,
        materialId: "pose",
        policy: "SYSTEM",
        role: "pose",
      },
    ],
  });
});

test("forces every product reference to use strict lock policy", () => {
  const input = normalizeMenswearGenerationInput({
    description: "完整男装穿搭",
    references: [
      { materialId: "top", role: "top", policy: "REPLACE", fidelity: 20 },
      { materialId: "bottom", role: "bottom", policy: "LIMITED", fidelity: 55 },
      { materialId: "scene", role: "background", policy: "REPLACE", fidelity: 70 },
    ],
  });

  assert.deepEqual(input.references.slice(0, 2), [
    { allowedChanges: [], fidelity: 100, materialId: "top", policy: "LOCKED", role: "top" },
    { allowedChanges: [], fidelity: 100, materialId: "bottom", policy: "LOCKED", role: "bottom" },
  ]);
});

test("strict prompt names every reference role and bans product invention", () => {
  const prompt = buildStrictMenswearPrompt({
    aspectRatio: "portrait",
    cameraDistance: "full_body",
    customInstructions: "自然走路，不要文字",
    description: "浅黄色短袖衬衫和浅色牛仔裤",
    modelName: "男模特 01",
    references: [
      {
        fidelity: 100,
        materialName: "浅黄色衬衫",
        policy: "LOCKED",
        role: "top",
      },
      {
        fidelity: 70,
        materialName: "校园树荫",
        policy: "REPLACE",
        role: "background",
      },
    ],
  });

  assert.match(prompt, /主上衣：浅黄色衬衫/);
  assert.match(prompt, /必须保持商品的颜色、版型、图案、Logo、材质/);
  assert.match(prompt, /背景：校园树荫/);
  assert.match(prompt, /男模特 01/);
  assert.match(prompt, /人物远近：全身或接近全身/);
  assert.match(prompt, /不得补全不可见商品细节/);
  assert.match(prompt, /自然走路，不要文字/);
});

test("strict prompt keeps missing materials realistic through selected style and system controls", () => {
  const prompt = buildStrictMenswearPrompt({
    aspectRatio: "portrait",
    cameraDistance: "three_quarter",
    description: "夏季男装通勤图",
    references: [
      {
        fidelity: 100,
        materialName: "浅黄色短袖衬衫",
        policy: "LOCKED",
        role: "top",
      },
    ],
    stylePreset: "自然电商街拍",
    systemControls: ["城市通勤街道", "自然站姿", "柔和日光"],
  });

  assert.match(prompt, /画面风格：自然电商街拍/);
  assert.match(prompt, /系统补全设置：城市通勤街道；自然站姿；柔和日光/);
  assert.match(prompt, /七分身或膝上到全身之间/);
  assert.match(prompt, /未提供参考素材的部分只能按系统补全设置生成真实、协调的基础元素/);
  assert.match(prompt, /不得虚构未上传商品的具体品牌、Logo、版型或材质/);
});

test("scene modes add mode-specific constraints and allow a pure background without product references", () => {
  const input = normalizeMenswearGenerationInput({
    description: "夏季男装拍摄背景",
    sceneMode: "background_only",
    references: [],
  });

  assert.equal(input.sceneMode, "background_only");

  const prompt = buildStrictMenswearPrompt({
    aspectRatio: "landscape",
    description: "干净的城市天台背景",
    mainProductCategory: "男装拍摄背景",
    references: [],
    sceneAspectRatio: "16:9",
    sceneInstruction: "保留午后自然光，不要人物或商品",
    sceneMode: "background_only",
  });

  assert.match(prompt, /场景模式：纯背景生成/);
  assert.match(prompt, /输出比例：16:9/);
  assert.match(prompt, /主商品品类：男装拍摄背景/);
  assert.match(prompt, /不得出现人物、服装、鞋包、商品或手部/);
  assert.match(prompt, /优先执行的场景补充要求：保留午后自然光/);
});

test("rejects generation without a locked product reference", () => {
  assert.throws(
    () =>
      normalizeMenswearGenerationInput({
        description: "男装图",
        references: [],
      }),
    /至少选择一件锁定的商品素材/,
  );
});

test("builds gallery provenance from the project model and locked references", () => {
  assert.deepEqual(
    buildMenswearGenerationProvenance({
      modelProfileId: "model-1",
      projectId: "project-1",
      references: [
        { fidelity: 100, materialId: "shirt-1", policy: "LOCKED", role: "top" },
        { fidelity: 60, materialId: "scene-1", policy: "REPLACE", role: "background" },
      ],
    }),
    {
      modelProfileId: "model-1",
      projectId: "project-1",
      references: [
        { fidelity: 100, materialId: "shirt-1", policy: "LOCKED", role: "top" },
        { fidelity: 60, materialId: "scene-1", policy: "REPLACE", role: "background" },
      ],
    },
  );
});

test("normalizes AI material recognition into editable product metadata", () => {
  assert.deepEqual(
    normalizeMenswearMaterialAnalysis(
      "```json\n{\"name\":\"深蓝牛仔衬衫\",\"category\":\"top\",\"description\":\"深蓝色牛仔长袖衬衫，适合通勤和叠穿。\",\"tags\":[\"牛仔\",\"通勤\",\"牛仔\"],\"sellPoints\":[\"挺括面料\",\"基础百搭\"],\"keywords\":[\"男士牛仔衬衫\"]}\n```",
      "other",
    ),
    {
      category: "top",
      description: "深蓝色牛仔长袖衬衫，适合通勤和叠穿。",
      keywords: ["男士牛仔衬衫"],
      name: "深蓝牛仔衬衫",
      sellPoints: ["挺括面料", "基础百搭"],
      tags: ["牛仔", "通勤"],
    },
  );
});
