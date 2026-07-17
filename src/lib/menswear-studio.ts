import {
  isImageAspectRatioPreset,
  type ImageAspectRatioPreset,
} from "@/lib/image-aspect-ratios";

export const menswearReferenceRoles = [
  "top",
  "inner",
  "bottom",
  "shoes",
  "bag",
  "accessory",
  "outfit",
  "model_face",
  "model_body",
  "pose",
  "background",
  "composition",
  "lighting",
  "mood",
  "scene",
] as const;

export const menswearReferencePolicies = [
  "LOCKED",
  "REPLACE",
  "LIMITED",
  "SYSTEM",
  "REMOVE",
] as const;

export type MenswearReferenceRole = (typeof menswearReferenceRoles)[number];
export type MenswearReferencePolicy =
  (typeof menswearReferencePolicies)[number];
export type MenswearCameraDistance =
  | "full_body"
  | "three_quarter"
  | "half_body"
  | "close_detail";
export type MenswearSceneMode =
  | "try_on"
  | "product_replace"
  | "background_only";

export type MenswearGenerationReference = {
  allowedChanges: string[];
  fidelity: number;
  materialId: string;
  policy: MenswearReferencePolicy;
  role: MenswearReferenceRole;
};

export type NormalizedMenswearGenerationInput = {
  aspectRatio: ImageAspectRatioPreset;
  batchCount: number;
  cameraDistance: MenswearCameraDistance;
  customInstructions: string;
  description: string;
  modelProfileId: string | null;
  references: MenswearGenerationReference[];
  sceneMode: MenswearSceneMode;
};

const productRoles = new Set<MenswearReferenceRole>([
  "top",
  "inner",
  "bottom",
  "shoes",
  "bag",
  "accessory",
  "outfit",
]);

export function isMenswearProductRole(role: MenswearReferenceRole) {
  return productRoles.has(role);
}

const roleLabels: Record<MenswearReferenceRole, string> = {
  top: "主上衣",
  inner: "内搭",
  bottom: "裤子",
  shoes: "鞋子",
  bag: "包",
  accessory: "配饰",
  outfit: "整套穿搭",
  model_face: "模特脸部",
  model_body: "模特身体",
  pose: "姿势",
  background: "背景",
  composition: "构图",
  lighting: "光线",
  mood: "氛围",
  scene: "场景图",
};

export const policyLabels: Record<MenswearReferencePolicy, string> = {
  LOCKED: "锁定保留",
  REPLACE: "参考替换",
  LIMITED: "允许轻微变化",
  SYSTEM: "系统生成",
  REMOVE: "移除",
};

export function normalizeMenswearGenerationInput(input: {
  aspectRatio?: unknown;
  batchCount?: unknown;
  cameraDistance?: unknown;
  customInstructions?: unknown;
  description?: unknown;
  modelProfileId?: unknown;
  references?: unknown;
  sceneMode?: unknown;
}): NormalizedMenswearGenerationInput {
  const description = normalizeRequiredText(input.description, "请描述要生成的男装图片");
  const references = normalizeReferences(input.references);
  const sceneMode = normalizeSceneMode(input.sceneMode);

  const hasLockedProduct = references.some(
    (reference) =>
      productRoles.has(reference.role) && reference.policy === "LOCKED",
  );

  if (sceneMode !== "background_only" && !hasLockedProduct) {
    throw new Error("至少选择一件锁定的商品素材");
  }

  return {
    aspectRatio: normalizeAspectRatio(input.aspectRatio),
    batchCount: normalizeBatchCount(input.batchCount),
    cameraDistance: normalizeCameraDistance(input.cameraDistance),
    customInstructions: normalizeOptionalText(input.customInstructions),
    description,
    modelProfileId: normalizeOptionalId(input.modelProfileId),
    references,
    sceneMode,
  };
}

export function buildStrictMenswearPrompt(input: {
  aspectRatio: ImageAspectRatioPreset;
  cameraDistance?: MenswearCameraDistance;
  customInstructions?: string;
  description: string;
  mainProductCategory?: string;
  modelName?: string | null;
  references: Array<{
    fidelity: number;
    materialName: string;
    policy: MenswearReferencePolicy;
    role: MenswearReferenceRole;
  }>;
  sceneAspectRatio?: string;
  sceneInstruction?: string;
  sceneMode?: MenswearSceneMode;
  stylePreset?: string;
  systemControls?: string[];
}) {
  const referenceLines = input.references.map(
    (reference) =>
      `${roleLabels[reference.role]}：${reference.materialName}；策略：${policyLabels[reference.policy]}；保真强度：${clampNumber(reference.fidelity, 0, 100)}%。`,
  );

  return [
    "你是男装商品严格保真视觉生成助手。",
    "任务目标：",
    input.description.trim(),
    "",
    "参考素材与控制策略：",
    ...referenceLines,
    "",
    `选用模特：${input.modelName?.trim() || "系统生成男模特"}。`,
    input.mainProductCategory?.trim()
      ? `主商品品类：${input.mainProductCategory.trim()}。`
      : "",
    `输出比例：${input.aspectRatio}。`,
    `人物远近：${cameraDistanceInstructions[input.cameraDistance || "three_quarter"]}`,
    input.stylePreset?.trim() ? `画面风格：${input.stylePreset.trim()}。` : "",
    input.systemControls?.filter(Boolean).length
      ? `系统补全设置：${input.systemControls.filter(Boolean).join("；")}。`
      : "",
    "锁定商品规则：必须保持商品的颜色、版型、图案、Logo、材质、领口、袖型、口袋、纽扣、拉链和配饰数量；不得新增、删除或替换商品细节；不得补全不可见商品细节。",
    "画面规则：只能按参考策略改变人物、姿势、背景、构图、光线或氛围；未提供参考素材的部分只能按系统补全设置生成真实、协调的基础元素；不得虚构未上传商品的具体品牌、Logo、版型或材质；不要生成文字、水印、价格、账号、品牌宣传语或无关商品。",
    input.customInstructions?.trim()
      ? `用户补充要求：${input.customInstructions.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSceneImagePrompt(input: {
  aspectRatio: ImageAspectRatioPreset;
  cameraDistance?: MenswearCameraDistance;
  customInstructions?: string;
  description: string;
  mainProductCategory?: string;
  modelName?: string | null;
  references: Array<{
    fidelity: number;
    materialName: string;
    policy: MenswearReferencePolicy;
    role: MenswearReferenceRole;
  }>;
  sceneAspectRatio?: string;
  sceneInstruction?: string;
  sceneMode?: MenswearSceneMode;
  stylePreset?: string;
  systemControls?: string[];
}) {
  const sceneMode = input.sceneMode || "try_on";
  const referenceLines = input.references.map((reference) =>
    `${roleLabels[reference.role]}：${reference.materialName}；使用方式：${policyLabels[reference.policy]}。`,
  );

  return [
    "你是男装场景图生成助手。",
    `场景类型：${sceneModeLabels[sceneMode]}。`,
    "创作目标：",
    input.description.trim(),
    "",
    "输入素材：",
    ...referenceLines,
    "",
    input.mainProductCategory?.trim()
      ? `需要呈现的商品品类：${input.mainProductCategory.trim()}。`
      : "",
    input.modelName?.trim() ? `可用模特档案：${input.modelName.trim()}。` : "",
    `输出比例：${input.sceneAspectRatio?.trim() || input.aspectRatio}。`,
    `人物远近：${cameraDistanceInstructions[input.cameraDistance || "three_quarter"]}`,
    input.stylePreset?.trim() ? `画面风格：${input.stylePreset.trim()}。` : "",
    input.systemControls?.filter(Boolean).length
      ? `系统补全设置：${input.systemControls.filter(Boolean).join("；")}。`
      : "",
    input.sceneInstruction?.trim()
      ? `优先执行的场景补充要求：${input.sceneInstruction.trim()}。`
      : "",
    "",
    sceneModeRules[sceneMode],
    "画面必须真实自然，人物、商品、空间关系和镜头透视保持合理；没有提供的元素只按系统补全设置生成，不要臆造品牌、Logo、价格、水印、账号、文字或无关商品。",
    input.customInstructions?.trim()
      ? `用户补充要求：${input.customInstructions.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildMenswearGenerationProvenance(input: {
  modelProfileId: string | null;
  projectId: string;
  references: Array<{
    fidelity: number;
    materialId: string;
    policy: MenswearReferencePolicy;
    role: MenswearReferenceRole;
  }>;
}) {
  return {
    modelProfileId: input.modelProfileId,
    projectId: input.projectId,
    references: input.references.map((reference) => ({
      fidelity: clampNumber(reference.fidelity, 0, 100),
      materialId: reference.materialId,
      policy: reference.policy,
      role: reference.role,
    })),
  };
}

function normalizeReferences(value: unknown): MenswearGenerationReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((reference) => {
    const source = reference && typeof reference === "object"
      ? (reference as Record<string, unknown>)
      : {};
    const role = menswearReferenceRoles.includes(
      source.role as MenswearReferenceRole,
    )
      ? (source.role as MenswearReferenceRole)
      : "outfit";
    const policy = menswearReferencePolicies.includes(
      source.policy as MenswearReferencePolicy,
    )
      ? (source.policy as MenswearReferencePolicy)
      : "SYSTEM";

    const isProduct = isMenswearProductRole(role);

    return {
      allowedChanges: normalizeStringList(source.allowedChanges),
      fidelity: isProduct ? 100 : clampNumber(source.fidelity, 0, 100),
      materialId: normalizeRequiredText(source.materialId, ""),
      policy: isProduct ? "LOCKED" : policy,
      role,
    };
  }).filter((reference) => Boolean(reference.materialId));
}

function normalizeAspectRatio(value: unknown): ImageAspectRatioPreset {
  if (isImageAspectRatioPreset(value)) {
    return value;
  }

  return "3:4";
}

function normalizeCameraDistance(value: unknown): MenswearCameraDistance {
  if (
    value === "full_body" ||
    value === "three_quarter" ||
    value === "half_body" ||
    value === "close_detail"
  ) {
    return value;
  }

  return "three_quarter";
}

function normalizeSceneMode(value: unknown): MenswearSceneMode {
  if (value === "product_replace" || value === "background_only") {
    return value;
  }

  return "try_on";
}

function normalizeBatchCount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(Math.max(Math.floor(number), 1), 30)
    : 4;
}

function normalizeRequiredText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      )
    : [];
}

function clampNumber(value: unknown, min: number, max: number) {
  const number = Number(value);
  const normalized = Number.isFinite(number) ? Math.floor(number) : min;
  return Math.min(Math.max(normalized, min), max);
}

const cameraDistanceInstructions: Record<MenswearCameraDistance, string> = {
  full_body: "全身或接近全身，人物从头到脚完整可见，脚部不要被裁切，主体占画面约 55%-70%。",
  three_quarter: "七分身或膝上到全身之间，人物不要离镜头太近，主体占画面约 60%-75%，服装整体比例清楚。",
  half_body: "半身到大半身，用于展示上衣细节，脸部和胸口不要过度放大，保留肩袖和下摆关系。",
  close_detail: "近景细节，用于强调面料、印花或领口，仍需保持真实服装结构，不要把人物脸部放得过大。",
};

const sceneModeLabels: Record<MenswearSceneMode, string> = {
  background_only: "纯背景生成",
  product_replace: "商品替换",
  try_on: "人物换装",
};

const sceneModeRules: Record<MenswearSceneMode, string> = {
  background_only: "纯背景规则：仅生成场景、背景、光线与空间氛围；不得出现人物、服装、鞋包、商品或手部；不要从描述中补全任何商品。",
  product_replace: "商品替换规则：保留场景图中的环境、构图、光线和镜头关系；仅替换锁定的主商品；必须保持商品的颜色、版型、图案、Logo、材质、领口、袖型、口袋、纽扣、拉链和配饰数量；不得新增、删除或替换商品细节；不得补全不可见商品细节；除非场景图已有可保留人物，否则不要新增人物。",
  try_on: "人物换装规则：保留场景图中的人物、姿势、表情、镜头、背景和光线；只替换锁定的服装、鞋包或配饰；必须保持商品的颜色、版型、图案、Logo、材质、领口、袖型、口袋、纽扣、拉链和配饰数量；不得新增、删除或替换商品细节；不得补全不可见商品细节。",
};
