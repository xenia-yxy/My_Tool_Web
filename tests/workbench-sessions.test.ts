import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getWorkbenchTool,
  normalizeWorkbenchSessionInput,
} from "../src/server/workbench-sessions";

test("normalizes a bounded workbench session payload", () => {
  assert.deepEqual(
    normalizeWorkbenchSessionInput({
      toolId: "ai-image",
      title: "夏日饮品海报",
      prompt: "完整提示词",
      inputSnapshot: { subject: "饮品" },
      outputSnapshot: { imageUrl: "/image.png" },
      status: "RUNNING",
    }),
    {
      toolId: "ai-image",
      title: "夏日饮品海报",
      prompt: "完整提示词",
      inputSnapshot: { subject: "饮品" },
      outputSnapshot: { imageUrl: "/image.png" },
      imageAssetIds: [],
      externalJobId: null,
      errorMessage: null,
      status: "RUNNING",
    },
  );
});

test("rejects unknown tool IDs and oversized JSON snapshots", () => {
  assert.equal(getWorkbenchTool("not-a-tool"), null);
  assert.throws(() =>
    normalizeWorkbenchSessionInput({
      toolId: "ai-image",
      title: "x",
      prompt: "x",
      inputSnapshot: "x".repeat(100_001),
    }),
  );
});
