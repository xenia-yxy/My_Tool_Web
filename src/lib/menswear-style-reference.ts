import type { ImageAspectRatioPreset } from "@/lib/image-aspect-ratios";

export type MenswearStyleReferenceAspectRatio = ImageAspectRatioPreset;
export type MenswearStyleReferenceCameraDistance =
  | "match_reference"
  | "full_body"
  | "three_quarter"
  | "half_body"
  | "close_detail";

export function buildMenswearStyleReferencePrompt(input: {
  aspectRatio?: MenswearStyleReferenceAspectRatio;
  cameraDistance?: MenswearStyleReferenceCameraDistance;
  mainImageCount: number;
  modelFaceReferenceSource?: string;
  preserveInstructions?: string;
  styleInstructions?: string;
  gender?: "men" | "women";
}) {
  const genderLabel = input.gender === "women" ? "女装" : "男装";
  const preserve =
    input.preserveInstructions?.trim() ||
    "保留主图中的服装颜色、版型、材质、图案、领口、袖型、纽扣、口袋、辅料和整体商品比例";
  const style =
    input.styleInstructions?.trim() ||
    "提取风格参考图的光线方向、镜头距离、背景氛围、色彩倾向和真实拍摄质感";
  const aspectRatio = input.aspectRatio || "portrait";
  const cameraDistance = cameraDistanceInstructions[input.cameraDistance || "match_reference"];
  const modelFaceReference = input.modelFaceReferenceSource?.trim()
    ? `脸部身份参考：使用${input.modelFaceReferenceSource.trim()}锁定人物五官与身份；不得覆盖主商品、风格参考、姿势、身材、背景或画面风格。`
    : "脸部身份参考：未提供脸部参考图，按商品和风格参考生成自然真实模特。";

  return [
    `你是专业${genderLabel}电商视觉与真实服装摄影生成师。`,
    `图片顺序：前 ${input.mainImageCount} 张为服装主图，随后一张为风格参考图${input.modelFaceReferenceSource?.trim() ? "，最后一张为脸部身份参考图" : ""}。`,
    `输出比例：${aspectRatio}。`,
    `人物远近与主体占比：${cameraDistance}`,
    `必须保留：${preserve}。`,
    `风格参考：${style}。`,
    modelFaceReference,
    "风格参考图只影响光线、镜头、背景氛围和色彩倾向，不得覆盖主图商品的真实细节。",
    "保持风格参考图的构图比例、镜头距离、主体占比和留白关系；如果参考图是全身或中远景，不要生成胸口以上大近景；如果参考图主体较小，也要保留相近留白。",
    "不要照搬风格参考图中的服装、人物、姿势、商品款式、品牌元素或具体场景物件。",
    `参考图中的人物身份、衣服款式和商品细节都不能替换主图商品；如果主图是单品挂拍或平铺，请在真实${genderLabel}摄影逻辑下保持商品结构可信。`,
    "生成时保持真实服装摄影效果，服装结构可信，面料质感自然，人体、衣物和环境比例真实。",
    "不要出现任何文字、标题、价格、标签、logo、水印、按钮或说明，只输出画面本身。",
  ].join("\n");
}

const cameraDistanceInstructions: Record<MenswearStyleReferenceCameraDistance, string> = {
  match_reference: "优先保持风格参考图的镜头远近、人物大小、主体占比和上下左右留白，不要比参考图明显更近或更满。",
  full_body: "全身或接近全身，人物从头到脚完整可见，保留脚部和适量上下留白，不要裁切腿脚。",
  three_quarter: "七分身或膝上到全身之间，主体占画面约 60%-75%，服装整体关系清楚，不要贴脸近景。",
  half_body: "半身到大半身，适合展示上衣细节，但脸部和胸口不要过度放大。",
  close_detail: "近景细节图，只在用户明确需要细节时使用，保留商品关键细节且避免裁掉核心版型。",
};
