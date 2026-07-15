import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeWorkbenchSessionPatch } from "../src/server/workbench-sessions";

test("allows only editable workbench session fields", () => {
  assert.deepEqual(
    normalizeWorkbenchSessionPatch({
      title: "修改后的标题",
      prompt: "修改后的完整提示词",
      status: "RUNNING",
    }),
    {
      title: "修改后的标题",
      prompt: "修改后的完整提示词",
      status: "RUNNING",
    },
  );
});

test("rejects an attempt to assign a workbench session owner", () => {
  assert.throws(() =>
    normalizeWorkbenchSessionPatch({
      authorId: "another-user",
      title: "不应更新",
    }),
  );
});
