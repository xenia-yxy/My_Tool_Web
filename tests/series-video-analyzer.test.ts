import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzeSeriesVideo,
  buildSeriesVideoReport,
  detectVideoPlatform,
  normalizeSeriesVideoMetrics,
} from "../src/lib/series-video-analyzer";

test("detectVideoPlatform recognizes common short video links", () => {
  assert.equal(detectVideoPlatform("https://v.douyin.com/abc"), "douyin");
  assert.equal(
    detectVideoPlatform("https://www.xiaohongshu.com/explore/1"),
    "xiaohongshu",
  );
  assert.equal(detectVideoPlatform("https://b23.tv/abc"), "bilibili");
  assert.equal(detectVideoPlatform("https://example.com/video"), "other");
});

test("normalizeSeriesVideoMetrics clamps invalid values", () => {
  const metrics = normalizeSeriesVideoMetrics({
    views: -10,
    likes: 12,
    comments: -1,
    favorites: 4,
    shares: 2,
    followersGained: -5,
    completionRate: 130,
    averageWatchSeconds: -9,
  });

  assert.equal(metrics.views, 0);
  assert.equal(metrics.comments, 0);
  assert.equal(metrics.followersGained, 0);
  assert.equal(metrics.completionRate, 100);
  assert.equal(metrics.averageWatchSeconds, 0);
});

test("analyzeSeriesVideo diagnoses high views with weak follower conversion", () => {
  const analysis = analyzeSeriesVideo({
    title: "挑战舞蹈博主第 1 天",
    niche: "舞蹈博主",
    link: "https://v.douyin.com/abc",
    metrics: {
      views: 10000,
      likes: 500,
      comments: 30,
      favorites: 20,
      shares: 10,
      followersGained: 1,
      completionRate: 55,
      averageWatchSeconds: 18,
    },
  });

  assert.equal(analysis.platform, "douyin");
  assert.equal(analysis.primaryDiagnosis.includes("人设"), true);
  assert.equal(
    analysis.nextActions.some((item) => item.includes("下一条")),
    true,
  );
});

test("analyzeSeriesVideo diagnoses low views with strong favorites", () => {
  const analysis = analyzeSeriesVideo({
    title: "普通人做资料号真实复盘",
    niche: "资料号",
    metrics: {
      views: 300,
      likes: 15,
      comments: 2,
      favorites: 30,
      shares: 4,
      followersGained: 3,
      completionRate: 62,
      averageWatchSeconds: 22,
    },
  });

  assert.equal(analysis.primaryDiagnosis.includes("标题封面"), true);
});

test("analyzeSeriesVideo returns a useful baseline when only a link is provided", () => {
  const analysis = analyzeSeriesVideo({
    link: "https://www.bilibili.com/video/BV123",
  });

  assert.equal(analysis.platform, "bilibili");
  assert.equal(analysis.primaryDiagnosis.includes("补充"), true);
  assert.equal(analysis.scoreLabel, "待补充数据");
});

test("buildSeriesVideoReport includes summary and next actions", () => {
  const analysis = analyzeSeriesVideo({
    title: "挑战 100 个自媒体赛道第 1 期",
    niche: "舞蹈博主",
    metrics: {
      views: 1000,
      likes: 80,
      comments: 25,
      favorites: 6,
      shares: 3,
      followersGained: 12,
      completionRate: 72,
      averageWatchSeconds: 21,
    },
  });

  const report = buildSeriesVideoReport(analysis);

  assert.equal(report.includes("系列视频分析报告"), true);
  assert.equal(report.includes("下一步建议"), true);
});
