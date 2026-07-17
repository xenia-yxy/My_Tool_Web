import type { ImageAspectRatioPreset } from "@/lib/image-aspect-ratios";

export type CommerceToolMode = "menswear" | "womenswear" | "snack-grocery";

export type CommerceImageRequest = {
  id: string;
  mode: CommerceToolMode;
  title: string;
  prompt: string;
  caption: string;
  tags: string[];
  productKeywords: string[];
  style: string;
  aspectRatio: ImageAspectRatioPreset;
};

export type FashionImageInput = {
  mode: "menswear" | "womenswear";
  itemDescription?: string;
  audience?: string;
  scene?: string;
  style?: string;
  bodyType?: string;
  outputType?: string;
  batchCount?: number;
  hasReferenceImages?: boolean;
  extraInstructions?: string;
};

export type SnackGroceryImageInput = {
  itemDescription?: string;
  audience?: string;
  scene?: string;
  category?: string;
  outputType?: string;
  batchCount?: number;
  hasReferenceImages?: boolean;
  extraInstructions?: string;
};

const menAudiences = ["大学生", "实习生", "应届毕业生", "职场新人", "IT程序员", "健身爱好者", "178标准身材男生", "175中等身材", "170显高需求", "微胖男生", "偏瘦男生", "大码男生"];
const womenAudiences = ["大学生", "通勤女生", "应届毕业生", "小个子女生", "梨形身材", "微胖女生", "高个子女生", "矮个子女生", "宝妈日常", "职场白领"];
const menScenes = ["校园楼道", "图书馆自习室", "通勤地铁口", "办公室工位", "咖啡店窗边", "日常出门", "宿舍楼下", "周末约会", "商场逛街", "公园户外", "健身房", "城市街拍"];
const womenScenes = ["上课路上", "通勤电梯厅", "逛街街边", "咖啡店门口", "图书馆", "办公室茶水间", "周末早午餐", "公园花丛", "地铁通勤", "商场试衣间", "家中卧室", "校园林荫道"];
const menStyles = ["干净男友风", "基础款通勤", "夏季清爽", "日系宽松", "平价显高", "韩系简约", "街头潮男", "商务休闲", "运动休闲", "City Boy"];
const womenStyles = ["气质通勤", "甜妹日常", "显瘦显高", "法式日常", "基础高级感", "韩系温柔", "运动休闲", "复古文艺", "极简风", "辣妹风"];
const snackAudiences = ["大学生", "宿舍党", "打工人", "租房党"];
const snackScenes = ["宿舍桌面", "办公室抽屉", "租房厨房", "夏季出门", "返校囤货"];
const snackCategories = ["零食饮料", "速食夜宵", "收纳百货", "清洁消耗品", "防暑降温"];

export function getFashionPresets(mode: "menswear" | "womenswear") {
  return {
    audiences: mode === "menswear" ? menAudiences : womenAudiences,
    scenes: mode === "menswear" ? menScenes : womenScenes,
    styles: mode === "menswear" ? menStyles : womenStyles,
    bodyTypes:
      mode === "menswear"
        ? ["178标准身材", "175偏瘦", "170显高", "普通身材", "偏瘦男生", "微胖男生", "肩窄男生", "宽肩男生", "大码男生", "矮个子男生"]
        : ["普通身材", "小个子", "梨形身材", "微胖女生", "肩宽女生", "高个子", "苹果型身材", "H型身材", "娇小身材", "标准比例"],
    outputTypes: ["一衣多搭展示", "真实穿搭图", "平铺搭配图", "商品细节图", "白底一衣多搭", "白底商品主图", "穿搭对比图", "模特上身图"],
  };
}

export function getSnackGroceryImagePresets() {
  return {
    audiences: snackAudiences,
    scenes: snackScenes,
    categories: snackCategories,
    outputTypes: ["真实场景图", "商品组合图", "清爽主图", "使用前后对比感"],
  };
}

export function buildFashionImageRequests(
  input: FashionImageInput,
): CommerceImageRequest[] {
  const count = clampCount(input.batchCount);
  const presets = getFashionPresets(input.mode);
  const item = input.itemDescription?.trim() || "服装主商品";
  const audience = input.audience?.trim() || presets.audiences[0];
  const scene = input.scene?.trim() || presets.scenes[0];
  const style = input.style?.trim() || presets.styles[0];
  const bodyType = input.bodyType?.trim() || presets.bodyTypes[0];
  const outputType = input.outputType?.trim() || presets.outputTypes[0];
  const isWhiteBackground = outputType.includes("白底");
  const isReferenceScene = scene === "参考原图场景";

  return Array.from({ length: count }, (_, index) => {
    // 白底类型忽略场景；参考原图场景跳过轮换，始终使用用户选择的场景
    let variantScene: string;
    if (isWhiteBackground) {
      variantScene = "";
    } else if (isReferenceScene) {
      variantScene = "参考原图场景";
    } else {
      const sceneIndex = presets.scenes.indexOf(scene);
      variantScene = presets.scenes[(sceneIndex + index) % presets.scenes.length];
    }
    const variantStyle = presets.styles[(presets.styles.indexOf(style) + index) % presets.styles.length];
    const title = buildFashionTitle(input.mode, item, audience, variantStyle, index);
    const tags = buildFashionTags(input.mode, audience, variantStyle, bodyType);
    const productKeywords = buildFashionKeywords(input.mode, item, bodyType, variantStyle);
    const caption = buildFashionCaption(input.mode, item, audience, bodyType, variantStyle);

    // 构建场景描述行
    let sceneDescription: string;
    if (isWhiteBackground) {
      sceneDescription = "场景：纯白背景，无场景，无环境，无道具，只展示服装本身。";
    } else if (isReferenceScene) {
      sceneDescription = "场景：参考上传图片中的原始场景，保持参考图的场景氛围和环境。";
    } else {
      sceneDescription = `场景：${variantScene}。`;
    }

    const prompt = [
      buildFashionProductAnalysisInstruction(input.hasReferenceImages, item),
      `生成${outputType}，目标人群：${audience}，身材/需求：${bodyType}，风格：${variantStyle}，${sceneDescription}`,
      buildFashionVisualInstruction(outputType),
      `本条差异方向：${fashionVariantAngle(index)}。`,
      "搭配必须从当前主商品出发：根据它的颜色深浅、版型松紧、材质厚薄、图案复杂度和适用季节，选择相匹配的下装、内搭、鞋包和配饰；不要套用固定穿搭模板，不要每张都使用相同裤子、鞋子、包和姿势。",
      "画面只出现真实穿搭或商品陈列，不要在图片里生成任何文字、标题、标签、价格、按钮、表格、说明、品牌logo或水印。",
      "人物为普通中国年轻人，真实自然，不要明星脸、网红脸、夸张摆拍、商业大片光效和过度磨皮。",
      "画面真实自然，符合现实生活场景，不要AI感、塑料感、过度修图感、夸张摆拍。",
      "构图干净，主体明确，适合抖音图文第一张或商品测试素材，保留生活感和可购买感。",
      input.extraInstructions?.trim() ? `补充要求：${input.extraInstructions.trim()}。` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `${input.mode}-${index + 1}`,
      mode: input.mode,
      title,
      prompt,
      caption,
      tags,
      productKeywords,
      style: variantStyle,
      aspectRatio: resolveFashionAspectRatio(outputType),
    };
  });
}

export function buildSnackGroceryImageRequests(
  input: SnackGroceryImageInput,
): CommerceImageRequest[] {
  const count = clampCount(input.batchCount);
  const item = input.itemDescription?.trim() || "零食百货商品组合";
  const audience = input.audience?.trim() || snackAudiences[0];
  const scene = input.scene?.trim() || snackScenes[0];
  const category = input.category?.trim() || snackCategories[0];
  const outputType = input.outputType?.trim() || "真实场景图";

  return Array.from({ length: count }, (_, index) => {
    const variantScene = snackScenes[(snackScenes.indexOf(scene) + index) % snackScenes.length];
    const title = buildSnackTitle(item, audience, category, variantScene, index);
    const tags = buildSnackTags(audience, category, variantScene);
    const productKeywords = buildSnackKeywords(item, category, variantScene);
    const caption = buildSnackCaption(item, audience, category, variantScene);
    const prompt = [
      buildSnackProductAnalysisInstruction(input.hasReferenceImages, item),
      `生成${outputType}，目标人群：${audience}，品类：${category}，使用场景：${variantScene}。`,
      `本条差异方向：${snackVariantAngle(index)}。`,
      "画面必须围绕当前商品本身生成：根据包装体积、颜色、口味/用途、数量感、保存方式、使用频率和目标人群真实生活场景来组织画面；不要套用固定宿舍清单、办公室清单或收纳模板。",
      "画面只展示商品和真实使用场景，不要在图片里生成任何文字、清单标题、价格、标签、广告语、品牌logo或水印。",
      "场景真实干净，像大学生、打工人或租房年轻人随手拍出的可参考图片，不要豪宅感和棚拍广告感。",
      "重点突出低门槛、刚需、可囤、可分享、容易下单的视觉感受。",
      input.extraInstructions?.trim() ? `补充要求：${input.extraInstructions.trim()}。` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `snack-grocery-${index + 1}`,
      mode: "snack-grocery",
      title,
      prompt,
      caption,
      tags,
      productKeywords,
      style: category,
      aspectRatio: outputType === "清爽主图" ? "1:1" : "3:4",
    };
  });
}

function clampCount(value?: number) {
  if (!value || Number.isNaN(value)) {
    return 6;
  }

  return Math.min(Math.max(Math.floor(value), 1), 30);
}

function buildFashionProductAnalysisInstruction(
  hasReferenceImages: boolean | undefined,
  item: string,
) {
  if (hasReferenceImages) {
    return [
      "先分析上传服装参考图，再生成图片。",
      "必须识别并保持当前主商品的真实品类、颜色、版型、材质、图案、领口/袖型/裤型/裙型/外套结构和主要设计点；不要改款、换色或替换主商品。",
      item && item !== "服装主商品"
        ? `用户补充的商品描述：${item}。如果描述和参考图冲突，以参考图的主商品视觉为准。`
        : "如果用户没有写商品描述，请直接从参考图判断主商品是什么，再围绕它搭配。",
    ].join("\n");
  }

  return [
    `基于商品描述生成服装内容，主商品是：${item}。`,
    "先从描述中判断主商品的品类、颜色、版型、材质、季节和风格，再围绕这些特征搭配。",
  ].join("\n");
}

function buildSnackProductAnalysisInstruction(
  hasReferenceImages: boolean | undefined,
  item: string,
) {
  if (hasReferenceImages) {
    return [
      "先分析上传商品参考图，再生成图片。",
      "必须识别并保持当前商品的包装外观、颜色、规格感、数量感、品类和主要用途；不要虚构品牌，不要夸张功效，不要把商品换成其他类目。",
      item && item !== "零食百货商品组合"
        ? `用户补充的商品/组合描述：${item}。如果描述和参考图冲突，以参考图商品为准。`
        : "如果用户没有写商品描述，请直接从参考图判断商品是什么，再选择适合的生活场景。",
    ].join("\n");
  }

  return [
    `基于商品描述生成零食百货内容，商品/组合是：${item}。`,
    "先从描述中判断商品的品类、规格、使用频率、储存方式和适合人群，再生成真实生活场景。",
  ].join("\n");
}

function fashionVariantAngle(index: number) {
  const angles = [
    "突出主商品颜色搭配，使用与主商品协调的中性色或邻近色单品。",
    "突出身材修饰，根据主商品版型决定上短下长、松紧对比或顺色延伸。",
    "突出真实日常，把搭配放到校园、通勤、出门等普通场景里。",
    "突出季节实穿，选择符合当前天气和材质厚薄的鞋包配饰。",
    "突出低预算可复用，搭配基础款但避免廉价感。",
    "突出差异化风格，让这一张和前面几张在下装、鞋包、姿态和构图上明显不同。",
  ];
  return angles[index % angles.length];
}

function snackVariantAngle(index: number) {
  const angles = [
    "突出真实使用场景，让商品出现在宿舍、办公室、租房厨房或通勤包里的合理位置。",
    "突出数量感和囤货感，但保持自然，不要像广告堆砌。",
    "突出低门槛购买理由，比如方便、刚需、省空间、随手拿、易分享。",
    "突出人群差异，根据大学生、打工人或租房党调整桌面、收纳和使用环境。",
    "突出夏季/返校/通勤等短期需求，但不要生成促销文字。",
    "突出画面差异，让这一张和前面几张在陈列方式、背景、光线和道具上明显不同。",
  ];
  return angles[index % angles.length];
}

function buildFashionVisualInstruction(outputType: string) {
  if (outputType === "一衣多搭展示") {
    return "图片类型要求：同一件主商品生成 5 套不同搭配，并排展示在一张干净横版画面中；只展示人物/服装/鞋包配饰，不要生成标题、英文副标题、编号、搭配公式、说明文字、分隔文字或任何图中文字。";
  }

  if (outputType === "平铺搭配图") {
    return "图片类型要求：生成服装、鞋包和配饰的平铺组合图；只展示物品本身，不要生成清单文字、箭头、标签、价格或说明。";
  }

  if (outputType === "商品细节图") {
    return "图片类型要求：生成主商品的材质、版型、细节和上身局部参考；不要生成文字标注、参数表、卖点贴纸或品牌标识。";
  }

  if (outputType === "白底一衣多搭") {
    return "图片类型要求：同一件主商品生成多套不同搭配，并排展示在纯白背景中，不要任何场景、道具、环境，只展示服装和配饰本身，纯白背景，无文字。";
  }

  if (outputType === "白底商品主图") {
    return "图片类型要求：主商品单独展示在纯白背景上，像电商主图一样干净，不要模特、不要场景、不要文字。";
  }

  if (outputType === "穿搭对比图") {
    return "图片类型要求：生成同一人物两种不同穿搭的对比画面，左右或上下分割，展示同一件主商品的不同搭配方式，不要文字。";
  }

  if (outputType === "模特上身图") {
    return "图片类型要求：生成真实模特穿着主商品的全身照片，重点展示上身效果和版型，不要文字。";
  }

  return "图片类型要求：生成真实穿搭画面，只展示人物和服装搭配，不要生成文字排版或图文模板。";
}

function resolveFashionAspectRatio(outputType: string): ImageAspectRatioPreset {
  if (outputType === "一衣多搭展示" || outputType === "白底一衣多搭") {
    return "16:9";
  }

  if (outputType === "平铺搭配图" || outputType === "白底商品主图") {
    return "1:1";
  }

  if (outputType === "穿搭对比图" || outputType === "模特上身图") {
    return "3:4";
  }

  return "3:4";
}

export function buildFashionTitle(
  mode: "menswear" | "womenswear",
  item: string,
  audience: string,
  style: string,
  index: number,
) {
  const men = [
    `${audience}可以直接抄的${style}`,
    `${item}这样拍，更像真实男友风图文`,
    `普通男生穿${item}，重点看版型和颜色`,
  ];
  const women = [
    `${audience}夏季可以试的${style}`,
    `${item}这样拍，更容易有点击`,
    `普通女生穿${item}，重点看显高和干净感`,
  ];
  const pool = mode === "menswear" ? men : women;
  return pool[index % pool.length];
}

export function buildFashionCaption(
  mode: "menswear" | "womenswear",
  item: string,
  audience: string,
  bodyType: string,
  style: string,
) {
  const person = mode === "menswear" ? "男生" : "女生";
  return `${audience}${person}做${style}，先用「${item}」测试点击。重点看是否适合${bodyType}、画面是否真实、收藏和商品点击有没有起来。`;
}

export function buildFashionTags(
  mode: "menswear" | "womenswear",
  audience: string,
  style: string,
  bodyType: string,
) {
  const base = mode === "menswear"
    ? ["#男生穿搭", "#男友感穿搭", "#平价穿搭"]
    : ["#女生穿搭", "#显高穿搭", "#气质穿搭"];
  return [...base, `#${audience}`, `#${style}`, `#${bodyType}`, "#抖音图文"].map((tag) =>
    tag.replace(/\s+/g, ""),
  );
}

export function buildFashionKeywords(
  mode: "menswear" | "womenswear",
  item: string,
  bodyType: string,
  style: string,
) {
  const base = mode === "menswear"
    ? ["短袖衬衫男", "夏季T恤男", "直筒裤男", "德训鞋", "斜挎包男"]
    : ["短袖衬衫女", "高腰半身裙", "显瘦阔腿裤", "玛丽珍鞋", "腋下包"];
  return [item, `${style}同款`, `${bodyType}穿搭`, ...base];
}

function buildSnackTitle(
  item: string,
  audience: string,
  category: string,
  scene: string,
  index: number,
) {
  const pool = [
    `${audience}${scene}可以测这类${category}`,
    `${item}这样拍，比清单字图更真实`,
    `0粉先测${scene}刚需小物`,
  ];
  return pool[index % pool.length];
}

function buildSnackCaption(
  item: string,
  audience: string,
  category: string,
  scene: string,
) {
  return `${audience}做${category}，先从「${item}」这种${scene}能用上的低门槛商品切入。前期看收藏、评论和商品点击，不建议先囤货。`;
}

function buildSnackTags(audience: string, category: string, scene: string) {
  const categoryTags = /零食|饮料|速食/.test(category)
    ? ["#零食推荐", "#宿舍零食", "#囤货清单"]
    : ["#百货好物", "#租房好物", "#宿舍好物"];
  return [`#${audience}`, `#${scene}`, ...categoryTags, "#平价好物", "#抖音图文"].map((tag) =>
    tag.replace(/\s+/g, ""),
  );
}

function buildSnackKeywords(item: string, category: string, scene: string) {
  const base = /零食|饮料|速食/.test(category)
    ? ["低卡零食", "无糖饮料", "办公室零食", "宿舍囤货", "速食夜宵"]
    : ["桌面收纳", "厨房收纳", "清洁消耗品", "防暑降温", "租房神器"];
  return [item, `${scene}好物`, `${category}平价`, ...base];
}

export type MenswearCopyBundle = {
  title: string;
  caption: string;
  tags: string[];
  productKeywords: string[];
};

/**
 * 为男装严格保真生图构建文案包（标题、文案、标签、选品关键词）。
 *
 * 从项目描述中尝试匹配受众与风格，未匹配到时使用默认值。
 * 每张图片通过 index 轮换不同的标题。
 */
export function buildMenswearCopyBundle(input: {
  description: string;
  referenceNames: string[];
  batchCount: number;
  index: number;
}): MenswearCopyBundle {
  const presets = getFashionPresets("menswear");
  const rawDescription = input.description.trim();

  // 尝试从描述中匹配受众，默认"大学生"
  const matchedAudience = presets.audiences.find(
    (audience) => rawDescription.includes(audience),
  );
  const audience = matchedAudience ?? "大学生";

  // 尝试从描述中匹配风格，默认"干净男友风"
  const matchedStyle = presets.styles.find(
    (style) => rawDescription.includes(style),
  );
  const style = matchedStyle ?? "干净男友风";

  // 默认身材
  const bodyType = "178标准身材";

  // item 优先使用参考素材名称，其次使用描述，最后兜底
  const referenceItem = input.referenceNames.length > 0
    ? input.referenceNames[0]
    : "";
  const item = referenceItem || rawDescription || "男装穿搭";

  const title = buildFashionTitle("menswear", item, audience, style, input.index);
  const caption = buildFashionCaption("menswear", item, audience, bodyType, style);
  const tags = buildFashionTags("menswear", audience, style, bodyType);
  const productKeywords = buildFashionKeywords("menswear", item, bodyType, style);

  return { title, caption, tags, productKeywords };
}
