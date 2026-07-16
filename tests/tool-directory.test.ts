import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterExternalToolGroups,
  getExternalToolStats,
} from "../src/components/tools/tool-directory-data";

test("getExternalToolStats counts groups and linked tools", () => {
  const stats = getExternalToolStats();

  assert.equal(stats.groups >= 8, true);
  assert.equal(stats.tools >= 55, true);
  assert.equal(stats.linkedTools >= 45, true);
});

test("filterExternalToolGroups filters by platform and keyword", () => {
  const groups = filterExternalToolGroups({
    category: "小红书",
    query: "千瓜",
  });

  assert.equal(groups.length, 1);
  assert.equal(groups[0].items.length, 1);
  assert.equal(groups[0].items[0].name, "千瓜数据");
});

test("filterExternalToolGroups can find AI video tools", () => {
  const groups = filterExternalToolGroups({
    category: "AI 视频",
    query: "VibeKnow",
  });

  assert.equal(groups.length, 1);
  assert.equal(groups[0].items[0].name, "VibeKnow");
});
