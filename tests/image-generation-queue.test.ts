import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildStaleAiImageJobUpdate } from "../src/server/ai-image-assets";

test("marks stale image jobs as failed instead of returning them to pending", () => {
  assert.deepEqual(buildStaleAiImageJobUpdate(), {
    errorMessage: "生成任务超时，请重新提交",
    failedCount: 1,
    status: "FAILED",
  });
});

test("shared image generation queues work for the background worker instead of holding the browser request", () => {
  const route = readFileSync("src/app/api/tools/image-generation/route.ts", "utf8");
  const workerRoute = readFileSync("src/app/api/internal/ai-image-worker/route.ts", "utf8");
  const compose = readFileSync("docker-compose.prod.yml", "utf8");

  assert.match(route, /status: 202/);
  assert.match(route, /queuePayload/);
  assert.match(workerRoute, /claimNextAiImageJob/);
  assert.match(workerRoute, /process\.env\.AUTH_SECRET/);
  assert.match(compose, /my-web-worker/);
  assert.match(compose, /\$\$\{AUTH_SECRET/);
});

test("image queue records each completed image before the full batch finishes", () => {
  const queue = readFileSync("src/server/ai-image-queue.ts", "utf8");
  const assets = readFileSync("src/server/ai-image-assets.ts", "utf8");

  assert.match(queue, /markAiImageJobProgress/);
  assert.match(assets, /export async function markAiImageJobProgress/);
});
