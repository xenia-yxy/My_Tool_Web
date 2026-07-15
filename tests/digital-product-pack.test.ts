import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDigitalProductPack,
  getDigitalProductPackPresets,
} from "../src/lib/digital-product-pack";

test("builds an AI cover prompt pack with listing copy, files, sources, and risk notes", () => {
  const output = buildDigitalProductPack({
    productType: "ai-cover",
    targetPlatform: "xianyu",
    audience: "小红书博主和电商卖家",
    niche: "小红书封面和电商主图",
    priceTier: "standard",
    deliveryFormat: "markdown-excel-pdf",
    includesAgentWorkflow: true,
    includesImageWorkflow: true,
  });

  assert.equal(output.productType, "ai-cover");
  assert.equal(output.price.value, "19.9 元");
  assert.ok(output.fileStructure.some((item) => /AI封面提示词/.test(item.name)));
  assert.ok(output.fileStructure.some((item) => /电商客服Agent/.test(item.name)));
  assert.ok(output.titleCandidates.length >= 5);
  assert.match(output.titleCandidates[0], /AI|封面|电商/);
  assert.match(output.detailPage, /适合人群/);
  assert.match(output.detailPage, /不包含盗版课程/);
  assert.ok(output.sourceChecklist.some((item) => /归藏|LangGPT|Dify|扣子/.test(item)));
  assert.ok(output.riskNotes.some((item) => /不要/.test(item)));
});

test("builds an ecommerce agent pack with knowledge base templates and Dify or Coze setup notes", () => {
  const output = buildDigitalProductPack({
    productType: "ecommerce-agent",
    targetPlatform: "xianyu",
    audience: "淘宝、抖店和闲鱼卖家",
    niche: "商品标题、客服和售后",
    priceTier: "premium",
    deliveryFormat: "markdown-excel-pdf",
    includesAgentWorkflow: true,
    includesImageWorkflow: false,
  });

  assert.equal(output.price.value, "39.9 元");
  assert.ok(output.fileStructure.some((item) => /商品知识库模板/.test(item.name)));
  assert.ok(output.fileStructure.some((item) => /Dify|扣子/.test(item.name)));
  assert.match(output.sellerScript, /拍下后/);
  assert.match(output.deliveryChecklist.join("\n"), /来源链接与更新时间/);
});

test("presets expose product types, platforms, price tiers, and delivery formats", () => {
  const presets = getDigitalProductPackPresets();

  assert.ok(presets.productTypes.some((item) => item.value === "ai-cover"));
  assert.ok(presets.productTypes.some((item) => item.value === "ecommerce-agent"));
  assert.ok(presets.targetPlatforms.some((item) => item.value === "xianyu"));
  assert.ok(presets.priceTiers.some((item) => item.value === "standard"));
  assert.ok(presets.deliveryFormats.some((item) => item.value === "markdown-excel-pdf"));
});
