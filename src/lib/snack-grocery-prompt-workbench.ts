export type SnackGroceryOutputType =
  | "auto"
  | "dorm_list"
  | "rental_goods"
  | "office_snack"
  | "summer_hot"
  | "batch_post";

export type SnackGroceryPromptInput = {
  batchCount?: number;
  audience?: string;
  outputType?: SnackGroceryOutputType;
  category?: string;
  itemDescription?: string;
  customPrompt?: string;
  customInstructions?: string;
  hasReferenceImages?: boolean;
};

export type SnackGroceryPromptPack = {
  id: string;
  label: string;
  outputType: SnackGroceryOutputType;
  imagePrompt: string;
  negativePrompt: string;
  postTitle: string;
  copyText: string;
  tags: string;
  productKeywords: string[];
  sellingPoints: string[];
  riskNotes: string[];
  copyAll: string;
};

const audiences = ["大学生", "职场人", "租房党", "宿舍党", "办公室人群"];
const categories = [
  "零食饮料",
  "速食夜宵",
  "百货收纳",
  "清洁消耗品",
  "防暑降温",
  "厨房小物",
];
const outputSequence: SnackGroceryOutputType[] = [
  "dorm_list",
  "office_snack",
  "rental_goods",
  "summer_hot",
  "batch_post",
];

const negativePrompt = [
  "水印",
  "品牌logo",
  "错误文字",
  "夸张虚假功效",
  "医疗功效暗示",
  "食品发霉",
  "包装破损",
  "低清晰度",
  "过度滤镜",
  "脏乱背景",
  "人物脸部抢镜",
  "价格虚标",
  "侵权商标",
].join("，");

const dormCombos = [
  "低卡零食 + 无糖饮料 + 小包装饼干 + 密封收纳盒",
  "拌面/粉丝 + 火腿肠 + 即食汤包 + 一次性餐具",
  "果冻布丁 + 海苔脆 + 坚果小包 + 桌面收纳篮",
  "冷泡茶包 + 冰杯模具 + 湿巾 + 便携小风扇",
];

const officeCombos = [
  "黑咖啡 + 无糖茶 + 坚果小包 + 低糖饼干",
  "下午茶小零食 + 独立包装糖果 + 桌面收纳盒 + 湿巾",
  "加班夜宵速食 + 纸巾 + 一次性勺叉 + 小垃圾袋",
  "低卡代餐棒 + 气泡水 + 薄荷糖 + 抽屉分隔盒",
];

const rentalCombos = [
  "厨房沥水篮 + 密封收纳盒 + 一次性抹布 + 除味剂",
  "衣柜分隔收纳 + 粘毛器 + 压缩袋 + 香氛包",
  "桌面置物架 + 数据线收纳 + 纸巾盒 + 垃圾袋",
  "浴室拖鞋架 + 地漏贴 + 清洁刷 + 防霉喷雾",
];

const summerCombos = [
  "便携风扇 + 冰感湿巾 + 冷泡茶 + 防晒袖套",
  "无糖饮料 + 冰杯模具 + 盐汽水 + 小包装零食",
  "宿舍凉感垫 + 除味喷雾 + 洗衣凝珠 + 收纳篮",
  "户外水杯 + 防晒帽 + 纸巾湿巾 + 能量小零食",
];

const snackKeywords = [
  "宿舍零食囤货",
  "低卡零食组合",
  "无糖饮料整箱",
  "办公室下午茶零食",
  "速食夜宵囤货",
  "大学生平价零食",
];

const groceryKeywords = [
  "租房收纳好物",
  "宿舍桌面收纳",
  "厨房沥水篮",
  "密封收纳盒",
  "清洁消耗品",
  "防暑降温好物",
];

export function getSnackGroceryPresets() {
  return {
    audiences,
    categories,
    outputTypes: [
      { value: "auto", label: "自动组合" },
      { value: "dorm_list", label: "宿舍囤货清单" },
      { value: "rental_goods", label: "租房好物清单" },
      { value: "office_snack", label: "办公室续命零食" },
      { value: "summer_hot", label: "暑假短期热点" },
      { value: "batch_post", label: "图文起号批量" },
    ] satisfies Array<{ value: SnackGroceryOutputType; label: string }>,
  };
}

export function buildSnackGroceryPromptBatch(
  input: SnackGroceryPromptInput,
): SnackGroceryPromptPack[] {
  const batchCount = clampBatchCount(input.batchCount);
  const audience = input.audience?.trim() || audiences[0];
  const category = input.category?.trim() || categories[0];
  const itemDescription = input.itemDescription?.trim() || "零食百货主商品组合";

  return Array.from({ length: batchCount }, (_, index) => {
    const outputType = resolveOutputType(input.outputType, index);
    const combo = getCombo(outputType, index);
    const sellingPoints = getSellingPoints(outputType, category);
    const riskNotes = getRiskNotes(category);
    const productKeywords = getProductKeywords(category, itemDescription, index);
    const imagePrompt = buildImagePrompt({
      ...input,
      audience,
      category,
      itemDescription,
      outputType,
      combo,
      sellingPoints,
    });
    const postTitle = buildPostTitle(outputType, audience, itemDescription, index);
    const copyText = buildCopyText(
      outputType,
      audience,
      category,
      itemDescription,
      combo,
      sellingPoints,
      index,
    );
    const tags = buildTags(outputType, audience, category);
    const label = `${index + 1}. ${audience} / ${getOutputTypeLabel(outputType)}`;
    const copyAll = [
      `【${label}】`,
      "",
      "生图提示词：",
      imagePrompt,
      "",
      "负面词：",
      negativePrompt,
      "",
      "图文标题：",
      postTitle,
      "",
      "正文文案：",
      copyText,
      "",
      "抖音 tags：",
      tags,
      "",
      "选品关键词：",
      productKeywords.join("、"),
      "",
      "卖点话术：",
      sellingPoints.join("；"),
      "",
      "风险提醒：",
      riskNotes.join("；"),
    ].join("\n");

    return {
      id: `snack-grocery-${index + 1}`,
      label,
      outputType,
      imagePrompt,
      negativePrompt,
      postTitle,
      copyText,
      tags,
      productKeywords,
      sellingPoints,
      riskNotes,
      copyAll,
    };
  });
}

function clampBatchCount(batchCount?: number) {
  if (!batchCount || Number.isNaN(batchCount)) {
    return 6;
  }

  return Math.min(Math.max(Math.floor(batchCount), 1), 30);
}

function resolveOutputType(
  outputType: SnackGroceryOutputType | undefined,
  index: number,
): SnackGroceryOutputType {
  if (outputType && outputType !== "auto") {
    return outputType;
  }

  return outputSequence[index % outputSequence.length];
}

function getCombo(outputType: SnackGroceryOutputType, index: number) {
  if (outputType === "rental_goods") {
    return rentalCombos[index % rentalCombos.length];
  }

  if (outputType === "office_snack") {
    return officeCombos[index % officeCombos.length];
  }

  if (outputType === "summer_hot") {
    return summerCombos[index % summerCombos.length];
  }

  return dormCombos[index % dormCombos.length];
}

function getSellingPoints(outputType: SnackGroceryOutputType, category: string) {
  if (outputType === "rental_goods" || /收纳|清洁|厨房|百货/.test(category)) {
    return ["省空间", "复购消耗快", "价格门槛低", "租房/宿舍真实刚需"];
  }

  if (outputType === "office_snack") {
    return ["独立包装", "办公室抽屉能囤", "下午茶/加班场景强", "客单价低容易冲动下单"];
  }

  if (outputType === "summer_hot") {
    return ["暑假应季", "防暑降温场景明确", "适合开学返校前囤", "组合清单更容易收藏"];
  }

  return ["平价组合", "宿舍可囤", "小包装方便分享", "适合低粉图文测款"];
}

function getRiskNotes(category: string) {
  const notes = ["不要承诺夸张功效", "优先选有销量和评价图的商品", "避免明显侵权包装"];

  if (/零食|饮料|速食/.test(category)) {
    notes.unshift("食品类必须检查保质期、生产许可、临期标识和物流破损率");
  } else {
    notes.unshift("百货类重点看尺寸、材质、承重和差评里的破损问题");
  }

  return notes;
}

function getProductKeywords(
  category: string,
  itemDescription: string,
  index: number,
) {
  const base = /零食|饮料|速食/.test(category) ? snackKeywords : groceryKeywords;
  return [
    itemDescription,
    `${category}平价组合`,
    ...base.slice(index % 3, index % 3 + 5),
  ];
}

function buildImagePrompt({
  audience,
  category,
  combo,
  customInstructions,
  customPrompt,
  hasReferenceImages,
  itemDescription,
  outputType,
  sellingPoints,
}: SnackGroceryPromptInput & {
  audience: string;
  category: string;
  combo: string;
  itemDescription: string;
  outputType: SnackGroceryOutputType;
  sellingPoints: string[];
}) {
  const referenceRule = hasReferenceImages
    ? "基于上传商品参考图，保持商品包装、品类、颜色、数量感和主要外观不变，不要生成虚假品牌或夸张功效。"
    : "基于商品主图或商品描述，生成真实可购买的零食百货图文素材。";
  const freePrompt = customPrompt?.trim()
    ? `用户自由提示词：${customPrompt.trim()}。`
    : "";
  const extra = customInstructions?.trim()
    ? `补充要求：${customInstructions.trim()}。`
    : "";
  const base = [
    referenceRule,
    `目标人群：${audience}。品类：${category}。主商品/组合：${itemDescription}。清单组合：${combo}。核心卖点：${sellingPoints.join("、")}。`,
    freePrompt,
    extra,
  ]
    .filter(Boolean)
    .join("\n");

  if (outputType === "dorm_list") {
    return [
      base,
      "生成一张宿舍囤货清单图，画面为大学宿舍桌面或床边收纳场景，商品整齐摆放，真实自然光，干净不杂乱。",
      "封面感要强，适合抖音图文第一张，让用户一眼知道这是宿舍能用、能囤、价格不高的清单。",
    ].join("\n");
  }

  if (outputType === "rental_goods") {
    return [
      base,
      "生成一张租房好物清单图，场景为小厨房、卧室桌面、浴室门口或玄关，突出省空间、收纳、清洁和日常刚需。",
      "画面像真实租房年轻人拍摄，不要精装修样板间，不要豪宅感。",
    ].join("\n");
  }

  if (outputType === "office_snack") {
    return [
      base,
      "生成一张办公室续命零食图，场景为办公桌、抽屉或工位角落，商品为独立包装、低门槛、方便分享的零食饮料。",
      "整体像职场人下午茶/加班囤货分享，干净真实，适合图文带货。",
    ].join("\n");
  }

  if (outputType === "summer_hot") {
    return [
      base,
      "生成一张暑假短期热点清单图，突出防暑降温、返校前囤货、出门随身带和宿舍日常使用。",
      "画面明亮清爽，有夏季感，但不要过度广告海报化。",
    ].join("\n");
  }

  return [
    base,
    "生成一条适合抖音图文起号测试的零食百货清单素材，画面必须有明确使用场景、目标人群、商品组合和可购买感。",
    "重点表达低价、刚需、可囤、能解决具体小问题，适合0粉账号先测点击、收藏、评论。",
  ].join("\n");
}

function buildPostTitle(
  outputType: SnackGroceryOutputType,
  audience: string,
  itemDescription: string,
  index: number,
) {
  const titles: Record<SnackGroceryOutputType, string[]> = {
    auto: [],
    dorm_list: [
      `${audience}宿舍可以囤这几样`,
      `暑假返校前，宿舍囤货先看这套`,
      `${itemDescription}这样组，宿舍真的用得上`,
    ],
    rental_goods: [
      `租房后才知道这些小东西很省事`,
      `${audience}租房别乱买，先备这几类`,
      `${itemDescription}，小房间也能用`,
    ],
    office_snack: [
      `打工人办公室抽屉可以囤这些`,
      `下午犯困时，这些小零食更容易用上`,
      `${audience}加班续命清单`,
    ],
    summer_hot: [
      `暑假这几类小东西可以短期测一波`,
      `天热以后，宿舍和办公室都能用`,
      `${audience}夏季囤货清单`,
    ],
    batch_post: [
      `${audience}零食百货图文起号选题`,
      `0粉先测这类低价刚需清单`,
      `${itemDescription}可以这样做图文`,
    ],
  };

  const pool = titles[outputType].length ? titles[outputType] : titles.batch_post;
  return pool[index % pool.length];
}

function buildCopyText(
  outputType: SnackGroceryOutputType,
  audience: string,
  category: string,
  itemDescription: string,
  combo: string,
  sellingPoints: string[],
  index: number,
) {
  const hooks = [
    "前期先发图文测收藏，不要一上来就囤货。",
    "这种品类重点不是炫酷，而是让人觉得现在就能用上。",
    "低价、独立包装、场景明确，比单纯喊便宜更容易让人点进去。",
    "有数据后再找精选联盟/1688/淘宝联盟相似款，优先看评价图和差评。",
  ];
  const scene =
    outputType === "office_snack"
      ? "办公室/加班"
      : outputType === "rental_goods"
        ? "租房日常"
        : outputType === "summer_hot"
          ? "暑假和返校"
          : "宿舍日常";

  return [
    `${audience}做${category}，可以先从「${itemDescription}」这种低门槛组合切入。`,
    `适合场景：${scene}。`,
    `组合公式：${combo}。`,
    `卖点：${sellingPoints.join("、")}。`,
    hooks[index % hooks.length],
  ].join("\n");
}

function buildTags(
  outputType: SnackGroceryOutputType,
  audience: string,
  category: string,
) {
  const shared = ["#抖音图文", "#好物分享", "#平价好物", "#学生党"];
  const audienceTag = `#${audience}`;
  const categoryTags = /零食|饮料|速食/.test(category)
    ? ["#零食推荐", "#宿舍好物", "#囤货清单"]
    : ["#租房好物", "#百货好物", "#收纳好物"];
  const outputTag =
    outputType === "office_snack"
      ? "#办公室零食"
      : outputType === "summer_hot"
        ? "#暑假好物"
        : outputType === "rental_goods"
          ? "#租房生活"
          : "#宿舍好物";

  return [audienceTag, ...categoryTags, ...shared, outputTag].join(" ");
}

function getOutputTypeLabel(outputType: SnackGroceryOutputType) {
  const labels: Record<SnackGroceryOutputType, string> = {
    auto: "自动组合",
    dorm_list: "宿舍囤货清单",
    rental_goods: "租房好物清单",
    office_snack: "办公室续命零食",
    summer_hot: "暑假短期热点",
    batch_post: "图文起号批量",
  };

  return labels[outputType];
}
