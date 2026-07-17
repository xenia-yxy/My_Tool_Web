export type PromptPreviewInput = {
  mode: "custom" | "outfit";
  description?: string;
  purpose?: string;
  style?: string;
  category?: string;
  scene?: string;
  outfitModelMode?: string;
  outfitModelGender?: string;
  outfitModelFace?: string;
  hasReferenceImages?: boolean;
};

export type IpPromptPreviewInput = {
  projectName?: string | null;
  projectDescription?: string | null;
  brandTone?: string | null;
  conceptStatement?: string | null;
  targetAudience?: string | null;
  personality?: string | null;
  visualAnchors?: string | null;
  avoidDirections?: string | null;
  scenario?: string | null;
  ipType: "person" | "product" | "content";
  outputGoal:
    | "prototype"
    | "refine"
    | "character-sheet"
    | "avatar"
    | "cover"
    | "poster"
    | "series";
  prompt?: string;
  styleText?: string | null;
  hasDraftImage: boolean;
  hasStyleImage: boolean;
};

const noTextRule =
  "图片中不要出现任何文字、标题、价格、标签、logo、水印、按钮或说明。只生成画面本身。";

const ipTypeLabels: Record<IpPromptPreviewInput["ipType"], string> = {
  person: "人物 IP",
  product: "产品 IP",
  content: "内容 IP",
};

const outputGoalLabels: Record<IpPromptPreviewInput["outputGoal"], string> = {
  prototype: "原型图",
  refine: "精修图",
  "character-sheet": "设定图",
  avatar: "头像",
  cover: "封面",
  poster: "海报",
  series: "系列图",
};

export function withNoTextImageRule(description: string) {
  return [description.trim(), noTextRule].filter(Boolean).join("\n");
}

export function buildImageGenerationSessionOutput(input: {
  jobId: string;
  imageUrls: string[];
  title: string;
}) {
  return {
    jobId: input.jobId,
    imageUrl: input.imageUrls[0] || "",
    imageUrls: input.imageUrls,
    summary: `${input.title}已生成 ${input.imageUrls.length} 张图片。`,
  };
}

export function resolveImageWorkbenchToolId(sourceTool: string | null | undefined) {
  switch (sourceTool) {
    case "menswear":
      return "menswear";
    case "menswear-style-reference":
      return "menswear-style-reference";
    case "menswear-multi-outfit":
      return "menswear-multi-outfit";
    case "menswear-single-outfit":
      return "menswear-single-outfit";
    case "platform-cover-design":
      return "platform-cover-design";
    case "womenswear":
      return "womenswear";
    case "outfit":
      return "outfit-image";
    case "snack-grocery":
      return "snack-grocery";
    case "social-commerce":
      return "social-commerce";
    case "ip-factory":
      return "ip-factory";
    default:
      return "ai-image";
  }
}

export function buildAiPromptPreview(input: PromptPreviewInput) {
  if (input.mode === "outfit") {
    return [
      "请生成一张用于服装测试的图片。",
      input.hasReferenceImages
        ? "基于上传服装参考图生成，保持主商品的颜色、版型、材质、图案和主要结构，不要改款、换色或替换主商品。"
        : "没有参考图时，根据文字描述生成服装画面。",
      `用户描述：${input.description?.trim() || "生成一衣多搭展示图"}`,
      `品类：${input.category?.trim() || "服装"}`,
      `使用场景：${input.scene?.trim() || "图文测试"}`,
      `展示方式：${modelModeLabel(input.outfitModelMode)}`,
      input.outfitModelMode && input.outfitModelMode !== "flatlay"
        ? `模特要求：${modelGenderLabel(input.outfitModelGender)}，${modelFaceLabel(input.outfitModelFace)}`
        : "模特要求：无模特平铺展示",
      noTextRule,
    ].join("\n");
  }

  return [
    "请根据用户描述生成一张高质量图片。",
    input.hasReferenceImages
      ? "基于上传参考图进行编辑生成，保留参考图里用户明确需要保留的主体、构图、材质、颜色和关键视觉元素；按用户描述修改，不要无关重绘。"
      : "没有参考图时，直接按文字描述生成。",
    `用户描述：${input.description?.trim() || "请填写生图描述"}`,
    input.purpose?.trim() ? `用途：${input.purpose.trim()}` : "",
    input.style?.trim() ? `风格：${input.style.trim()}` : "",
    noTextRule,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildIpPromptPreview(input: IpPromptPreviewInput) {
  return [
    "你是个人 IP 原型设计师，任务是把用户还没完全成型的想法先变成一张可继续修改的视觉原型。",
    "",
    "项目基础：",
    `项目：${input.projectName?.trim() || "未命名 IP 项目"}`,
    `类型：${ipTypeLabels[input.ipType]}`,
    `输出目标：${outputGoalLabels[input.outputGoal]}`,
    input.projectDescription?.trim()
      ? `项目描述：${input.projectDescription.trim()}`
      : "",
    input.brandTone?.trim() ? `整体气质：${input.brandTone.trim()}` : "",
    hasIpConcept(input)
      ? [
          "",
          "IP 立意定义：",
          input.conceptStatement?.trim()
            ? `立意：${input.conceptStatement.trim()}`
            : "",
          input.targetAudience?.trim()
            ? `目标用户：${input.targetAudience.trim()}`
            : "",
          input.personality?.trim() ? `性格：${input.personality.trim()}` : "",
          input.visualAnchors?.trim()
            ? `视觉锚点：${input.visualAnchors.trim()}`
            : "",
          input.avoidDirections?.trim()
            ? `避免方向：${input.avoidDirections.trim()}`
            : "",
          input.scenario?.trim() ? `应用场景：${input.scenario.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    "",
    "用户当前想法：",
    input.prompt?.trim() || "请填写当前想法",
    "",
    "参考资料：",
    input.hasDraftImage
      ? "参考用户上传的草稿图，保留核心构图、主体关系和原始想法。"
      : "没有草稿图，请根据文字直接建立第一版原型。",
    input.hasStyleImage
      ? "参考用户上传的风格图，提取色彩、质感、镜头语言和视觉情绪，但不要直接复制图中主体。"
      : "没有风格参考图，请根据风格描述建立视觉方向。",
    input.styleText?.trim() ? `风格描述：${input.styleText.trim()}` : "",
    "",
    "输出要求：主体明确，构图干净，有可继续迭代的设计余量；不要生成水印、错误文字、畸形结构和杂乱背景。",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function hasIpConcept(input: IpPromptPreviewInput) {
  return Boolean(
    input.conceptStatement?.trim() ||
      input.targetAudience?.trim() ||
      input.personality?.trim() ||
      input.visualAnchors?.trim() ||
      input.avoidDirections?.trim() ||
      input.scenario?.trim(),
  );
}

function modelModeLabel(value?: string) {
  const labels: Record<string, string> = {
    flatlay: "无模特平铺",
    half_body: "半身模特",
    full_body: "全身模特",
  };
  return labels[value || ""] || "无模特平铺";
}

function modelGenderLabel(value?: string) {
  const labels: Record<string, string> = {
    unspecified: "性别不限",
    female: "女模特",
    male: "男模特",
  };
  return labels[value || ""] || "性别不限";
}

function modelFaceLabel(value?: string) {
  return value === "show_face" ? "露脸" : "不露脸";
}
