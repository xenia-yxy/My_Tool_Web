import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeAdminContentAssetBody,
  normalizeAdminContentStatusBody,
} from "../src/server/admin-content-api";

test("normalizeAdminContentAssetBody prepares draft and published content input", () => {
  assert.deepEqual(
    normalizeAdminContentAssetBody({
      title: "  AI SOP  ",
      slug: "  AI SOP Draft  ",
      excerpt: "  实践记录  ",
      content: "  # 正文  ",
      status: "PUBLISHED",
    }),
    {
      title: "AI SOP",
      slug: "ai-sop-draft",
      excerpt: "实践记录",
      content: "# 正文",
      status: "PUBLISHED",
    },
  );

  assert.equal(
    normalizeAdminContentAssetBody({
      title: "草稿",
      content: "正文",
      status: "ARCHIVED",
    }).status,
    "PRIVATE",
  );
});

test("normalizeAdminContentStatusBody accepts publish and withdraw actions", () => {
  assert.equal(normalizeAdminContentStatusBody({ action: "publish" }), "PUBLISHED");
  assert.equal(normalizeAdminContentStatusBody({ action: "withdraw" }), "PRIVATE");
  assert.equal(normalizeAdminContentStatusBody({ status: "PUBLISHED" }), "PUBLISHED");
  assert.equal(normalizeAdminContentStatusBody({ status: "PRIVATE" }), "PRIVATE");
});

test("normalizeAdminContentStatusBody rejects unknown status actions", () => {
  assert.throws(
    () => normalizeAdminContentStatusBody({ action: "delete" }),
    /不支持的发布状态/,
  );
});

