import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWorkbenchActionSessionDraft } from "../src/lib/workbench-action-history";

test("builds a session draft for a non-image tool action", () => {
  assert.deepEqual(
    buildWorkbenchActionSessionDraft({
      toolId: "hotspots",
      toolLabel: "热点查询",
      actionLabel: "查询",
      title: "热点查询：AI",
      fields: [
        { label: "关键词", value: "AI" },
        { label: "来源", value: "微博" },
      ],
      inputSnapshot: { query: "AI", sources: ["weibo"] },
      outputSummary: "命中 3 条热点",
    }),
    {
      toolId: "hotspots",
      title: "热点查询：AI",
      status: "SUCCEEDED",
      prompt: "热点查询 查询\n关键词：AI\n来源：微博",
      inputSnapshot: { query: "AI", sources: ["weibo"] },
      outputSnapshot: { summary: "命中 3 条热点" },
      imageAssetIds: [],
      externalJobId: null,
      errorMessage: null,
    },
  );
});
