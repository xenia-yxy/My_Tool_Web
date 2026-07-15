import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSocialCommerceOutput,
  getSocialCommercePresets,
} from "../src/lib/social-commerce-workflow";

test("xiaohongshu output generates cover, titles, caption, tags, and image-only prompt", () => {
  const output = buildSocialCommerceOutput({
    platform: "xiaohongshu",
    itemDescription: "夏季通勤白色短袖衬衫，适合小个子女生",
    audience: "小个子女生",
    scene: "夏季通勤",
    sellingPoint: "清爽、显高、好搭配",
    contentType: "种草笔记",
    hasReferenceImages: true,
  });

  assert.equal(output.platform, "xiaohongshu");
  assert.equal(output.aspectRatio, "portrait");
  assert.ok(output.coverDirections.length >= 4);
  assert.ok(output.titleCandidates.length >= 6);
  assert.match(output.titleCandidates[0].title, /小个子女生|夏季通勤|白色短袖衬衫/);
  assert.match(output.caption, /开头|体验|注意/);
  assert.ok(output.tags.includes("#小个子女生"));
  assert.match(output.imagePrompt, /不要生成任何文字/);
  assert.match(output.imagePrompt, /先分析上传参考图/);
});

test("xianyu output generates search titles, listing copy, keywords, scripts, and square prompt", () => {
  const output = buildSocialCommerceOutput({
    platform: "xianyu",
    itemDescription: "索尼 WH-1000XM5 黑色降噪耳机",
    audience: "通勤降噪用户",
    scene: "通勤和办公室",
    sellingPoint: "降噪强、续航正常、配件齐全",
    brand: "索尼",
    model: "WH-1000XM5",
    category: "降噪耳机",
    condition: "95新",
    flaws: "右耳罩有轻微使用痕迹",
    accessories: "包装盒、收纳盒、音频线、充电线",
    priceRange: "1500-1700",
    transferReason: "换新款",
    hasReferenceImages: true,
  });

  assert.equal(output.platform, "xianyu");
  assert.equal(output.aspectRatio, "square");
  assert.ok(output.titleCandidates.length >= 6);
  assert.match(output.titleCandidates[0].title, /索尼/);
  assert.match(output.titleCandidates[0].title, /WH-1000XM5/);
  assert.match(output.titleCandidates[0].title, /95新/);
  assert.match(output.caption, /成色|瑕疵|配件|转卖原因/);
  assert.ok(output.keywords.includes("索尼"));
  assert.ok(output.replyScripts.length >= 3);
  assert.match(output.imagePrompt, /真实商品首图/);
  assert.match(output.imagePrompt, /不要改造成色/);
});

test("xianyu publish checks warn when condition, flaws, or accessories are missing", () => {
  const output = buildSocialCommerceOutput({
    platform: "xianyu",
    itemDescription: "二手键盘",
  });

  assert.ok(output.publishChecks.some((item) => item.status === "warning" && /成色/.test(item.message)));
  assert.ok(output.publishChecks.some((item) => item.status === "warning" && /瑕疵/.test(item.message)));
  assert.ok(output.publishChecks.some((item) => item.status === "warning" && /配件/.test(item.message)));
});

test("presets expose separate platform options", () => {
  const presets = getSocialCommercePresets();

  assert.ok(presets.xiaohongshu.contentTypes.includes("种草笔记"));
  assert.ok(presets.xianyu.conditions.includes("95新"));
  assert.ok(presets.xianyu.scenes.includes("真实商品首图"));
});
