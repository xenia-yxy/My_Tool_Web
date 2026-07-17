export type MenswearMultiOutfitDisplayMode = "model" | "flatlay";
export type MenswearMultiOutfitTextMode = "with_labels" | "no_text";
export type MenswearMultiOutfitModelGender =
  | "any"
  | "male"
  | "female"
  | "none";
export type MenswearMultiOutfitModelFaceMode =
  | "hidden_face"
  | "visible_face"
  | "no_model";
export type MenswearMultiOutfitAspectRatio = "square" | "portrait" | "landscape";
export type MenswearMultiOutfitCameraDistance =
  | "full_body"
  | "three_quarter"
  | "half_body"
  | "product_grid";
export type MenswearMultiOutfitSeason =
  | "spring"
  | "summer"
  | "spring_autumn"
  | "autumn_winter"
  | "winter"
  | "all_season";
export type MenswearMultiOutfitOutputFormat = "board" | "split";
export type MenswearMultiOutfitBackgroundMode = "inherit" | "custom";
export type MenswearMultiOutfitCompositionMode = "inherit" | "custom";
export type MenswearMultiOutfitPoseMode = "inherit" | "custom" | "random";
export type MenswearMultiOutfitMaskMode = "wear_mask" | "no_mask" | "auto";

export function buildMenswearMultiOutfitPrompt(input: {
  aspectRatio?: MenswearMultiOutfitAspectRatio;
  backgroundInstruction?: string;
  backgroundMode?: MenswearMultiOutfitBackgroundMode;
  cameraDistance?: MenswearMultiOutfitCameraDistance;
  compositionMode?: MenswearMultiOutfitCompositionMode;
  subjectImageCount: number;
  displayMode: MenswearMultiOutfitDisplayMode;
  modelFaceMode?: MenswearMultiOutfitModelFaceMode;
  modelFaceReferenceSource?: string;
  hasLayoutReference?: boolean;
  outputFormat?: MenswearMultiOutfitOutputFormat;
  modelGender?: MenswearMultiOutfitModelGender;
  maskMode?: MenswearMultiOutfitMaskMode;
  outfitCount: number;
  preserveInstructions?: string;
  poseInstruction?: string;
  poseMode?: MenswearMultiOutfitPoseMode;
  season?: MenswearMultiOutfitSeason;
  styleInstructions?: string;
  targetAudience?: string;
  textMode: MenswearMultiOutfitTextMode;
  usageScene?: string;
}) {
  const preserve =
    input.preserveInstructions?.trim() ||
    "保留主商品的颜色、版型、材质、图案、领口、袖型、纽扣、印花、口袋和整体比例";
  const style =
    input.styleInstructions?.trim() ||
    "干净白底横版合集，电商穿搭板式，商品清晰、留白充足、光线均匀";
  const aspectRatio = input.aspectRatio || "landscape";
  const season = seasonInstructions[input.season || "spring_autumn"];
  const targetAudience = input.targetAudience?.trim() || "空缺项交给 AI 根据商品图片与整体风格判断";
  const usageScene = input.usageScene?.trim() || "空缺项交给 AI 根据商品图片与整体风格判断";
  const modelGender = modelGenderInstructions[
    input.displayMode === "flatlay" ? "none" : input.modelGender || "male"
  ];
  const modelFace = modelFaceInstructions[
    input.displayMode === "flatlay" ? "no_model" : input.modelFaceMode || "hidden_face"
  ];
  const modelFaceReference = input.modelFaceReferenceSource?.trim()
    ? `脸部身份参考：使用${input.modelFaceReferenceSource.trim()}锁定人物五官与身份；不得改变主商品、搭配、身材、姿势、背景或画面风格。`
    : "脸部身份参考：未提供脸部参考图，按模特性别与风格生成自然真实模特。";
  const cameraDistance = cameraDistanceInstructions[
    input.cameraDistance || (input.displayMode === "flatlay" ? "product_grid" : "three_quarter")
  ];
  const display =
    input.displayMode === "model"
      ? `上身模特展示：${modelGender}${modelFace}每套搭配都自然穿着主商品，人体比例真实。`
      : "无模特平铺展示：所有服装与鞋包配饰平铺或悬挂展示，像商品搭配陈列图，不出现真人模特、不出现人体。";
  const layoutRule = input.hasLayoutReference && input.compositionMode === "custom"
    ? "构图：平铺参考图只锁定每套组合顺序与搭配关系；构图、镜头、人物位置和视觉风格按用户说明生成，不复制其主商品、文字、品牌或人物。"
    : input.hasLayoutReference
    ? "最后一张为平铺多搭参考图。必须按其中从左到右、从上到下的套装顺序识别搭配；参考图只锁定每套的组合关系、版式、色彩风格和视觉节奏，不复制其主商品、文字、品牌或人物。"
    : "没有平铺多搭参考图，按本次参数设计搭配顺序与版式。";
  const outputRule = input.outputFormat === "split"
    ? `拆分输出规则：本次必须生成 ${input.outfitCount} 张独立人物穿搭图；第 N 张只呈现参考图第 N 套搭配，使用同一主商品，不得生成拼图、合集或重复其他套装。`
    : "合集输出规则：在一张完整展示图中按顺序呈现所有搭配。";
  const backgroundRule = input.backgroundMode === "inherit" && input.hasLayoutReference
    ? "背景：保持参考图的背景空间、光线和环境关系。"
    : `背景：${input.backgroundInstruction?.trim() || "按服装风格生成真实自然的背景，环境和光线不得抢夺主体。"}`;
  const poseRule = input.poseMode === "inherit" && input.hasLayoutReference
    ? "动作：保持参考图中对应搭配的人物动作和身体方向。"
    : input.poseMode === "random"
      ? "动作：不设定固定动作，按真实穿搭展示生成自然随机动作。"
      : `动作：${input.poseInstruction?.trim() || "自然站立、行走或轻微转身，完整展示穿搭。"}`;
  const textRule =
    input.textMode === "with_labels"
      ? "版式可包含标题和每套搭配名；文字必须简洁、清晰、无错字，如果无法保证文字准确，可以保留空白标题区。"
      : "不要出现文字、标题、价格、标签、logo、水印、按钮或说明。";

  return [
    "你是专业男装一衣多搭视觉生成师。",
    `图片顺序：前 ${input.subjectImageCount} 张为服装主体参考图。`,
    input.outputFormat === "split"
      ? `输出目标：按平铺多搭顺序生成 ${input.outfitCount} 张单张人物穿搭图，每张只展示一套不同男装搭配。`
      : `输出目标：生成一张一衣多搭展示图，展示 ${input.outfitCount} 套不同男装搭配。`,
    `目标客群：${targetAudience}。`,
    `使用场景：${usageScene}。`,
    `输出比例：${aspectRatio}。`,
    `季节搭配：${season}`,
    `人物远近与主体占比：${cameraDistance}`,
    `必须保留：${preserve}。同一件主商品必须出现在每一套搭配里，不得改款、换色、替换图案或改变材质。`,
    `画面风格：${style}。`,
    layoutRule,
    outputRule,
    modelFaceReference,
    display,
    ...(input.outputFormat === "split" ? [`口罩：${maskModeInstruction(input.maskMode)}。`, backgroundRule, poseRule] : []),
    "搭配要求：每套搭配的裤装、鞋子、外套、包或配饰可以变化，但必须服务于同一主商品；搭配之间要有明确差异，整体仍然真实可穿。",
    "版式要求：横向排列，间距均匀，主商品识别度高，背景干净，适合男装电商图文和社媒封面。",
    "真实感要求：服装结构可信，面料纹理自然，阴影和透视合理，不要生成畸形人体、错误袖口、错乱领口或重复肢体。",
    textRule,
  ].join("\n");
}

function maskModeInstruction(value: MenswearMultiOutfitMaskMode | undefined) {
  return {
    auto: "根据场景自然判断是否佩戴口罩，不遮挡上传脸部参考的核心五官",
    no_mask: "不戴口罩，露脸时五官自然清晰",
    wear_mask: "佩戴干净简洁的口罩，保留脸型、发型与可见五官特征",
  }[value || "no_mask"];
}

const seasonInstructions: Record<MenswearMultiOutfitSeason, string> = {
  spring: "春季清爽搭配，轻薄外套、衬衫、长裤或浅色层次，避免厚重冬装。",
  summer: "夏季透气搭配，短袖、轻薄裤装、凉感配色和简洁配饰，避免厚重叠穿。",
  spring_autumn: "春秋过渡搭配，薄外套、衬衫、卫衣、长裤和适中层次，真实适合换季穿着。",
  autumn_winter: "秋冬过渡搭配，外套、针织、长裤和低饱和配色，保暖但不过度臃肿。",
  winter: "冬季保暖搭配，羽绒服、呢大衣、围巾、厚裤装或靴子等元素可参与搭配，保持真实可穿。",
  all_season: "四季通用搭配，避免明显季节冲突，按主商品属性生成可长期销售的基础穿搭。",
};

const modelGenderInstructions: Record<MenswearMultiOutfitModelGender, string> = {
  any: "模特性别不限，按主商品风格选择真实自然的模特；",
  male: "使用男模特；",
  female: "使用女模特；",
  none: "不使用模特；",
};

const modelFaceInstructions: Record<MenswearMultiOutfitModelFaceMode, string> = {
  hidden_face: "脸部不露脸或无头构图，重点展示服装和搭配；",
  visible_face: "可以露脸，五官自然真实，不要夸张表情；",
  no_model: "不出现真人模特；",
};

const cameraDistanceInstructions: Record<MenswearMultiOutfitCameraDistance, string> = {
  full_body: "全身或接近全身，人物从头到脚完整可见，保留脚部和适量上下留白，不要裁切腿脚。",
  three_quarter: "七分身或膝上到全身之间，人物不要贴脸近景，主体占画面约 60%-75%，服装整体关系清楚。",
  half_body: "半身到大半身，适合展示上衣细节，但不要让脸部或胸口过度放大。",
  product_grid: "商品陈列视角，所有单品完整可见，平铺或挂拍主体占比均衡，留白稳定。",
};
