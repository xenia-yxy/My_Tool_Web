export type MenswearMultiOutfitDisplayMode = "model" | "flatlay";
export type MenswearMultiOutfitTextMode = "with_labels" | "no_text";
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

export function buildMenswearMultiOutfitPrompt(input: {
  aspectRatio?: MenswearMultiOutfitAspectRatio;
  cameraDistance?: MenswearMultiOutfitCameraDistance;
  subjectImageCount: number;
  displayMode: MenswearMultiOutfitDisplayMode;
  outfitCount: number;
  preserveInstructions?: string;
  season?: MenswearMultiOutfitSeason;
  styleInstructions?: string;
  textMode: MenswearMultiOutfitTextMode;
}) {
  const preserve =
    input.preserveInstructions?.trim() ||
    "保留主商品的颜色、版型、材质、图案、领口、袖型、纽扣、印花、口袋和整体比例";
  const style =
    input.styleInstructions?.trim() ||
    "干净白底横版合集，电商穿搭板式，商品清晰、留白充足、光线均匀";
  const aspectRatio = input.aspectRatio || "landscape";
  const season = seasonInstructions[input.season || "spring_autumn"];
  const cameraDistance = cameraDistanceInstructions[
    input.cameraDistance || (input.displayMode === "flatlay" ? "product_grid" : "three_quarter")
  ];
  const display =
    input.displayMode === "model"
      ? "上身模特展示：使用真实男模特或不露脸模特，每套搭配都自然穿着主商品，人体比例真实。"
      : "无模特平铺展示：所有服装与鞋包配饰平铺或悬挂展示，像商品搭配陈列图，不出现人体。";
  const textRule =
    input.textMode === "with_labels"
      ? "版式可包含标题和每套搭配名；文字必须简洁、清晰、无错字，如果无法保证文字准确，可以保留空白标题区。"
      : "不要出现文字、标题、价格、标签、logo、水印、按钮或说明。";

  return [
    "你是专业男装一衣多搭视觉生成师。",
    `图片顺序：前 ${input.subjectImageCount} 张为服装主体参考图。`,
    `输出目标：生成一张一衣多搭展示图，展示 ${input.outfitCount} 套不同男装搭配。`,
    `输出比例：${aspectRatio}。`,
    `季节搭配：${season}`,
    `人物远近与主体占比：${cameraDistance}`,
    `必须保留：${preserve}。同一件主商品必须出现在每一套搭配里，不得改款、换色、替换图案或改变材质。`,
    `画面风格：${style}。`,
    display,
    "搭配要求：每套搭配的裤装、鞋子、外套、包或配饰可以变化，但必须服务于同一主商品；搭配之间要有明确差异，整体仍然真实可穿。",
    "版式要求：横向排列，间距均匀，主商品识别度高，背景干净，适合男装电商图文和社媒封面。",
    "真实感要求：服装结构可信，面料纹理自然，阴影和透视合理，不要生成畸形人体、错误袖口、错乱领口或重复肢体。",
    textRule,
  ].join("\n");
}

const seasonInstructions: Record<MenswearMultiOutfitSeason, string> = {
  spring: "春季清爽搭配，轻薄外套、衬衫、长裤或浅色层次，避免厚重冬装。",
  summer: "夏季透气搭配，短袖、轻薄裤装、凉感配色和简洁配饰，避免厚重叠穿。",
  spring_autumn: "春秋过渡搭配，薄外套、衬衫、卫衣、长裤和适中层次，真实适合换季穿着。",
  autumn_winter: "秋冬过渡搭配，外套、针织、长裤和低饱和配色，保暖但不过度臃肿。",
  winter: "冬季保暖搭配，羽绒服、呢大衣、围巾、厚裤装或靴子等元素可参与搭配，保持真实可穿。",
  all_season: "四季通用搭配，避免明显季节冲突，按主商品属性生成可长期销售的基础穿搭。",
};

const cameraDistanceInstructions: Record<MenswearMultiOutfitCameraDistance, string> = {
  full_body: "全身或接近全身，人物从头到脚完整可见，保留脚部和适量上下留白，不要裁切腿脚。",
  three_quarter: "七分身或膝上到全身之间，人物不要贴脸近景，主体占画面约 60%-75%，服装整体关系清楚。",
  half_body: "半身到大半身，适合展示上衣细节，但不要让脸部或胸口过度放大。",
  product_grid: "商品陈列视角，所有单品完整可见，平铺或挂拍主体占比均衡，留白稳定。",
};
