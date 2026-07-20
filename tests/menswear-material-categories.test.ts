import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveMaterialCategory } from "../src/server/menswear-studio";

test("classifies legacy other material with face hints as model face", () => {
  assert.equal(resolveMaterialCategory({
    category: "other",
    name: "人物脸部肖像参考",
    tags: ["历史恢复"],
  }), "model_face");
});

test("keeps an explicitly selected material category unchanged", () => {
  assert.equal(resolveMaterialCategory({
    category: "background",
    name: "街头背景",
    tags: ["场景"],
  }), "background");
});

test("keeps unrecognizable recovered material in the manual classification queue", () => {
  assert.equal(resolveMaterialCategory({
    category: "other",
    name: "ref-2026-07-18-image",
    tags: ["历史恢复", "参考素材"],
  }), "other");
});
