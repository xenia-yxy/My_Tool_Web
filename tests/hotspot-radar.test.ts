import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHotspotSearchShortcuts,
  filterHotspotEntries,
  getHotspotStats,
  hotspotEntries,
} from "../src/lib/hotspot-radar";

test("getHotspotStats counts platforms and entries", () => {
  const stats = getHotspotStats();

  assert.equal(stats.platforms, 3);
  assert.equal(stats.entries >= 12, true);
  assert.equal(stats.linkedEntries, stats.entries);
});

test("filterHotspotEntries filters by platform and topic", () => {
  const entries = filterHotspotEntries({
    platform: "douyin",
    topic: "电商",
  });

  assert.equal(entries.length >= 1, true);
  assert.equal(entries.every((entry) => entry.platform === "douyin"), true);
  assert.equal(entries.every((entry) => entry.topic === "电商"), true);
});

test("filterHotspotEntries searches title description platform and tags", () => {
  const entries = filterHotspotEntries({
    query: "评论区洞察",
  });

  assert.equal(entries.length >= 1, true);
  assert.equal(
    entries.some((entry) => entry.tags.includes("评论区洞察")),
    true,
  );
});

test("buildHotspotSearchShortcuts encodes Chinese and English keywords", () => {
  const shortcuts = buildHotspotSearchShortcuts("AI 穿搭");

  assert.equal(shortcuts.length, 3);
  assert.equal(
    shortcuts.every((shortcut) =>
      shortcut.href.includes("AI%20%E7%A9%BF%E6%90%AD"),
    ),
    true,
  );
});

test("buildHotspotSearchShortcuts returns empty list for blank keyword", () => {
  assert.deepEqual(buildHotspotSearchShortcuts("   "), []);
});

test("hotspotEntries cover Douyin Xiaohongshu and Bilibili", () => {
  const platforms = new Set(hotspotEntries.map((entry) => entry.platform));

  assert.deepEqual([...platforms].sort(), [
    "bilibili",
    "douyin",
    "xiaohongshu",
  ]);
});
