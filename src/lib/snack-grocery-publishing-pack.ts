export type SnackGroceryAccountStage =
  | "cold_start"
  | "low_follower"
  | "test_product"
  | "conversion_warmup";

export type SnackGroceryPublishingGoal =
  | "traffic"
  | "effective_followers"
  | "test_product"
  | "ask_link"
  | "conversion_warmup";

export type SnackGroceryContentType =
  | "checklist"
  | "avoidance"
  | "scenario"
  | "judgement"
  | "comment_reply";

export type SnackGroceryColumnTemplate =
  | "dorm_snack_checklist"
  | "office_snack_drawer"
  | "drama_night_snack"
  | "rental_kitchen_goods"
  | "rental_bathroom_cleaning"
  | "summer_back_to_school";

export type SnackGroceryMaterialMode =
  | "product_and_scene"
  | "product_only"
  | "description_only"
  | "category_only";

export type SnackGrocerySceneStrategy = "recommended" | "custom";
export type SnackGroceryMaterialLevel = "A" | "B" | "C" | "D";

export type SnackGroceryPublishingPackInput = {
  accountStage?: SnackGroceryAccountStage;
  publishingGoal?: SnackGroceryPublishingGoal;
  contentType?: SnackGroceryContentType;
  columnTemplate?: SnackGroceryColumnTemplate;
  audience?: string;
  category?: string;
  itemDescription?: string;
  materialMode?: SnackGroceryMaterialMode;
  sceneStrategy?: SnackGrocerySceneStrategy;
  customScene?: string;
  extraInstructions?: string;
};

export type SnackGroceryStoryboardItem = {
  index: number;
  role: string;
  visualDirection: string;
  copyCue: string;
  imagePrompt: string;
};

export type SnackGroceryPublishingPack = {
  positioning: string;
  materialLevel: SnackGroceryMaterialLevel;
  materialSummary: string;
  selectedScene: string;
  recommendedScenes: string[];
  titleOptions: string[];
  firstImageHooks: string[];
  storyboard: SnackGroceryStoryboardItem[];
  caption: string;
  pinnedComment: string;
  tags: string[];
  productKeywords: string[];
  materialNeeds: string[];
  missingMaterialPlan: string;
  riskNotes: string[];
  reviewFields: string[];
};

const accountStages = [
  { value: "cold_start", label: "0粉冷启动" },
  { value: "low_follower", label: "低粉稳定发布" },
  { value: "test_product", label: "测品阶段" },
  { value: "conversion_warmup", label: "转化预热" },
] satisfies Array<{ value: SnackGroceryAccountStage; label: string }>;

const publishingGoals = [
  { value: "traffic", label: "跑流量" },
  { value: "effective_followers", label: "留有效粉丝" },
  { value: "test_product", label: "测品" },
  { value: "ask_link", label: "问链接" },
  { value: "conversion_warmup", label: "后期转化预热" },
] satisfies Array<{ value: SnackGroceryPublishingGoal; label: string }>;

const contentTypes = [
  { value: "checklist", label: "清单型" },
  { value: "avoidance", label: "避坑型" },
  { value: "scenario", label: "场景型" },
  { value: "judgement", label: "判断型" },
  { value: "comment_reply", label: "评论答疑型" },
] satisfies Array<{ value: SnackGroceryContentType; label: string }>;

const columnTemplates = [
  { value: "dorm_snack_checklist", label: "宿舍零食清单" },
  { value: "office_snack_drawer", label: "办公室抽屉零食" },
  { value: "drama_night_snack", label: "追剧/夜宵小吃" },
  { value: "rental_kitchen_goods", label: "出租屋厨房小物" },
  { value: "rental_bathroom_cleaning", label: "卫生间清洁收纳" },
  { value: "summer_back_to_school", label: "夏季/返校短期好物" },
] satisfies Array<{ value: SnackGroceryColumnTemplate; label: string }>;

const materialModes = [
  { value: "product_and_scene", label: "商品图 + 场景图" },
  { value: "product_only", label: "只有商品图" },
  { value: "description_only", label: "只有商品描述" },
  { value: "category_only", label: "只有品类方向" },
] satisfies Array<{ value: SnackGroceryMaterialMode; label: string }>;

const defaultAudiences = ["办公室打工人", "宿舍党", "租房党", "大学生", "暑假返校人群"];
const defaultCategories = ["办公室零食", "零食饮料", "速食夜宵", "厨房小物", "清洁消耗品", "防暑降温"];

const reviewFields = [
  "发布日期",
  "账号",
  "栏目",
  "内容类型",
  "标题",
  "首图方案",
  "商品或品类",
  "素材等级",
  "发布时间",
  "播放量",
  "点赞",
  "评论",
  "收藏",
  "转发",
  "主页访问",
  "新增关注",
  "是否有人问链接",
  "是否有人问清单",
  "橱窗点击",
  "是否成交",
  "备注",
];

export function getSnackGroceryPublishingPresets() {
  return {
    accountStages,
    publishingGoals,
    contentTypes,
    columnTemplates,
    materialModes,
    sceneStrategies: [
      { value: "recommended", label: "系统推荐场景" },
      { value: "custom", label: "自定义场景" },
    ] satisfies Array<{ value: SnackGrocerySceneStrategy; label: string }>,
    audiences: defaultAudiences,
    categories: defaultCategories,
  };
}

export function buildSnackGroceryPublishingPack(
  input: SnackGroceryPublishingPackInput,
): SnackGroceryPublishingPack {
  const accountStage = input.accountStage ?? "cold_start";
  const publishingGoal = input.publishingGoal ?? "traffic";
  const contentType = input.contentType ?? "checklist";
  const columnTemplate = input.columnTemplate ?? "office_snack_drawer";
  const audience = input.audience?.trim() || audienceForColumn(columnTemplate);
  const category = input.category?.trim() || categoryForColumn(columnTemplate);
  const item = input.itemDescription?.trim() || itemForColumn(columnTemplate);
  const materialMode = input.materialMode ?? "category_only";
  const sceneStrategy = input.sceneStrategy ?? "recommended";
  const recommendedScenes = recommendScenes({ category, item, columnTemplate });
  const selectedScene =
    sceneStrategy === "custom" && input.customScene?.trim()
      ? input.customScene.trim()
      : recommendedScenes[0];
  const materialLevel = resolveMaterialLevel(materialMode);
  const materialSummary = summarizeMaterial(materialMode);
  const titleOptions = buildTitleOptions({
    audience,
    category,
    contentType,
    item,
    selectedScene,
  });
  const firstImageHooks = buildFirstImageHooks({
    audience,
    category,
    contentType,
    item,
    selectedScene,
  });
  const storyboard = buildStoryboard({
    audience,
    category,
    extraInstructions: input.extraInstructions?.trim() || "",
    firstImageHooks,
    item,
    materialMode,
    selectedScene,
  });

  return {
    positioning: `${labelFor(accountStages, accountStage)} / ${labelFor(publishingGoals, publishingGoal)} / ${labelFor(contentTypes, contentType)} / ${labelFor(columnTemplates, columnTemplate)}`,
    materialLevel,
    materialSummary,
    selectedScene,
    recommendedScenes,
    titleOptions,
    firstImageHooks,
    storyboard,
    caption: buildCaption({ audience, category, contentType, item }),
    pinnedComment: buildPinnedComment(columnTemplate, publishingGoal),
    tags: buildTags({ audience, category, columnTemplate }),
    productKeywords: buildProductKeywords({ category, item, selectedScene }),
    materialNeeds: buildMaterialNeeds(materialMode, selectedScene),
    missingMaterialPlan: buildMissingMaterialPlan(materialMode),
    riskNotes: buildRiskNotes(category),
    reviewFields,
  };
}

function labelFor<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function resolveMaterialLevel(mode: SnackGroceryMaterialMode): SnackGroceryMaterialLevel {
  if (mode === "product_and_scene") return "A";
  if (mode === "product_only") return "B";
  if (mode === "description_only") return "C";
  return "D";
}

function summarizeMaterial(mode: SnackGroceryMaterialMode) {
  const summaries: Record<SnackGroceryMaterialMode, string> = {
    product_and_scene: "A 级：商品图 + 场景图，适合做更真实的转化素材。",
    product_only: "B 级：商品图 + 无场景图，系统推荐场景后继续生成。",
    description_only: "C 级：无商品图 + 有商品描述，适合做品类内容和清单内容。",
    category_only: "D 级：无商品图 + 无具体商品，适合栏目化跑流量。",
  };

  return summaries[mode];
}

function audienceForColumn(column: SnackGroceryColumnTemplate) {
  if (column === "office_snack_drawer") return "办公室打工人";
  if (column === "rental_kitchen_goods" || column === "rental_bathroom_cleaning") return "租房党";
  if (column === "summer_back_to_school") return "暑假返校人群";
  return "宿舍党";
}

function categoryForColumn(column: SnackGroceryColumnTemplate) {
  if (column === "rental_kitchen_goods") return "厨房小物";
  if (column === "rental_bathroom_cleaning") return "清洁消耗品";
  if (column === "summer_back_to_school") return "防暑降温";
  if (column === "drama_night_snack") return "速食夜宵";
  return "办公室零食";
}

function itemForColumn(column: SnackGroceryColumnTemplate) {
  const items: Record<SnackGroceryColumnTemplate, string> = {
    dorm_snack_checklist: "宿舍独立包装零食",
    office_snack_drawer: "办公室抽屉零食",
    drama_night_snack: "追剧夜宵小吃",
    rental_kitchen_goods: "出租屋厨房小物",
    rental_bathroom_cleaning: "卫生间清洁收纳",
    summer_back_to_school: "夏季返校短期好物",
  };

  return items[column];
}

function recommendScenes(input: {
  category: string;
  item: string;
  columnTemplate: SnackGroceryColumnTemplate;
}) {
  const text = `${input.category} ${input.item}`;

  if (/无糖|饮料|茶|咖啡/.test(text)) {
    return ["办公室抽屉", "工位桌面", "公司冰箱", "午休桌边", "加班桌面"];
  }

  if (/坚果|饼干|糕点|零食|办公室/.test(text)) {
    return ["办公室抽屉", "下午茶桌面", "工位角落", "会议前桌面", "通勤包"];
  }

  if (/速食|夜宵|泡面|粉丝|追剧/.test(text)) {
    return ["宿舍桌面", "夜晚台灯桌面", "小锅旁边", "追剧茶几", "返校囤货角落"];
  }

  if (/收纳|厨房|沥水|过滤|调料/.test(text)) {
    return ["租房小厨房", "水槽边", "调料区", "灶台旁", "使用前后对比"];
  }

  if (/清洁|卫生间|地漏|水垢|马桶/.test(text)) {
    return ["洗手台", "地漏旁", "马桶边", "浴室角落", "水垢局部对比"];
  }

  if (/防暑|夏季|返校|风扇|湿巾|冷泡/.test(text)) {
    return ["通勤包", "宿舍桌面", "办公室工位", "返校行李箱旁", "夏季出门桌面"];
  }

  if (input.columnTemplate === "rental_kitchen_goods") {
    return ["租房小厨房", "水槽边", "调料区", "灶台旁", "使用前后对比"];
  }

  return ["办公室抽屉", "工位桌面", "宿舍桌面", "租房小厨房", "返校行李箱旁"];
}

function buildTitleOptions(input: {
  audience: string;
  category: string;
  contentType: SnackGroceryContentType;
  item: string;
  selectedScene: string;
}) {
  if (input.contentType === "avoidance") {
    return [
      `${input.audience}${input.category}别乱买，先看这3点`,
      `${input.selectedScene}容易踩坑的${input.category}`,
      `${input.item}不是越便宜越适合囤`,
    ];
  }

  if (input.contentType === "judgement") {
    return [
      `${input.audience}买${input.category}前先判断这几件事`,
      `${input.item}适合谁，不适合谁`,
      `${input.selectedScene}要不要囤，看这3个条件`,
    ];
  }

  return [
    `${input.audience}${input.selectedScene}可以先备这几类`,
    `${input.item}这样做图文，更适合前期测流量`,
    `${input.category}清单别太杂，先按场景选`,
  ];
}

function buildFirstImageHooks(input: {
  audience: string;
  category: string;
  contentType: SnackGroceryContentType;
  item: string;
  selectedScene: string;
}) {
  if (input.contentType === "avoidance") {
    return [
      `${input.selectedScene}别乱囤${input.category}`,
      `${input.item}先别急着买`,
      `${input.audience}买之前先看这3点`,
    ];
  }

  if (input.contentType === "scenario") {
    return [
      `${input.selectedScene}真的会用到这些`,
      `${input.audience}这个场景很容易漏买`,
      "不是推荐爆款，是按场景整理",
    ];
  }

  return [
    `${input.selectedScene}可以先备这3类`,
    `${input.audience}${input.category}清单`,
    "前期先收藏，不急着买",
  ];
}

function buildStoryboard(input: {
  audience: string;
  category: string;
  extraInstructions: string;
  firstImageHooks: string[];
  item: string;
  materialMode: SnackGroceryMaterialMode;
  selectedScene: string;
}) {
  const frames = [
    {
      role: "首图钩子",
      visualDirection: `${input.selectedScene}里的${input.category}真实场景，主体清楚，适合抖音图文第一张。`,
      copyCue: input.firstImageHooks[0],
    },
    {
      role: "具体场景",
      visualDirection: `${input.audience}在${input.selectedScene}会遇到的真实使用场景，画面有生活感。`,
      copyCue: "为什么这个场景会用到",
    },
    {
      role: "清单分类",
      visualDirection: `${input.item}相关的 3 类商品或品类组合，摆放整齐但不要广告堆砌。`,
      copyCue: "先看这3类",
    },
    {
      role: "避坑标准",
      visualDirection: "用局部细节表现尺寸、包装、保存方式或使用限制，避免夸张效果。",
      copyCue: "别只看便宜",
    },
    {
      role: "适合/不适合",
      visualDirection: "同一场景下做轻微对比，一边适合囤，一边不建议囤，但图片里不要文字。",
      copyCue: "适合谁 / 不适合谁",
    },
    {
      role: "评论引导",
      visualDirection: `${input.selectedScene}的干净收尾图，保留继续做下一期的空间，不出现文字。`,
      copyCue: "想看下一期评论关键词",
    },
  ];

  return frames.map((frame, index) => ({
    index: index + 1,
    ...frame,
    imagePrompt: buildFramePrompt({
      ...input,
      frameRole: frame.role,
      visualDirection: frame.visualDirection,
    }),
  }));
}

function buildFramePrompt(input: {
  audience: string;
  category: string;
  extraInstructions: string;
  frameRole: string;
  item: string;
  materialMode: SnackGroceryMaterialMode;
  selectedScene: string;
  visualDirection: string;
}) {
  const materialRule =
    input.materialMode === "product_and_scene"
      ? "参考上传商品图和场景图，保持商品包装、颜色、规格感、数量感和场景光线关系。"
      : input.materialMode === "product_only"
        ? "参考上传商品图，保持商品包装、颜色、规格感和数量感；场景由系统生成。"
        : "没有具体商品图，不要生成具体品牌、商标、真实包装或虚构功效，只做品类级内容图。";

  return [
    materialRule,
    `图片角色：${input.frameRole}。`,
    `目标人群：${input.audience}。品类：${input.category}。商品/品类方向：${input.item}。场景：${input.selectedScene}。`,
    input.visualDirection,
    "画面真实自然，像普通用户手机拍摄或轻度整理后的图文素材，不要豪宅感、棚拍广告感、过度滤镜和塑料感。",
    "不要出现任何中文、英文、数字标题、价格、账号、水印、标签、说明文字、品牌logo。",
    "不要夸张食品功效、医疗功效、减肥效果、除菌率、除甲醛、绝对低价或保证效果。",
    input.extraInstructions ? `补充要求：${input.extraInstructions}。` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCaption(input: {
  audience: string;
  category: string;
  contentType: SnackGroceryContentType;
  item: string;
}) {
  const angle =
    input.contentType === "avoidance"
      ? "先避开不适合自己的，再决定要不要囤。"
      : input.contentType === "judgement"
        ? "先判断场景是否真的用得上。"
        : "前期先按场景收藏，不急着乱买。";

  return `${input.audience}做${input.category}，可以先从「${input.item}」这种低门槛内容测起。${angle}评论区可以说你的场景，我继续整理下一期。`;
}

function buildPinnedComment(
  columnTemplate: SnackGroceryColumnTemplate,
  publishingGoal: SnackGroceryPublishingGoal,
) {
  if (publishingGoal === "ask_link") {
    return "想看同类清单可以评论场景，我优先整理对应方向。";
  }

  if (columnTemplate === "office_snack_drawer") {
    return "想看宿舍版还是办公室版？评论一个场景。";
  }

  if (columnTemplate === "rental_kitchen_goods") {
    return "你家厨房最乱的是水槽边、调料区还是台面？";
  }

  return "想看下一期哪个场景，直接评论关键词。";
}

function buildTags(input: {
  audience: string;
  category: string;
  columnTemplate: SnackGroceryColumnTemplate;
}) {
  const columnTag =
    input.columnTemplate === "office_snack_drawer"
      ? "#办公室零食"
      : input.columnTemplate === "rental_kitchen_goods"
        ? "#出租屋好物"
        : input.columnTemplate === "rental_bathroom_cleaning"
          ? "#清洁收纳"
          : input.columnTemplate === "summer_back_to_school"
            ? "#返校好物"
            : "#宿舍好物";

  return [
    "#抖音图文",
    "#好物分享",
    "#平价好物",
    `#${input.audience}`,
    `#${input.category}`,
    columnTag,
  ].map((tag) => tag.replace(/\s+/g, ""));
}

function buildProductKeywords(input: {
  category: string;
  item: string;
  selectedScene: string;
}) {
  const base = /零食|饮料|速食|夜宵/.test(input.category)
    ? ["独立包装零食", "无糖饮料", "坚果小包", "办公室零食", "宿舍囤货"]
    : ["厨房收纳", "清洁消耗品", "桌面收纳", "出租屋好物", "防暑降温"];

  return [input.item, input.category, `${input.selectedScene}好物`, ...base];
}

function buildMaterialNeeds(
  mode: SnackGroceryMaterialMode,
  selectedScene: string,
) {
  if (mode === "product_and_scene") {
    return ["商品主图 1 张", `${selectedScene}场景图 1 张`, "包装或细节图 1 张"];
  }

  if (mode === "product_only") {
    return ["商品主图 1 张", "包装或细节图 1 张", `${selectedScene}由系统生成`];
  }

  if (mode === "description_only") {
    return ["商品描述 1 段", "品类关键词 3-5 个", `${selectedScene}由系统生成`];
  }

  return ["栏目方向", "目标人群", "品类", "系统生成通用场景"];
}

function buildMissingMaterialPlan(mode: SnackGroceryMaterialMode) {
  if (mode === "product_and_scene") {
    return "素材完整，优先生成真实感更强的作品。";
  }

  if (mode === "product_only") {
    return "缺少场景图时，系统自动推荐场景并生成办公室、宿舍或出租屋背景。";
  }

  if (mode === "description_only") {
    return "缺少商品图时，先生成品类内容，不绑定具体品牌或包装。";
  }

  return "没有具体商品时，先做栏目化清单、避坑和判断内容，用来跑流量和留有效粉丝。";
}

function buildRiskNotes(category: string) {
  const shared = [
    "未实测不要说亲测、吃过、用了很久。",
    "不要写全网最低、保证效果、闭眼入。",
    "不要搬运同行视频、买家秀或直播切片。",
  ];

  if (/零食|饮料|速食|夜宵/.test(category)) {
    return [
      "食品类不要表达减肥、治疗、降糖、降脂、养胃等功效。",
      "注意保质期、临期、破损和口味差评。",
      ...shared,
    ];
  }

  return [
    "百货类不要夸大承重、除菌率、除甲醛或使用前后效果。",
    "注意尺寸、材质、安装方式和破损差评。",
    ...shared,
  ];
}
