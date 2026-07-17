import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("shared image generation queues work for the background worker instead of holding the browser request", () => {
  const route = readFileSync("src/app/api/tools/image-generation/route.ts", "utf8");
  const workerRoute = readFileSync("src/app/api/internal/ai-image-worker/route.ts", "utf8");
  const compose = readFileSync("docker-compose.prod.yml", "utf8");

  assert.match(route, /status: 202/);
  assert.match(route, /queuePayload/);
  assert.match(workerRoute, /claimNextAiImageJob/);
  assert.match(compose, /my-web-worker/);
});
