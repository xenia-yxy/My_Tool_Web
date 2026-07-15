export type SocialCommercePlatform = "xiaohongshu" | "xianyu";

export type SocialCommerceInput = {
  platform?: SocialCommercePlatform;
  itemDescription?: string;
  audience?: string;
  scene?: string;
  sellingPoint?: string;
  contentType?: string;
  extraInstructions?: string;
  brand?: string;
  model?: string;
  category?: string;
  condition?: string;
  flaws?: string;
  accessories?: string;
  priceRange?: string;
  transferReason?: string;
  hasReferenceImages?: boolean;
};

export type SocialCommerceOutput = {
  platform: SocialCommercePlatform;
  aspectRatio: "portrait" | "square";
  coverDirections: string[];
  titleCandidates: Array<{ title: string; angle: string }>;
  caption: string;
  tags: string[];
  keywords: string[];
  replyScripts: string[];
  publishChecks: Array<{ status: "ok" | "warning"; message: string }>;
  imagePrompt: string;
};

export function getSocialCommercePresets() {
  return {
    xiaohongshu: {
      audiences: ["大学生", "小个子女生", "职场新人", "租房党", "通勤女生", "平价党"],
      contentTypes: ["种草笔记", "穿搭分享", "避雷清单", "好物清单"],
      scenes: ["夏季通勤", "返校", "约会出门", "办公室", "租房生活"],
    },
    xianyu: {
      conditions: ["全新", "99新", "95新", "9成新", "正常使用痕迹"],
      scenes: ["真实商品首图", "细节瑕疵图", "配件全家福", "使用场景图"],
    },
  };
}

export function buildSocialCommerceOutput(
  input: SocialCommerceInput,
): SocialCommerceOutput {
  return input.platform === "xianyu"
    ? buildXianyuOutput(input)
    : buildXiaohongshuOutput(input);
}

function buildXiaohongshuOutput(input: SocialCommerceInput): SocialCommerceOutput {
  const item = input.itemDescription?.trim() || "这件好物";
  const audience = input.audience?.trim() || "目标用户";
  const scene = input.scene?.trim() || "日常场景";
  const sellingPoint = input.sellingPoint?.trim() || "真实好用、门槛低、容易参考";
  const contentType = input.contentType?.trim() || "种草笔记";
  const extra = input.extraInstructions?.trim();

  return {
    platform: "xiaohongshu",
    aspectRatio: "portrait",
    coverDirections: [
      `${scene}真实上身/使用图，画面干净，不加字`,
      `突出${audience}能直接参考的主体构图`,
      `用自然光和生活化背景承接${contentType}`,
      `保留参考图主体，不夸张修图，不做广告海报`,
    ],
    titleCandidates: [
      { title: `${audience}${scene}可以看这件：${shorten(item)}`, angle: "人群+场景" },
      { title: `${scene}别乱买，先试试${shorten(item)}`, angle: "避坑" },
      { title: `${audience}也能直接抄的${contentType}`, angle: "低门槛" },
      { title: `${shorten(item)}，清爽又好搭`, angle: "卖点" },
      { title: `普通人${scene}这样拍更真实`, angle: "真实感" },
      { title: `${audience}收藏率更高的图文方向`, angle: "运营" },
    ],
    caption: [
      `开头：${audience}如果想找${scene}能用的东西，可以先看这类。`,
      `体验：${item}的重点是${sellingPoint}，图片尽量拍真实场景，不要做成广告感。`,
      extra ? `补充：${extra}` : "",
      "注意：先测收藏、评论和点击，再决定是否继续放大同款或相似款。",
    ]
      .filter(Boolean)
      .join("\n"),
    tags: [
      `#${audience}`,
      `#${scene}`,
      "#小红书种草",
      "#图文笔记",
      "#真实分享",
      "#好物分享",
    ],
    keywords: [item, audience, scene, sellingPoint],
    replyScripts: [
      "可以，我整理的是同类型关键词，你可以按图里风格去搜。",
      "这类先看评价图和差评，再看价格。",
      "如果想要更平价，可以搜同材质/同版型。",
    ],
    publishChecks: [
      { status: "ok", message: "图片提示词已强制禁止图中文字" },
      { status: "ok", message: "正文包含开头、体验和注意事项" },
    ],
    imagePrompt: [
      input.hasReferenceImages
        ? "先分析上传参考图，保留主体、材质、颜色、构图和真实生活感。"
        : "根据商品描述生成真实生活方式图片。",
      `主题：${item}`,
      `目标人群：${audience}`,
      `场景：${scene}`,
      `卖点：${sellingPoint}`,
      extra ? `补充要求：${extra}` : "",
      "不要生成任何文字、标题、标签、水印、价格、账号或品牌logo；只生成真实图片画面。",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function buildXianyuOutput(input: SocialCommerceInput): SocialCommerceOutput {
  const brand = input.brand?.trim() || "";
  const model = input.model?.trim() || "";
  const category = input.category?.trim() || "二手商品";
  const item =
    input.itemDescription?.trim() ||
    [brand, model, category].filter(Boolean).join(" ") ||
    "二手商品";
  const condition = input.condition?.trim() || "";
  const flaws = input.flaws?.trim() || "";
  const accessories = input.accessories?.trim() || "";
  const transferReason = input.transferReason?.trim() || "闲置转让";

  return {
    platform: "xianyu",
    aspectRatio: "square",
    coverDirections: [
      "真实商品首图，主体完整，背景干净",
      "拍清成色、配件和关键细节",
      "瑕疵单独拍近景，不遮掩",
      "不要滤镜过重，不要改造成色",
    ],
    titleCandidates: [
      { title: [brand, model, condition, category].filter(Boolean).join(" "), angle: "搜索词完整" },
      { title: `${condition || "自用"} ${item} 配件齐`, angle: "成色+配件" },
      { title: `${brand || category} ${model || ""} ${transferReason}`.trim(), angle: "品牌型号" },
      { title: `${item} 自用转让`, angle: "真实来源" },
      { title: `${category} ${condition || "正常使用"} 可小刀`, angle: "议价" },
      { title: `${item} 细节实拍`, angle: "实拍" },
    ],
    caption: [
      `成色：${condition || "请补充具体成色"}`,
      `瑕疵：${flaws || "请补充瑕疵或明确无明显瑕疵"}`,
      `配件：${accessories || "请补充配件清单"}`,
      `转卖原因：${transferReason}`,
      input.priceRange ? `价格区间：${input.priceRange}` : "",
      input.extraInstructions?.trim() ? `补充：${input.extraInstructions.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    tags: ["#闲鱼", `#${category}`, brand ? `#${brand}` : "#二手闲置"].filter(Boolean),
    keywords: [brand, model, category, condition, item].filter(Boolean),
    replyScripts: [
      "还在，图片都是实拍，具体瑕疵可以看细节图。",
      "配件按描述里这些一起出，不拆。",
      "价格可以小刀，爽快的话今天能出。",
    ],
    publishChecks: [
      { status: condition ? "ok" : "warning", message: condition ? "已填写成色" : "建议补充成色" },
      { status: flaws ? "ok" : "warning", message: flaws ? "已填写瑕疵" : "建议补充瑕疵" },
      { status: accessories ? "ok" : "warning", message: accessories ? "已填写配件" : "建议补充配件" },
    ],
    imagePrompt: [
      input.hasReferenceImages
        ? "先分析上传参考图，保持商品真实外观、成色、瑕疵和配件，不要改造成色。"
        : "生成真实商品首图，主体完整清楚。",
      `商品：${item}`,
      `成色：${condition || "按真实二手状态"}`,
      `瑕疵：${flaws || "不要虚构完美无瑕"}`,
      `配件：${accessories || "按描述表现"}`,
      input.extraInstructions?.trim() ? `补充要求：${input.extraInstructions.trim()}` : "",
      "真实商品首图，方图构图，干净背景，不要生成任何文字、水印、价格、标签或账号。",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function shorten(value: string) {
  return value.length > 18 ? `${value.slice(0, 18)}...` : value;
}
