export type OutfitGender = "unisex" | "men" | "women";

export type OutfitOutputType =
  | "auto"
  | "one_piece"
  | "flatlay"
  | "real_outfit"
  | "batch_post";

export type OutfitPromptInput = {
  batchCount?: number;
  gender?: OutfitGender;
  outputType?: OutfitOutputType;
  stylePreset?: string;
  itemDescription?: string;
  category?: string;
  customPrompt?: string;
  customInstructions?: string;
  hasReferenceImages?: boolean;
};

export type OutfitPromptPack = {
  id: string;
  label: string;
  outputType: OutfitOutputType;
  stylePreset: string;
  imagePrompt: string;
  negativePrompt: string;
  postTitle: string;
  copyText: string;
  tags: string;
  productKeywords: string[];
  copyAll: string;
};

const MEN_STYLE_PRESETS = [
  "干净男友风",
  "学生党",
  "实习生通勤",
  "170显高",
  "夏季日常",
  "Cityboy / 日系宽松",
];

const WOMEN_STYLE_PRESETS = [
  "气质通勤",
  "甜妹娃娃领",
  "小个子显高",
  "微胖显瘦",
  "梨形身材",
  "夏日返校",
  "高级感",
];

const UNIVERSAL_STYLE_PRESETS = [
  "夏季日常",
  "学生党",
  "通勤基础款",
  "显高显瘦",
  "低饱和干净感",
];

const OUTPUT_SEQUENCE: OutfitOutputType[] = [
  "real_outfit",
  "one_piece",
  "flatlay",
  "batch_post",
];

const NEGATIVE_PROMPT = [
  "水印",
  "文字",
  "品牌logo",
  "明星脸",
  "过度磨皮",
  "夸张潮牌",
  "奇怪手指",
  "脸部变形",
  "腿部畸形",
  "衣服破损",
  "低清晰度",
  "过度修图",
  "商业大片感",
  "错误文字",
  "主商品变形",
].join("，");

const MEN_FORMULAS = [
  "浅蓝短袖衬衫 + 白T内搭 + 卡其短裤 + 德训鞋",
  "白色基础T + 浅色牛仔裤 + 黑色斜挎包 + 板鞋",
  "灰色亨利领短袖 + 深蓝直筒牛仔裤 + 白袜 + 复古跑鞋",
  "条纹短袖衬衫 + 米白宽松长裤 + 帆布包 + 小白鞋",
  "黑色小logo短袖 + 卡其工装短裤 + 棒球帽 + 凉鞋",
  "薄款防晒衬衫 + 白背心 + 灰色运动短裤 + 低帮鞋",
];

const WOMEN_FORMULAS = [
  "白色短袖衬衫 + 高腰A字裙 + 浅口单鞋 + 托特包",
  "娃娃领上衣 + 牛仔半身裙 + 玛丽珍鞋 + 发夹",
  "针织短袖 + 高腰阔腿裤 + 腋下包 + 低跟鞋",
  "防晒薄外套 + 基础背心 + 直筒半裙 + 帆布鞋",
  "短款T恤 + 高腰牛仔裤 + 棒球帽 + 小白鞋",
  "浅色衬衫裙 + 细腰带 + 单肩包 + 凉鞋",
];

const MEN_KEYWORDS = [
  "男生短袖衬衫",
  "夏季男友风T恤",
  "卡其工装短裤",
  "浅色直筒牛仔裤",
  "德训鞋",
  "黑色斜挎包",
  "170显高穿搭",
  "学生党平价男装",
];

const WOMEN_KEYWORDS = [
  "短袖衬衫女",
  "高腰A字裙",
  "娃娃领上衣",
  "夏季通勤半身裙",
  "小个子显高穿搭",
  "梨形身材阔腿裤",
  "甜妹穿搭",
  "高级感基础款",
];

export function getStylePresetsForGender(gender: OutfitGender): string[] {
  if (gender === "men") {
    return MEN_STYLE_PRESETS;
  }

  if (gender === "women") {
    return WOMEN_STYLE_PRESETS;
  }

  return UNIVERSAL_STYLE_PRESETS;
}

export function buildOutfitPromptBatch(
  input: OutfitPromptInput,
): OutfitPromptPack[] {
  const batchCount = clampBatchCount(input.batchCount);
  const gender = input.gender ?? "unisex";
  const styles = getStylePresetsForGender(gender);
  const itemDescription = input.itemDescription?.trim() || "服装主商品";
  const category = input.category?.trim() || inferCategory(itemDescription);

  return Array.from({ length: batchCount }, (_, index) => {
    const outputType = resolveOutputType(input.outputType, index);
    const stylePreset = input.stylePreset?.trim() || styles[index % styles.length];
    const formula = getFormula(gender, index);
    const productKeywords = getProductKeywords(gender, itemDescription, category, index);
    const imagePrompt = buildImagePrompt({
      ...input,
      outputType,
      gender,
      stylePreset,
      itemDescription,
      category,
      formula,
    });
    const postTitle = buildPostTitle(gender, stylePreset, itemDescription, index);
    const copyText = buildCopyText(gender, stylePreset, itemDescription, formula, index);
    const tags = buildTags(gender, stylePreset, outputType);
    const label = `${index + 1}. ${stylePreset} / ${getOutputTypeLabel(outputType)}`;
    const copyAll = [
      `【${label}】`,
      "",
      "生图提示词：",
      imagePrompt,
      "",
      "负面词：",
      NEGATIVE_PROMPT,
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
    ].join("\n");

    return {
      id: `outfit-${index + 1}`,
      label,
      outputType,
      stylePreset,
      imagePrompt,
      negativePrompt: NEGATIVE_PROMPT,
      postTitle,
      copyText,
      tags,
      productKeywords,
      copyAll,
    };
  });
}

function clampBatchCount(batchCount?: number): number {
  if (!batchCount || Number.isNaN(batchCount)) {
    return 6;
  }

  return Math.min(Math.max(Math.floor(batchCount), 1), 30);
}

function resolveOutputType(
  outputType: OutfitOutputType | undefined,
  index: number,
): OutfitOutputType {
  if (outputType && outputType !== "auto") {
    return outputType;
  }

  return OUTPUT_SEQUENCE[index % OUTPUT_SEQUENCE.length];
}

function inferCategory(itemDescription: string): string {
  if (/裤|短裤|牛仔裤|阔腿裤/.test(itemDescription)) {
    return "裤子";
  }

  if (/裙/.test(itemDescription)) {
    return "裙子";
  }

  if (/外套|防晒|衬衫/.test(itemDescription)) {
    return "外套/衬衫";
  }

  if (/鞋|包|帽/.test(itemDescription)) {
    return "鞋包配饰";
  }

  return "上衣";
}

function getFormula(gender: OutfitGender, index: number): string {
  if (gender === "women") {
    return WOMEN_FORMULAS[index % WOMEN_FORMULAS.length];
  }

  return MEN_FORMULAS[index % MEN_FORMULAS.length];
}

function getProductKeywords(
  gender: OutfitGender,
  itemDescription: string,
  category: string,
  index: number,
): string[] {
  const base = gender === "women" ? WOMEN_KEYWORDS : MEN_KEYWORDS;
  return [
    itemDescription,
    `${category}平价同款`,
    ...base.slice(index % 3, index % 3 + 5),
  ];
}

function buildImagePrompt(
  input: Required<
    Pick<
      OutfitPromptInput,
      "outputType" | "gender" | "stylePreset" | "itemDescription" | "category"
    >
  > &
    OutfitPromptInput & {
      formula: string;
    },
): string {
  const referenceRule = input.hasReferenceImages
    ? "基于上传服装参考图，保持主商品的品类、颜色、版型、材质、图案和主要结构不变，不要改款、换色或改变主商品身份。"
    : "基于服装主商品，保持品类、版型、颜色、材质和穿搭风格统一。";
  const freePrompt = input.customPrompt?.trim()
    ? `用户自由提示词：${input.customPrompt.trim()}。`
    : "";
  const extra = input.customInstructions?.trim()
    ? `补充要求：${input.customInstructions.trim()}。`
    : "";
  const base = [
    referenceRule,
    `主商品：${input.itemDescription}。品类：${input.category}。风格：${input.stylePreset}。搭配公式：${input.formula}。`,
    freePrompt,
    extra,
  ]
    .filter(Boolean)
    .join("\n");

  if (input.outputType === "one_piece") {
    return [
      base,
      "生成一张16:9横版一衣多搭展示图，白色干净背景，展示5套搭配，主商品出现在每套搭配中。",
      "每套下方写中文搭配公式，例如：短袖衬衫 + 卡其短裤 + 板鞋。",
      "左上角标题“一衣多搭展示”，副标题“One-piece Clothing, Multiple Matching Displays”。整体像抖音图文穿搭合集封面，排版清晰，可直接用于起号测试。",
    ].join("\n");
  }

  if (input.outputType === "flatlay") {
    return [
      base,
      "生成一张平铺搭配图，俯拍视角，服装整齐摆放，搭配鞋、包、帽子、袜子或小配饰。",
      "背景使用白色桌面、浅木纹或浅灰布面，画面干净真实，像电商穿搭参考图。",
      "不出现真人、人脸、手部、品牌logo和多余文字，主商品必须清楚完整。",
    ].join("\n");
  }

  if (input.outputType === "real_outfit") {
    const personLine =
      input.gender === "women"
        ? "中国年轻女性，普通女生气质，夏季气质感穿搭，全身照。"
        : "中国年轻男生，普通大学生气质，干净男友风夏季穿搭，全身照。";

    return [
      base,
      personLine,
      "场景为简洁公寓走廊、白墙、电梯厅或校园楼道，低饱和色调，自然站姿，手机拍摄感，真实生活照片风格。",
      "不要明星脸，不要过度修图，不要商业大片灯光，不要水印和文字，突出普通人也能参考的日常穿搭。",
    ].join("\n");
  }

  return [
    base,
    "生成一条适合抖音图文起号测试的穿搭图片提示词，画面必须有明确主商品、完整搭配、真实生活感和可购买感。",
    "优先做低门槛、平价、暑假返校、实习通勤、租房日常可用的视觉表达，封面要让用户一眼知道适合谁、解决什么穿搭问题。",
  ].join("\n");
}

function buildPostTitle(
  gender: OutfitGender,
  stylePreset: string,
  itemDescription: string,
  index: number,
): string {
  const menTitles = [
    `${itemDescription}这样搭，普通男生也有干净男友风`,
    `夏季男生别乱买，先试这套${stylePreset}`,
    `170左右男生照着穿，显高又不油`,
    `学生党男装运营基础款：便宜但不廉价`,
  ];
  const womenTitles = [
    `${itemDescription}这样搭，夏天很有气质感`,
    `女生夏季别乱买，先试这套${stylePreset}`,
    `小个子也能照着穿的显高公式`,
    `普通女生通勤/返校都能穿的一套`,
  ];
  const titles = gender === "women" ? womenTitles : menTitles;

  return titles[index % titles.length];
}

function buildCopyText(
  gender: OutfitGender,
  stylePreset: string,
  itemDescription: string,
  formula: string,
  index: number,
): string {
  const audience =
    gender === "women"
      ? "适合大学生、实习生、刚上班的女生"
      : "适合大学生、实习生、刚上班的男生";
  const hooks = [
    "这套重点不是追潮牌，而是把颜色和版型压干净。",
    "预算不高也能抄，先买能反复搭的基础款。",
    "显高的关键是上短下顺、颜色别太碎。",
    "暑假返校和日常通勤都能用，拍图也比较容易出氛围。",
  ];

  return [
    `${audience}，想做${stylePreset}可以先从「${itemDescription}」切入。`,
    `搭配公式：${formula}。`,
    hooks[index % hooks.length],
    "前期发图文先测点击和收藏，有数据再挂同款/相似款，不要一开始压太多库存。",
  ].join("\n");
}

function buildTags(
  gender: OutfitGender,
  stylePreset: string,
  outputType: OutfitOutputType,
): string {
  const shared = ["#穿搭", "#ootd", "#夏季穿搭", "#平价穿搭"];
  const genderTags =
    gender === "women"
      ? ["#女生穿搭", "#气质穿搭", "#显高穿搭"]
      : ["#男生穿搭", "#男友感穿搭", "#干净穿搭"];
  const outputTag =
    outputType === "flatlay"
      ? "#平铺穿搭"
      : outputType === "one_piece"
        ? "#一衣多搭"
        : "#图文起号";

  return [...genderTags, ...shared, `#${stylePreset.replace(/\s+/g, "")}`, outputTag].join(
    " ",
  );
}

function getOutputTypeLabel(outputType: OutfitOutputType): string {
  const labels: Record<OutfitOutputType, string> = {
    auto: "自动组合",
    one_piece: "一衣多搭展示",
    flatlay: "平铺搭配图",
    real_outfit: "真实穿搭图",
    batch_post: "图文起号批量",
  };

  return labels[outputType];
}
