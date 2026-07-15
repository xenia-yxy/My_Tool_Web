export type DigitalProductType =
  | "ai-cover"
  | "ecommerce-agent"
  | "commerce-image"
  | "study-navigation";

export type DigitalProductTargetPlatform = "xianyu" | "xiaohongshu" | "wechat" | "douyin";

export type DigitalProductPriceTier = "starter" | "standard" | "premium";

export type DigitalProductDeliveryFormat =
  | "markdown-excel-pdf"
  | "markdown-only"
  | "excel-pdf";

export type DigitalProductPackInput = {
  productType: DigitalProductType;
  targetPlatform: DigitalProductTargetPlatform;
  audience?: string;
  niche?: string;
  priceTier: DigitalProductPriceTier;
  deliveryFormat: DigitalProductDeliveryFormat;
  includesAgentWorkflow: boolean;
  includesImageWorkflow: boolean;
};

export type DigitalProductPackFile = {
  name: string;
  purpose: string;
};

export type DigitalProductPackOutput = {
  productType: DigitalProductType;
  productLabel: string;
  targetPlatform: DigitalProductTargetPlatform;
  audience: string;
  niche: string;
  price: {
    label: string;
    value: string;
    positioning: string;
  };
  fileStructure: DigitalProductPackFile[];
  titleCandidates: string[];
  detailPage: string;
  sellerScript: string;
  deliveryChecklist: string[];
  sourceChecklist: string[];
  riskNotes: string[];
  nextIterationIdeas: string[];
};

type PresetOption<T extends string> = {
  label: string;
  value: T;
  description: string;
};

const productTypeOptions: PresetOption<DigitalProductType>[] = [
  {
    label: "AI 封面提示词",
    value: "ai-cover",
    description: "小红书、公众号、电商主图和商品图提示词资料包。",
  },
  {
    label: "电商 Agent",
    value: "ecommerce-agent",
    description: "客服、标题、详情页、售后和直播脚本智能体资料包。",
  },
  {
    label: "电商主图工作流",
    value: "commerce-image",
    description: "商品换背景、产品摄影、主图风格和发布检查资料包。",
  },
  {
    label: "公开课/备考导航",
    value: "study-navigation",
    description: "官方入口、学习计划、错题本和公开课导航资料包。",
  },
];

const targetPlatformOptions: PresetOption<DigitalProductTargetPlatform>[] = [
  { label: "闲鱼", value: "xianyu", description: "低客单资料包和虚拟资料交付。" },
  { label: "小红书", value: "xiaohongshu", description: "种草笔记、资料引流和封面内容。" },
  { label: "公众号", value: "wechat", description: "长文资料、知识库和领取页。" },
  { label: "抖音", value: "douyin", description: "短视频脚本、直播话术和商品素材。" },
];

const priceTierOptions: PresetOption<DigitalProductPriceTier>[] = [
  { label: "引流版", value: "starter", description: "9.9 元，测试需求和关键词。" },
  { label: "标准版", value: "standard", description: "19.9 元，主推成交版本。" },
  { label: "升级版", value: "premium", description: "39.9 元，加入工作流和模板。" },
];

const deliveryFormatOptions: PresetOption<DigitalProductDeliveryFormat>[] = [
  { label: "Markdown + Excel + PDF", value: "markdown-excel-pdf", description: "最完整，适合闲鱼交付。" },
  { label: "Markdown", value: "markdown-only", description: "最快制作，适合提示词包。" },
  { label: "Excel + PDF", value: "excel-pdf", description: "适合清单、表格和办事指南。" },
];

const priceMap: Record<DigitalProductPriceTier, DigitalProductPackOutput["price"]> = {
  starter: {
    label: "引流版",
    value: "9.9 元",
    positioning: "只放核心提示词和使用说明，用来验证搜索词、收藏和咨询。",
  },
  standard: {
    label: "标准版",
    value: "19.9 元",
    positioning: "包含提示词、目录、示例、来源记录和客服话术，适合作为主推款。",
  },
  premium: {
    label: "升级版",
    value: "39.9 元",
    positioning: "加入 Agent 工作流、知识库模板、案例拆解和复盘表，提高客单价。",
  },
};

const productLabels: Record<DigitalProductType, string> = {
  "ai-cover": "AI 封面提示词资料包",
  "ecommerce-agent": "电商 Agent 工作流资料包",
  "commerce-image": "电商主图工作流资料包",
  "study-navigation": "公开课/备考导航资料包",
};

export function getDigitalProductPackPresets() {
  return {
    productTypes: productTypeOptions,
    targetPlatforms: targetPlatformOptions,
    priceTiers: priceTierOptions,
    deliveryFormats: deliveryFormatOptions,
  };
}

export function buildDigitalProductPack(input: DigitalProductPackInput): DigitalProductPackOutput {
  const productLabel = productLabels[input.productType];
  const audience = normalizeText(input.audience, defaultAudience(input.productType));
  const niche = normalizeText(input.niche, defaultNiche(input.productType));
  const fileStructure = buildFileStructure(input);
  const titleCandidates = buildTitleCandidates(input, productLabel, audience, niche);

  return {
    productType: input.productType,
    productLabel,
    targetPlatform: input.targetPlatform,
    audience,
    niche,
    price: priceMap[input.priceTier],
    fileStructure,
    titleCandidates,
    detailPage: buildDetailPage(input, productLabel, audience, niche, fileStructure),
    sellerScript: buildSellerScript(productLabel),
    deliveryChecklist: buildDeliveryChecklist(input),
    sourceChecklist: buildSourceChecklist(input.productType),
    riskNotes: buildRiskNotes(input),
    nextIterationIdeas: buildNextIterationIdeas(input.productType),
  };
}

function normalizeText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function defaultAudience(productType: DigitalProductType) {
  if (productType === "ecommerce-agent") return "淘宝、抖店、小红书和闲鱼卖家";
  if (productType === "study-navigation") return "备考用户、自学用户和资料整理需求用户";
  return "小红书博主、公众号作者和电商卖家";
}

function defaultNiche(productType: DigitalProductType) {
  if (productType === "ecommerce-agent") return "商品标题、客服、售后和详情页";
  if (productType === "commerce-image") return "电商主图、商品换背景和产品摄影";
  if (productType === "study-navigation") return "官方入口、公开课、学习计划和错题本";
  return "小红书封面、公众号封面和电商主图";
}

function buildFileStructure(input: DigitalProductPackInput): DigitalProductPackFile[] {
  const files: DigitalProductPackFile[] = [
    { name: "01_资料目录.md", purpose: "说明资料包内容、适用人群和使用顺序。" },
    { name: "02_使用说明.md", purpose: "告诉买家如何复制、替换变量和测试效果。" },
  ];

  if (input.productType === "ai-cover") {
    files.push(
      { name: "03_AI封面提示词总表.xlsx", purpose: "按平台、风格、场景整理提示词。" },
      { name: "04_小红书封面提示词.md", purpose: "输出小红书封面图和标题方向。" },
      { name: "05_公众号封面提示词.md", purpose: "输出公众号首图和文章配图方向。" },
      { name: "06_电商主图提示词.md", purpose: "输出商品主图、卖点图和背景替换方向。" },
    );
  }

  if (input.productType === "ecommerce-agent") {
    files.push(
      { name: "03_电商客服Agent角色提示词.md", purpose: "定义客服智能体的身份、边界和回复格式。" },
      { name: "04_商品标题生成Agent.md", purpose: "生成搜索友好的商品标题。" },
      { name: "05_详情页文案Agent.md", purpose: "生成卖点、参数、场景和购买理由。" },
      { name: "06_商品知识库模板.xlsx", purpose: "沉淀 SKU、卖点、物流和售后信息。" },
      { name: "07_Dify或扣子搭建流程.pdf", purpose: "让小白按步骤搭建智能体。" },
    );
  }

  if (input.productType === "commerce-image") {
    files.push(
      { name: "03_电商主图提示词.md", purpose: "生成商品主图、白底图和场景图。" },
      { name: "04_商品换背景工作流说明.pdf", purpose: "说明参考图上传、背景替换和输出比例。" },
      { name: "05_产品摄影风格词库.xlsx", purpose: "整理光线、镜头、材质和场景关键词。" },
    );
  }

  if (input.productType === "study-navigation") {
    files.push(
      { name: "03_官方入口导航表.xlsx", purpose: "记录官网、公开课、考试大纲和查询入口。" },
      { name: "04_30天学习计划表.xlsx", purpose: "按阶段安排学习、复习和模拟练习。" },
      { name: "05_错题本模板.xlsx", purpose: "记录错题、原因、知识点和复盘时间。" },
    );
  }

  if (input.includesAgentWorkflow && input.productType !== "ecommerce-agent") {
    files.push({ name: "08_电商客服Agent提示词.md", purpose: "作为升级内容，帮助买家生成标题、客服和售后回复。" });
  }

  if (input.includesImageWorkflow && input.productType !== "commerce-image") {
    files.push({ name: "09_AI图片工作流说明.pdf", purpose: "说明即梦、豆包、可画或 ComfyUI 的使用流程。" });
  }

  files.push(
    { name: "98_常见问题FAQ.md", purpose: "减少售后重复提问。" },
    { name: "99_来源链接与更新时间.txt", purpose: "记录公开来源、访问时间和授权备注。" },
  );

  return files;
}

function buildTitleCandidates(
  input: DigitalProductPackInput,
  productLabel: string,
  audience: string,
  niche: string,
) {
  const platformPrefix = input.targetPlatform === "xianyu" ? "闲鱼可发" : "内容运营";
  const titles = [
    `${productLabel} ${niche} 可复制模板资料包`,
    `${platformPrefix} ${niche} 提示词 工作流 使用教程`,
    `${audience}专用 ${productLabel} 目录清单和话术`,
    `AI封面 电商主图 Agent提示词 资料包 可编辑`,
    `${niche} 新手资料包 标题详情页客服话术`,
  ];

  if (input.includesAgentWorkflow) {
    titles.push(`Dify扣子电商Agent提示词 ${niche} 搭建资料包`);
  }
  if (input.includesImageWorkflow) {
    titles.push(`AI图片工作流 商品图封面图生成提示词资料包`);
  }

  return titles;
}

function buildDetailPage(
  input: DigitalProductPackInput,
  productLabel: string,
  audience: string,
  niche: string,
  files: DigitalProductPackFile[],
) {
  const fileLines = files.slice(0, 8).map((file, index) => `${index + 1}. ${file.name}：${file.purpose}`);

  return [
    `适合人群：\n${audience}。`,
    `资料方向：\n${productLabel}，聚焦 ${niche}。`,
    `资料包含：\n${fileLines.join("\n")}`,
    `文件格式：\n${formatLabel(input.deliveryFormat)}，可复制、可编辑、可按自己的商品和场景替换变量。`,
    "使用方式：\n复制提示词或模板内容到 DeepSeek、豆包、即梦、可画、Dify、扣子等工具中，根据自己的商品、平台和目标人群修改变量后使用。",
    "资料说明：\n本资料为整理制作版本，不包含盗版课程、破解工具、付费资源搬运或机构内部资料。",
    "售后说明：\n文件打不开可补发；AI 生成效果受工具、模型、输入素材和参数影响，不承诺每次结果完全一致。",
  ].join("\n\n");
}

function formatLabel(format: DigitalProductDeliveryFormat) {
  return deliveryFormatOptions.find((item) => item.value === format)?.label ?? format;
}

function buildSellerScript(productLabel: string) {
  return [
    `您好，这个是 ${productLabel}，拍下后通过闲鱼聊天发送资料链接。`,
    "里面包含可复制提示词、资料目录、使用说明和来源记录，拿到后按说明替换变量即可使用。",
    "资料类文件发出后，如非文件损坏或链接失效，一般不支持无理由退款，具体以平台规则为准。",
  ].join("\n");
}

function buildDeliveryChecklist(input: DigitalProductPackInput) {
  const checklist = [
    "确认资料包压缩文件可正常打开",
    "确认资料目录和使用说明在第一层目录",
    "确认来源链接与更新时间已填写",
    "确认详情页写明文件格式和售后范围",
    "确认没有盗版课程、破解工具、机构内部资料和未授权文件",
  ];

  if (input.includesAgentWorkflow) {
    checklist.push("确认 Agent 提示词包含角色、任务、输入、输出格式和边界限制");
  }
  if (input.includesImageWorkflow) {
    checklist.push("确认图片工作流提示词写明比例、风格、参考图和不要生成文字");
  }

  return checklist;
}

function buildSourceChecklist(productType: DigitalProductType) {
  if (productType === "ecommerce-agent") {
    return [
      "Dify Marketplace 模板和官方文档",
      "扣子 Coze Agent 商店和官方说明",
      "宝玉 AI / Agent 相关文章和开源 Skills",
      "电商平台公开规则、客服 FAQ 和商品详情页案例",
    ];
  }

  if (productType === "commerce-image") {
    return [
      "ComfyUI 公开教程和开源工作流说明",
      "LiblibAI、优设等公开教程",
      "GitHub product-photography 相关开源项目",
      "即梦、豆包、可画等工具的公开使用说明",
    ];
  }

  if (productType === "study-navigation") {
    return [
      "中国教育考试网等官方入口",
      "国家智慧教育公共服务平台",
      "中国大学 MOOC 等公开课平台",
      "公开考试大纲、报名说明和成绩查询入口",
    ];
  }

  return [
    "归藏 AI 资讯和提示词思路",
    "LangGPT、wonderful-prompts 等中文提示词库",
    "Dify、扣子公开模板和 Agent 案例",
    "小红书、公众号、电商平台公开内容案例",
  ];
}

function buildRiskNotes(input: DigitalProductPackInput) {
  const notes = [
    "不要直接搬运别人付费提示词包、课程视频、工作流文件或电子书。",
    "不要使用内部资料、押题包、破解工具、账号共享等高风险内容。",
    "没有明确 License 的开源内容只学习结构和思路，不要原文售卖。",
    "详情页要写明资料为整理制作版本，不承诺 AI 生成效果完全一致。",
  ];

  if (input.targetPlatform === "xianyu") {
    notes.push("闲鱼标题避免使用内部、破解、包过、押题、盗版、全网最全等高风险词。");
  }

  return notes;
}

function buildNextIterationIdeas(productType: DigitalProductType) {
  if (productType === "ecommerce-agent") {
    return ["增加差评回复 Agent", "增加直播脚本 Agent", "增加客服知识库示例", "增加 Dify 导入版提示词"];
  }
  if (productType === "commerce-image") {
    return ["增加白底图版本", "增加服装模特图版本", "增加食品主图版本", "增加案例前后对比图"];
  }
  if (productType === "study-navigation") {
    return ["增加城市/考试细分版", "增加 7 天冲刺计划", "增加错题复盘模板", "增加公开课学习路径"];
  }
  return ["增加 20 种封面风格", "增加公众号首图版", "增加电商主图版", "增加 Agent 升级包"];
}
