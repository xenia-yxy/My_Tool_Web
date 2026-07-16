import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getSessionCacheKey,
  mergeRestoredSession,
} from "../src/components/tools/workbench-session-client";

test("builds a stable browser cache key for a tool", () => {
  assert.equal(getSessionCacheKey("ai-image"), "workbench-session:ai-image");
});

test("prefers a persisted server session over an older cached session", () => {
  const result = mergeRestoredSession(
    { id: "server", toolId: "ai-image", status: "RUNNING", updatedAt: "2026-07-13T12:00:00.000Z" },
    { id: "cache", toolId: "ai-image", status: "DRAFT", updatedAt: "2026-07-13T11:00:00.000Z" },
  );

  assert.equal(result?.id, "server");
});
