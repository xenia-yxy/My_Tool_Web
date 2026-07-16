import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildIpPrototypePrompt,
  buildIpPrototypeTaskDrafts,
  normalizeIpPrototypeGenerationInput,
  normalizeIpPrototypeProjectInput,
} from "../src/server/ip-prototype";

test("normalizeIpPrototypeProjectInput trims project fields", () => {
  const result = normalizeIpPrototypeProjectInput({
    name: "  Bingou 日常  ",
    ipType: "person",
    description: "  狗狗短视频账号主角  ",
    brandTone: "  抽象、直接、有生命力  ",
  });

  assert.deepEqual(result, {
    name: "Bingou 日常",
    ipType: "person",
    description: "狗狗短视频账号主角",
    brandTone: "抽象、直接、有生命力",
  });
});

test("normalizeIpPrototypeGenerationInput supports all IP types and defaults", () => {
  const result = normalizeIpPrototypeGenerationInput({
    ipType: "content",
    outputGoal: "series",
    prompt: "  做一套栏目封面  ",
    styleText: "  胶片感  ",
    aspectRatio: "portrait",
    quality: "high",
  });

  assert.deepEqual(result, {
    ipType: "content",
    outputGoal: "series",
    prompt: "做一套栏目封面",
    styleText: "胶片感",
    conceptStatement: null,
    targetAudience: null,
    personality: null,
    visualAnchors: null,
    avoidDirections: null,
    scenario: null,
    aspectRatio: "portrait",
    quality: "high",
  });
});

test("buildIpPrototypePrompt includes draft, style, and IP direction", () => {
  const prompt = buildIpPrototypePrompt({
    projectName: "Xenia 个人形象",
    ipType: "person",
    outputGoal: "refine",
    prompt: "保持人物松弛但有攻击性",
    styleText: "白底、冷静、带一点手作粗糙感",
    conceptStatement: "把混乱想法整理成可发布资产的 AI 实践者分身",
    targetAudience: "AI 实践者、内容创作者、潜在企业 SOP 客户",
    personality: "冷静、可信、直接、耐心",
    visualAnchors: "便签、节点、小屏幕、浅色工作台",
    avoidDirections: "不要幼态、暗黑赛博、复杂机甲",
    scenario: "首页首屏和工具台引导",
    hasDraftImage: true,
    hasStyleImage: true,
  });

  assert.match(prompt, /个人 IP 原型设计师/);
  assert.match(prompt, /项目：Xenia 个人形象/);
  assert.match(prompt, /类型：人物 IP/);
  assert.match(prompt, /输出目标：精修图/);
  assert.match(prompt, /参考用户上传的草稿图/);
  assert.match(prompt, /参考用户上传的风格图/);
  assert.match(prompt, /保持人物松弛但有攻击性/);
  assert.match(prompt, /白底、冷静/);
  assert.match(prompt, /立意：把混乱想法整理成可发布资产的 AI 实践者分身/);
  assert.match(prompt, /目标用户：AI 实践者、内容创作者、潜在企业 SOP 客户/);
  assert.match(prompt, /性格：冷静、可信、直接、耐心/);
  assert.match(prompt, /视觉锚点：便签、节点、小屏幕、浅色工作台/);
  assert.match(prompt, /避免方向：不要幼态、暗黑赛博、复杂机甲/);
  assert.match(prompt, /应用场景：首页首屏和工具台引导/);
});

test("buildIpPrototypeTaskDrafts creates follow-up planning items", () => {
  const tasks = buildIpPrototypeTaskDrafts({
    projectName: "Bingou 日常",
    outputGoal: "character-sheet",
  });

  assert.equal(tasks.length, 3);
  assert.match(tasks[0].title, /Bingou 日常/);
  assert.equal(tasks[0].source, "IP_PROTOTYPE");
  assert.equal(tasks[0].quadrant, "SCHEDULE");
});

test("IP prototype workbench keeps the main flow short and folds optional settings", () => {
  const workbench = readFileSync(
    "src/components/tools/ip-prototype-workbench.tsx",
    "utf8",
  );

  assert.match(workbench, /补充设定（可选）/);
  assert.match(workbench, /<details/);
  assert.match(workbench, /核心想法/);
  assert.doesNotMatch(workbench, /IP 创作怎么用/);
  assert.doesNotMatch(workbench, /stepItems/);
});
