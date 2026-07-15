import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { resolveImageWorkbenchToolId } from "../src/lib/image-generation-workflow";
import {
  buildPlatformCoverDesignPrompt,
  getPlatformCoverAspectRatio,
} from "../src/lib/platform-cover-design";
import { getWorkbenchTool } from "../src/server/workbench-sessions";

test("builds a platform cover prompt that preserves the original cover and only borrows optional reference style", () => {
  const prompt = buildPlatformCoverDesignPrompt({
    platform: "xiaohongshu",
    coverGoal: "种草封面",
    title: "普通人夏天这样穿",
    subtitle: "清爽显高，不费力",
    visualStyle: "清透生活感",
    editInstructions: "保留人物和白衬衫，增强标题区留白",
    hasStyleReferences: true,
    textMode: "no_text",
  });

  assert.match(prompt, /第 1 张是封面原图/);
  assert.match(prompt, /保留封面原图的主体、商品、人物、脸部、关键构图和真实质感/);
  assert.match(prompt, /参考图只用于学习版式、色彩、装饰元素和视觉层级/);
  assert.match(prompt, /小红书/);
  assert.match(prompt, /普通人夏天这样穿/);
  assert.match(prompt, /不要出现任何文字/);
});

test("builds a controlled text cover prompt for title layout attempts", () => {
  const prompt = buildPlatformCoverDesignPrompt({
    platform: "douyin",
    coverGoal: "知识干货",
    title: "3 个封面误区",
    subtitle: "",
    visualStyle: "强对比信息流",
    editInstructions: "",
    hasStyleReferences: false,
    textMode: "with_text",
  });

  assert.match(prompt, /可以尝试生成封面文字/);
  assert.match(prompt, /文字必须只包含/);
  assert.match(prompt, /3 个封面误区/);
  assert.match(prompt, /没有参考图时/);
});

test("resolves platform cover dimensions and registers tool history", () => {
  assert.equal(getPlatformCoverAspectRatio("xiaohongshu"), "portrait");
  assert.equal(getPlatformCoverAspectRatio("xianyu"), "square");
  assert.equal(getWorkbenchTool("platform-cover-design")?.label, "平台封面设计");
  assert.equal(resolveImageWorkbenchToolId("platform-cover-design"), "platform-cover-design");
});

test("platform cover design has navigation, page, component, and gallery reference labels", () => {
  const nav = readFileSync("src/components/tools/nav-config.ts", "utf8");
  const page = readFileSync("src/app/tools/platform-cover-design/page.tsx", "utf8");
  const component = readFileSync("src/components/tools/platform-cover-design-workbench.tsx", "utf8");
  const gallery = readFileSync("src/components/tools/ai-image-gallery-workbench.tsx", "utf8");

  assert.match(nav, /平台封面设计/);
  assert.match(nav, /\/tools\/platform-cover-design/);
  assert.match(page, /PlatformCoverDesignWorkbench/);
  assert.match(component, /封面原图/);
  assert.match(component, /风格参考图/);
  assert.match(component, /platform-cover-design/);
  assert.match(gallery, /封面原图/);
  assert.match(gallery, /风格参考图/);
});
