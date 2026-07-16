import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSkillPrompt,
  getSystemCreativeSkills,
  normalizeCreativeSkillDraft,
} from "../src/lib/creative-skills";

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
