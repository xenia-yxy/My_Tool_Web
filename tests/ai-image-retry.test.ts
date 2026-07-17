import assert from "node:assert/strict";
import { test } from "node:test";
import { retryAiImageGeneration } from "@/server/ai-image-queue";

test("retries transient upstream image failures before returning a generated image", async () => {
  let attempts = 0;

  const result = await retryAiImageGeneration(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("模型请求失败：HTTP 502 Bad Gateway {}");
      return "generated";
    },
    { delayMs: 0, maxAttempts: 3 },
  );

  assert.equal(result, "generated");
  assert.equal(attempts, 3);
});
