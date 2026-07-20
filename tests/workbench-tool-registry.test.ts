import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../src/components/tools/nav-config";
import {
  buildWorkbenchPrompt,
  getWorkbenchToolForPathname,
  workbenchTools,
} from "../src/lib/workbench-sessions";

test("resolves a workbench tool from its route", () => {
  assert.equal(getWorkbenchToolForPathname("/tools/ai-image")?.id, "ai-image");
  assert.equal(getWorkbenchToolForPathname("/tools/ip-factory")?.id, "ip-factory");
  assert.equal(getWorkbenchToolForPathname("/tools")?.id, "overview");
});

test("resolves the most specific workbench tool for nested workflow paths", () => {
  assert.equal(
    getWorkbenchToolForPathname("/tools/menswear/style-reference")?.id,
    "menswear-style-reference",
  );
  assert.equal(
    getWorkbenchToolForPathname("/tools/womenswear/flatlay-outfit-split")?.id,
    "womenswear-flatlay-outfit-split",
  );
});

test("maps every navigation item to a session tool", () => {
  for (const item of navGroups.flatMap((group) => group.items)) {
    assert.ok(workbenchTools.some((tool) => tool.id === item.id));
  }
});

test("places hotspot query in the create navigation group", () => {
  const create = navGroups.find((group) => group.id === "create");
  const resource = navGroups.find((group) => group.id === "resource");

  assert.equal(create?.items.some((item) => item.id === "hotspots"), true);
  assert.equal(resource?.items.some((item) => item.id === "hotspots"), false);
});

test("builds an editable prompt from visible tool inputs", () => {
  assert.equal(
    buildWorkbenchPrompt("热点查询", [
      { label: "关键词", value: "AI" },
      { label: "来源", value: "微博" },
    ]),
    "热点查询 当前操作\n关键词：AI\n来源：微博",
  );
});
