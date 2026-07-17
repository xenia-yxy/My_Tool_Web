export type PlatformCoverPlatform = "xiaohongshu" | "douyin" | "shipinhao" | "wechat" | "xianyu" | "kuaishou" | "bilibili" | "zhihu" | "taobao";
export type PlatformCoverTextMode = "no_text" | "with_text";
export type PlatformCoverReferenceMode = "style_only" | "layout" | "layout_color" | "layout_color_elements";
export type PlatformCoverTransformation = "optimize" | "recompose" | "replace_background" | "highlight_product";

const platformLabels: Record<PlatformCoverPlatform, string> = {
  douyin: "抖音图文",
  shipinhao: "视频号",
  wechat: "公众号",
  xiaohongshu: "小红书",
  xianyu: "闲鱼",
  kuaishou: "快手图文",
  bilibili: "B 站专栏",
  zhihu: "知乎",
  taobao: "淘宝逛逛",
};

export function getPlatformCoverAspectRatio(platform: PlatformCoverPlatform) {
  if (platform === "xianyu" || platform === "taobao") return "square";
  if (platform === "wechat" || platform === "bilibili" || platform === "zhihu") return "landscape";
  return "portrait";
}

export function getPlatformCoverLabel(platform: PlatformCoverPlatform) {
  return platformLabels[platform];
}

export function buildPlatformCoverDesignPrompt(input: {
  platform: PlatformCoverPlatform;
  coverGoal: string;
  title?: string;
  subtitle?: string;
  visualStyle?: string;
  editInstructions?: string;
  hasStyleReferences: boolean;
  referenceMode?: PlatformCoverReferenceMode;
  textMode: PlatformCoverTextMode;
  transformation?: PlatformCoverTransformation;
}) {
  const platformLabel = platformLabels[input.platform];
  const title = input.title?.trim();
  const subtitle = input.subtitle?.trim();
  const visualStyle = input.visualStyle?.trim() || "清晰、有点击欲、适合信息流浏览";
  const editInstructions = input.editInstructions?.trim() || "在不破坏原图主体的前提下优化封面构图、留白、层次和视觉重点";
  const referenceMode = referenceModeLabels[input.referenceMode || "style_only"];
  const transformation = transformationLabels[input.transformation || "optimize"];
  const referenceRule = input.hasStyleReferences
    ? `第 2 张及之后是风格参考图。参考图复刻范围：${referenceMode}。不得复制参考图中的人物、商品、品牌或具体文案。`
    : "没有参考图时，根据平台、封面目标和用户说明直接设计封面视觉。";
  const textRule = input.textMode === "with_text"
    ? [
        "可以尝试生成封面文字，但文字必须只包含用户提供的标题和副标题，不要新增无关字。",
        `标题：${title || "无"}`,
        `副标题：${subtitle || "无"}`,
        "文字必须清晰、少字、无错别字；如果无法保证文字准确，请只保留干净标题区。",
      ].join("\n")
    : [
        `标题文案仅作为构图参考：${title || "未填写"}`,
        subtitle ? `副标题文案仅作为构图参考：${subtitle}` : "",
        "不要出现任何文字、标题、价格、标签、logo、水印、按钮、账号或说明，只生成干净封面底图。",
      ].filter(Boolean).join("\n");

  return [
    "你是平台封面视觉设计师，任务是把用户上传的封面原图改造成更适合发布的平台封面。",
    `目标平台：${platformLabel}`,
    `封面目标：${input.coverGoal.trim() || "平台封面"}`,
    "图片顺序：第 1 张是封面原图，是主体和构图基础。",
    "必须保留封面原图的主体、商品、人物、脸部、关键构图和真实质感，不得替换主体，不得把参考图主体覆盖到原图上。",
    referenceRule,
    `视觉风格：${visualStyle}`,
    `改造方式：${transformation}。`,
    `改造说明：${editInstructions}`,
    "设计要求：强化第一眼识别度，留出清晰标题区，层级明确，颜色干净，适合手机信息流缩略图浏览。",
    "真实感要求：保持原图自然透视、光影和材质，不要生成畸形人物、错乱手指、过度磨皮、廉价模板感或杂乱背景。",
    textRule,
  ].join("\n");
}

const referenceModeLabels: Record<PlatformCoverReferenceMode, string> = {
  style_only: "只学习整体风格与视觉情绪",
  layout: "复刻版式、标题区位置和视觉层级",
  layout_color: "复刻版式、配色和视觉层级",
  layout_color_elements: "复刻版式、配色和装饰元素",
};

const transformationLabels: Record<PlatformCoverTransformation, string> = {
  optimize: "保留原主体，优化点击感、留白和视觉重点",
  recompose: "重新组织版式，保留原图主体与核心信息",
  replace_background: "保留主体，替换或简化背景并强化场景表达",
  highlight_product: "突出商品或人物，压低无关背景信息",
};
