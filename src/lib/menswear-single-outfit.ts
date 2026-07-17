export type MenswearSingleOutfitAspectRatio = "square" | "portrait" | "landscape";
export type MenswearSingleOutfitBackgroundMode = "inherit" | "custom";
export type MenswearSingleOutfitCompositionFidelity = "locked" | "adjustable";
export type MenswearSingleOutfitCameraDistance = "full_body" | "three_quarter" | "half_body";
export type MenswearSingleOutfitFaceMode = "show_face" | "hidden_face";
export type MenswearSingleOutfitModelGender = "male" | "female" | "auto";
export type MenswearSingleOutfitMaskMode = "wear_mask" | "no_mask" | "auto";
export type MenswearSingleOutfitPersonScale = "small" | "balanced" | "dominant" | "close";
export type MenswearSingleOutfitPoseMode = "inherit" | "custom" | "random";

export function buildMenswearSingleOutfitPrompt(input: {
  aspectRatio?: MenswearSingleOutfitAspectRatio;
  backgroundInstruction?: string;
  backgroundMode?: MenswearSingleOutfitBackgroundMode;
  compositionFidelity?: MenswearSingleOutfitCompositionFidelity;
  cameraDistance?: MenswearSingleOutfitCameraDistance;
  faceMode?: MenswearSingleOutfitFaceMode;
  hasCompositionReference: boolean;
  hasFaceReference: boolean;
  modelGender?: MenswearSingleOutfitModelGender;
  maskMode?: MenswearSingleOutfitMaskMode;
  personScale?: MenswearSingleOutfitPersonScale;
  poseInstruction?: string;
  poseMode?: MenswearSingleOutfitPoseMode;
  productImageCount: number;
}) {
  const compositionRule = input.hasCompositionReference
    ? input.compositionFidelity === "adjustable"
      ? "构图参考图以人物姿势、镜头距离、构图与氛围为主，可按用户明确说明轻微调整人物位置或背景；绝不复制其中的服装、人物身份、品牌、文字或商品细节。"
      : "构图参考图为硬约束：必须复刻构图参考图的人物位置、姿势、镜头角度、人物占比、裁切范围、留白和背景空间关系；仅将参考图中的服装替换为锁定单品，绝不复制其中的服装、人物身份、品牌、文字或商品细节。"
    : "没有构图参考图，根据动作和背景要求生成自然真实的男装上身图。";
  const faceRule = input.hasFaceReference
    ? "最后一张为脸部身份参考图，只锁定五官、发型和年龄感，不改变服装、身材、动作、背景或画面风格。"
    : "没有脸部身份参考图，按模特要求生成自然真实人物。";
  const backgroundRule = input.backgroundMode === "inherit" && input.hasCompositionReference
    ? "背景：保持构图参考图中的背景、光线和空间关系不变。"
    : `背景：${input.backgroundInstruction?.trim() || "按服装风格生成真实生活化背景，并保持环境、光线和透视自然。"}`;
  const poseRule = input.poseMode === "inherit" && input.hasCompositionReference
    ? "动作：保持构图参考图中的人物姿势和身体方向不变。"
    : input.poseMode === "random"
      ? "动作：不设定固定动作，生成自然随机动作。"
      : `动作：${input.poseInstruction?.trim() || "生成自然、合理且能展示服装的站姿或行走动作。"}`;

  return [
    "你是专业男装单品穿搭视觉生成师。",
    `图片顺序：前 ${input.productImageCount} 张为锁定服装单品参考图${input.hasCompositionReference ? "，随后一张为构图参考图" : ""}${input.hasFaceReference ? "，最后一张为脸部身份参考图" : ""}。`,
    "核心任务：基于上传的单件或多件衣服、裤子、内搭、鞋包或配饰，完成一套真实协调的上身穿搭。",
    "商品锁定：必须保持每个上传单品的颜色、版型、材质、图案、Logo、领口、袖型、口袋、纽扣、拉链和配饰数量；不得改款、换色、删除或补全不可见商品细节。",
    compositionRule,
    faceRule,
    `模特要求：${modelGenderLabel(input.modelGender)}；${faceModeLabel(input.faceMode)}。`,
    `口罩要求：${maskModeLabel(input.maskMode)}。`,
    `人物远近：${cameraDistanceLabel(input.cameraDistance)}。`,
    `人物占比：${personScaleLabel(input.personScale)}。`,
    poseRule,
    backgroundRule,
    `输出比例：${input.aspectRatio || "portrait"}。`,
    "输出规则：一张图片只生成一套完整穿搭和一个单独画面，不要拼图、九宫格、搭配合集、并排人物或多个造型。多张生成时，每张可变化动作、背景或搭配的补充单品，但上传的主商品必须保持一致。",
    "真实感规则：人物比例、衣物垂感、面料纹理、阴影、手部和鞋部必须合理；不要生成文字、价格、标签、水印、账号、广告牌、错误 Logo 或无关商品。",
  ].join("\n");
}

function modelGenderLabel(value: MenswearSingleOutfitModelGender | undefined) {
  return { auto: "模特性别按主商品风格判断", female: "女模特", male: "男模特" }[value || "male"];
}

function faceModeLabel(value: MenswearSingleOutfitFaceMode | undefined) {
  return value === "hidden_face"
    ? "无头或不露脸构图，重点展示服装，不出现可识别脸部"
    : "人物完整露头，脸部自然清晰但不做夸张特写";
}

function cameraDistanceLabel(value: MenswearSingleOutfitCameraDistance | undefined) {
  return {
    full_body: "全身，脚部完整可见，便于查看完整搭配",
    half_body: "半身，重点展示上衣与内搭关系，脸部不要贴近镜头",
    three_quarter: "七分身，能清楚展示上下装和鞋子关系",
  }[value || "three_quarter"];
}

function maskModeLabel(value: MenswearSingleOutfitMaskMode | undefined) {
  return {
    auto: "由背景与动作自然判断是否佩戴口罩，但不能遮挡上传脸部参考的核心五官特征",
    no_mask: "不戴口罩，脸部自然清晰可见",
    wear_mask: "佩戴干净简洁的口罩，保留脸型、发型与可见五官特征，不改变人物身份",
  }[value || "no_mask"];
}

function personScaleLabel(value: MenswearSingleOutfitPersonScale | undefined) {
  return {
    balanced: "主体占画面约 55%-70%，保留适量环境和上下留白",
    close: "主体占画面约 80%-90%，仅在明确需要近景时使用，避免贴脸畸变",
    dominant: "主体占画面约 70%-80%，服装细节突出但脚部和手部不裁切",
    small: "主体占画面约 35%-50%，保留更多背景与环境关系",
  }[value || "balanced"];
}
