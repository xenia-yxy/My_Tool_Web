import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSkillPrompt,
  getSystemCreativeSkills,
  normalizeCreativeSkillDraft,
} from "../src/lib/creative-skills";
import { normalizeCreativeCanvasPatch } from "../src/server/creative-canvas";
import { normalizeCreativeSkillCreateInput } from "../src/server/creative-skills";

test("system catalog exposes every first-release canvas executor", () => {
  assert.deepEqual(
    getSystemCreativeSkills().map((skill) => skill.executorKey),
    [
      "menswear-generate",
      "menswear-style-reference",
      "menswear-multi-outfit",
      "platform-cover-design",
      "ip-derivative-factory",
      "menswear-model-generate",
      "menswear-material-extract",
      "hotspot-research",
    ],
  );
});

test("skill prompt interpolates only declared input variables", () => {
  const draft = normalizeCreativeSkillDraft({
    name: "秋季穿搭",
    executorKey: "menswear-multi-outfit",
    promptTemplate: "主体：{subject}\n季节：{season}",
    inputs: [{ key: "subject", type: "image", label: "主体图", required: true }],
  });

  assert.equal(
    buildSkillPrompt(draft, { subject: "白衬衫", season: "秋季" }),
    "主体：白衬衫\n季节：{season}",
  );
});

test("skill draft rejects duplicate input keys", () => {
  assert.throws(() => normalizeCreativeSkillDraft({
    name: "重复变量",
    executorKey: "menswear-generate",
    promptTemplate: "{subject}",
    inputs: [
      { key: "subject", type: "text", label: "主体", required: false },
      { key: "subject", type: "text", label: "第二主体", required: false },
    ],
  }));
});

test("canvas patch accepts structured nodes and rejects edges with missing cards", () => {
  const patch = normalizeCreativeCanvasPatch({
    title: "秋季封面项目",
    viewport: { x: -20, y: 40, zoom: 0.8 },
    nodes: [
      {
        clientId: "asset-1",
        kind: "ASSET",
        position: { x: 20, y: 20 },
        snapshot: { imageUrl: "/uploads/shirt.png" },
      },
      {
        clientId: "skill-1",
        kind: "SKILL",
        position: { x: 400, y: 20 },
        snapshot: { values: { season: "秋季" } },
      },
    ],
    edges: [
      {
        sourceClientId: "asset-1",
        targetClientId: "skill-1",
        role: "主体图",
      },
    ],
  });

  assert.equal(patch.viewport.zoom, 0.8);
  assert.equal(patch.nodes[1]?.snapshot.values.season, "秋季");
  assert.equal(patch.edges[0]?.role, "主体图");
  assert.throws(() => normalizeCreativeCanvasPatch({
    nodes: [],
    edges: [{ sourceClientId: "missing", targetClientId: "skill-1", role: "主体图" }],
  }));
});

test("custom Skill input uses the shared template contract", () => {
  const input = normalizeCreativeSkillCreateInput({
    name: "我的秋季搭配",
    executorKey: "menswear-multi-outfit",
    promptTemplate: "主体：{product}",
    inputs: [{ key: "product", type: "image", label: "主体图", required: true }],
  });

  assert.equal(input.ownerType, "CUSTOM");
  assert.equal(input.config.name, "我的秋季搭配");
});
