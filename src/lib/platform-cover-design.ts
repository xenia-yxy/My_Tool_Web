export type PlatformCoverPlatform = "xiaohongshu" | "douyin" | "shipinhao" | "wechat" | "xianyu";
export type PlatformCoverTextMode = "no_text" | "with_text";

const platformLabels: Record<PlatformCoverPlatform, string> = {
  douyin: "抖音图文",
  shipinhao: "视频号",
  wechat: "公众号",
  xiaohongshu: "小红书",
  xianyu: "闲鱼",
};

export function getPlatformCoverAspectRatio(platform: PlatformCoverPlatform) {
  if (platform === "xianyu") return "square";
  if (platform === "wechat") return "landscape";
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
  textMode: PlatformCoverTextMode;
}) {
  const platformLabel = platformLabels[input.platform];
  const title = input.title?.trim();
  const subtitle = input.subtitle?.trim();
  const visualStyle = input.visualStyle?.trim() || "清晰、有点击欲、适合信息流浏览";
  const editInstructions = input.editInstructions?.trim() || "在不破坏原图主体的前提下优化封面构图、留白、层次和视觉重点";
  const referenceRule = input.hasStyleReferences
    ? "第 2 张及之后是风格参考图。参考图只用于学习版式、色彩、装饰元素和视觉层级，不得复制参考图中的人物、商品、品牌或具体文案。"
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
    `改造说明：${editInstructions}`,
    "设计要求：强化第一眼识别度，留出清晰标题区，层级明确，颜色干净，适合手机信息流缩略图浏览。",
    "真实感要求：保持原图自然透视、光影和材质，不要生成畸形人物、错乱手指、过度磨皮、廉价模板感或杂乱背景。",
    textRule,
  ].join("\n");
}
