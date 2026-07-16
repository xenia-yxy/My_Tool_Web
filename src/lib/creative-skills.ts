export const creativeSkillExecutorKeys = [
  "menswear-generate",
  "menswear-style-reference",
  "menswear-multi-outfit",
  "platform-cover-design",
  "ip-derivative-factory",
  "menswear-model-generate",
  "menswear-material-extract",
  "hotspot-research",
] as const;

export type CreativeSkillExecutorKey = (typeof creativeSkillExecutorKeys)[number];

export const creativeSkillInputTypes = [
  "text",
  "image",
  "images",
  "select",
  "multi-select",
  "number",
  "toggle",
] as const;

export type CreativeSkillInputType = (typeof creativeSkillInputTypes)[number];

export type CreativeSkillInput = {
  key: string;
  type: CreativeSkillInputType;
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean | string[];
};

export type CreativeSkillDraft = {
  name: string;
  description: string;
  category: string;
  executorKey: CreativeSkillExecutorKey;
  inputs: CreativeSkillInput[];
  promptTemplate: string;
  negativePrompt: string;
  agentInstructions: string;
};

export type SystemCreativeSkill = CreativeSkillDraft & {
  id: string;
  ownerType: "SYSTEM";
};

const maxTextLength = 30_000;
const inputKeyPattern = /^[a-z][a-z0-9_]*$/i;

const systemCreativeSkills: readonly SystemCreativeSkill[] = [
  createSystemSkill({
    id: "system-menswear-generate",
    name: "男装视觉生成",
    description: "根据服装主体、模特与场景生成真实的男装视觉图。",
    category: "服装创作",
    executorKey: "menswear-generate",
    inputs: [
      imageInput("product", "服装主体图", true),
      selectInput("aspect_ratio", "图片比例", ["3:4", "4:5", "1:1", "9:16"], "3:4"),
      textInput("creative_brief", "创作要求", true),
    ],
    promptTemplate: "以 {product} 为服装主体。创作要求：{creative_brief}。图片比例：{aspect_ratio}。",
    negativePrompt: "不要改动服装颜色、版型、Logo、图案和材质。不要文字、水印或价格标签。",
    agentInstructions: "用户希望基于服装主体生成真实男装视觉图时使用。",
  }),
  createSystemSkill({
    id: "system-menswear-style-reference",
    name: "男装风格参考",
    description: "保持服装细节，借用参考图的构图、镜头、光线与氛围。",
    category: "服装创作",
    executorKey: "menswear-style-reference",
    inputs: [
      imageInput("product", "服装主体图", true),
      imageInput("style_reference", "风格参考图", true),
      textInput("preserve", "需要保留的内容", false),
    ],
    promptTemplate: "保持 {product} 的真实细节，参考 {style_reference} 的视觉风格。需要保留：{preserve}。",
    negativePrompt: "不复制参考图的商品、人物身份或文字，不改变主体服装。",
    agentInstructions: "用户明确给出服装图与风格参考图时使用。",
  }),
  createSystemSkill({
    id: "system-menswear-multi-outfit",
    name: "一衣多搭",
    description: "围绕一件或多件服装主体生成按季节、场景与模特展示方式区分的搭配。",
    category: "服装创作",
    executorKey: "menswear-multi-outfit",
    inputs: [
      imageInput("product", "服装主体图", true),
      selectInput("season", "季节", ["春季", "夏季", "秋季", "冬季"], "秋季"),
      selectInput("display", "展示方式", ["无模特平铺", "有模特上身"], "有模特上身"),
      textInput("occasion", "使用场景", false),
    ],
    promptTemplate: "以 {product} 为主体，生成 {season}{occasion} 的一衣多搭，采用 {display}。",
    negativePrompt: "保持主体商品真实，不生成文字、水印或不相关商品。",
    agentInstructions: "用户提出一件衣服多种搭配、季节搭配或平铺与上身对比时使用。",
  }),
  createSystemSkill({
    id: "system-platform-cover-design",
    name: "平台封面设计",
    description: "依据原图和可选参考图生成适合内容平台发布的封面视觉。",
    category: "内容创作",
    executorKey: "platform-cover-design",
    inputs: [
      imageInput("cover_source", "封面原图", true),
      imageInput("style_reference", "风格参考图", false),
      selectInput("platform", "发布平台", ["小红书", "抖音图文", "视频号", "公众号", "闲鱼"], "小红书"),
      textInput("cover_brief", "封面要求", false),
    ],
    promptTemplate: "以 {cover_source} 为封面主体，为 {platform} 设计封面。参考 {style_reference}。要求：{cover_brief}。",
    negativePrompt: "保持原图主体清晰，避免无关文字与水印。",
    agentInstructions: "用户需要小红书等内容平台封面时使用。",
  }),
  createSystemSkill({
    id: "system-ip-derivative-factory",
    name: "IP 衍生工厂",
    description: "将 IP 原型延展为动作、换装、表情、装饰或场景输出。",
    category: "IP 创作",
    executorKey: "ip-derivative-factory",
    inputs: [
      imageInput("ip_source", "IP 主图", true),
      selectInput("derivative_type", "衍生类型", ["动作姿势", "换装", "表情包", "装饰配件", "场景海报"], "动作姿势"),
      imageInput("reference", "参考图", false),
      textInput("creative_brief", "创作要求", false),
    ],
    promptTemplate: "以 {ip_source} 为唯一 IP 原型，生成 {derivative_type}。参考 {reference}。要求：{creative_brief}。",
    negativePrompt: "保持 IP 核心身份、脸部特征和主色识别，不加入文字或水印。",
    agentInstructions: "用户想让已有 IP 换装、做动作、表情包、配件或场景延展时使用。",
  }),
  createSystemSkill({
    id: "system-menswear-model-generate",
    name: "模特生成",
    description: "根据脸部、身材和可选参考图建立可复用的模特视觉。",
    category: "模特与素材",
    executorKey: "menswear-model-generate",
    inputs: [
      imageInput("face_reference", "脸部参考图", false),
      imageInput("body_reference", "身材参考图", false),
      textInput("model_description", "模特描述", true),
    ],
    promptTemplate: "生成可复用模特。脸部参考：{face_reference}。身材参考：{body_reference}。描述：{model_description}。",
    negativePrompt: "不混合多个人脸，不生成文字、水印或夸张肢体。",
    agentInstructions: "用户要创建或补全模特脸部、身材、档案参考时使用。",
  }),
  createSystemSkill({
    id: "system-menswear-material-extract",
    name: "素材提取与入库",
    description: "从上传图中提取指定区域并存储为可复用公共素材。",
    category: "模特与素材",
    executorKey: "menswear-material-extract",
    inputs: [
      imageInput("source_image", "原始图片", true),
      textInput("target_area", "需要提取的内容", true),
      selectInput("material_category", "素材分类", ["服装", "模特脸部", "模特身体", "姿势", "背景", "构图", "道具"], "服装"),
    ],
    promptTemplate: "从 {source_image} 中提取 {target_area}，归类为 {material_category} 素材并保存。",
    negativePrompt: "只保留用户指定区域，不捏造不可见细节。",
    agentInstructions: "用户希望把图片某个部分裁取、识别或保存为素材时使用。",
  }),
  createSystemSkill({
    id: "system-hotspot-research",
    name: "热点查询与内容灵感",
    description: "围绕主题检索热点并生成可执行的内容创作方向。",
    category: "内容创作",
    executorKey: "hotspot-research",
    inputs: [
      textInput("topic", "主题", true),
      selectInput("platform", "平台", ["小红书", "抖音", "全平台"], "全平台"),
    ],
    promptTemplate: "查询 {platform} 上与 {topic} 相关的热点，并给出创作方向。",
    negativePrompt: "不编造实时数据或不存在的来源。",
    agentInstructions: "用户需要选题、热点、内容方向或趋势参考时使用。",
  }),
];

export function getSystemCreativeSkills() {
  return systemCreativeSkills.map((skill) => ({
    ...skill,
    inputs: skill.inputs.map((input) => ({
      ...input,
      options: input.options ? [...input.options] : undefined,
      defaultValue: Array.isArray(input.defaultValue) ? [...input.defaultValue] : input.defaultValue,
    })),
  }));
}

export function normalizeCreativeSkillDraft(value: unknown): CreativeSkillDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Skill 配置格式不正确");
  }

  const source = value as Record<string, unknown>;
  const name = normalizeRequiredText(source.name, "Skill 名称", 160);
  const executorKey = normalizeExecutorKey(source.executorKey);
  const promptTemplate = normalizeText(source.promptTemplate, maxTextLength);

  if (!promptTemplate) {
    throw new Error("提示词模板不能为空");
  }

  return {
    name,
    description: normalizeText(source.description, 1_000),
    category: normalizeText(source.category, 120) || "自定义",
    executorKey,
    inputs: normalizeInputs(source.inputs),
    promptTemplate,
    negativePrompt: normalizeText(source.negativePrompt, maxTextLength),
    agentInstructions: normalizeText(source.agentInstructions, 4_000),
  };
}

export function buildSkillPrompt(skill: CreativeSkillDraft, values: Record<string, unknown>) {
  const declaredKeys = new Set(skill.inputs.map((input) => input.key));

  return skill.promptTemplate.replace(/\{([a-z][a-z0-9_]*)\}/gi, (placeholder, key: string) => {
    if (!declaredKeys.has(key)) return placeholder;
    const value = values[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : placeholder;
  });
}

function createSystemSkill(skill: Omit<SystemCreativeSkill, "ownerType">): SystemCreativeSkill {
  return { ...skill, ownerType: "SYSTEM" };
}

function imageInput(key: string, label: string, required: boolean): CreativeSkillInput {
  return { key, label, required, type: "image" };
}

function textInput(key: string, label: string, required: boolean): CreativeSkillInput {
  return { key, label, required, type: "text" };
}

function selectInput(
  key: string,
  label: string,
  options: string[],
  defaultValue: string,
): CreativeSkillInput {
  return { key, label, required: false, type: "select", options, defaultValue };
}

function normalizeExecutorKey(value: unknown): CreativeSkillExecutorKey {
  if (typeof value !== "string" || !creativeSkillExecutorKeys.includes(value as CreativeSkillExecutorKey)) {
    throw new Error("Skill 执行能力不正确");
  }

  return value as CreativeSkillExecutorKey;
}

function normalizeInputs(value: unknown): CreativeSkillInput[] {
  if (!Array.isArray(value)) {
    throw new Error("Skill 输入项格式不正确");
  }

  const keys = new Set<string>();

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Skill 输入项格式不正确");
    }

    const source = item as Record<string, unknown>;
    const key = normalizeRequiredText(source.key, "输入变量名", 80);

    if (!inputKeyPattern.test(key) || keys.has(key)) {
      throw new Error("输入变量名不正确或重复");
    }

    keys.add(key);
    const type = source.type;
    if (typeof type !== "string" || !creativeSkillInputTypes.includes(type as CreativeSkillInputType)) {
      throw new Error("输入类型不正确");
    }

    const options = Array.isArray(source.options)
      ? source.options
        .filter((option): option is string => typeof option === "string")
        .map((option) => option.trim())
        .filter(Boolean)
        .slice(0, 60)
      : undefined;

    return {
      key,
      type: type as CreativeSkillInputType,
      label: normalizeRequiredText(source.label, "输入标签", 120),
      required: source.required === true,
      ...(options?.length ? { options } : {}),
      ...("defaultValue" in source ? { defaultValue: normalizeDefaultValue(source.defaultValue) } : {}),
    };
  });
}

function normalizeDefaultValue(value: unknown): CreativeSkillInput["defaultValue"] {
  if (typeof value === "string") return value.slice(0, 1_000);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.map((item) => item.slice(0, 1_000)).slice(0, 60);
  }

  throw new Error("输入默认值不正确");
}

function normalizeRequiredText(value: unknown, label: string, maxLength: number) {
  const text = normalizeText(value, maxLength);
  if (!text) throw new Error(`${label}不能为空`);
  return text;
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
