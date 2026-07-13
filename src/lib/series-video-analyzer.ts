export type SeriesVideoPlatform =
  | "douyin"
  | "xiaohongshu"
  | "bilibili"
  | "other";

export type SeriesVideoMetrics = {
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  shares: number;
  followersGained: number;
  completionRate: number;
  averageWatchSeconds: number;
};

export type SeriesVideoInput = {
  accountType?: string;
  averageWatchSeconds?: number;
  contentSummary?: string;
  durationSeconds?: number;
  episode?: number;
  link?: string;
  metrics?: Partial<SeriesVideoMetrics>;
  niche?: string;
  platform?: SeriesVideoPlatform;
  publishedAt?: string;
  title?: string;
};

export type SeriesVideoDerivedMetrics = {
  commentRate: number;
  favoriteRate: number;
  followerRate: number;
  interactionRate: number;
  likeRate: number;
  shareRate: number;
};

export type SeriesVideoAnalysis = {
  derivedMetrics: SeriesVideoDerivedMetrics;
  insights: string[];
  input: SeriesVideoInput;
  metrics: SeriesVideoMetrics;
  nextActions: string[];
  platform: SeriesVideoPlatform;
  primaryDiagnosis: string;
  scoreLabel: string;
  titleSuggestions: string[];
};

const emptyMetrics: SeriesVideoMetrics = {
  averageWatchSeconds: 0,
  comments: 0,
  completionRate: 0,
  favorites: 0,
  followersGained: 0,
  likes: 0,
  shares: 0,
  views: 0,
};

const platformLabels: Record<SeriesVideoPlatform, string> = {
  bilibili: "B站",
  douyin: "抖音",
  other: "其他平台",
  xiaohongshu: "小红书",
};

export function detectVideoPlatform(link?: string): SeriesVideoPlatform {
  const normalizedLink = link?.trim().toLowerCase();

  if (!normalizedLink) {
    return "other";
  }

  if (
    normalizedLink.includes("douyin.com") ||
    normalizedLink.includes("v.douyin.com")
  ) {
    return "douyin";
  }

  if (
    normalizedLink.includes("xiaohongshu.com") ||
    normalizedLink.includes("xhslink.com")
  ) {
    return "xiaohongshu";
  }

  if (
    normalizedLink.includes("bilibili.com") ||
    normalizedLink.includes("b23.tv")
  ) {
    return "bilibili";
  }

  return "other";
}

export function normalizeSeriesVideoMetrics(
  metrics?: Partial<SeriesVideoMetrics>,
): SeriesVideoMetrics {
  return {
    averageWatchSeconds: normalizePositiveNumber(metrics?.averageWatchSeconds),
    comments: normalizePositiveNumber(metrics?.comments),
    completionRate: clamp(normalizePositiveNumber(metrics?.completionRate), 0, 100),
    favorites: normalizePositiveNumber(metrics?.favorites),
    followersGained: normalizePositiveNumber(metrics?.followersGained),
    likes: normalizePositiveNumber(metrics?.likes),
    shares: normalizePositiveNumber(metrics?.shares),
    views: normalizePositiveNumber(metrics?.views),
  };
}

export function analyzeSeriesVideo(
  input: SeriesVideoInput,
): SeriesVideoAnalysis {
  const metrics = normalizeSeriesVideoMetrics(input.metrics);
  const platform =
    input.platform && input.platform !== "other"
      ? input.platform
      : detectVideoPlatform(input.link);
  const derivedMetrics = buildDerivedMetrics(metrics);
  const hasAnyData = Object.values(metrics).some((value) => value > 0);
  const niche = input.niche?.trim() || "当前赛道";

  if (!hasAnyData) {
    return {
      derivedMetrics,
      input,
      insights: [
        `${platformLabels[platform]}链接已记录，建议补充播放、互动、完播和涨粉数据后再做强诊断。`,
        "第一版分析以手动数据为准，链接主要用于平台识别和素材归档。",
      ],
      metrics,
      nextActions: [
        "补充播放量、点赞、评论、收藏、涨粉和完播率。",
        "补充标题和内容简述，用来判断问题是在选题、开头还是结构。",
        `下一条先围绕“${niche}真实过程 + 数据结果”做复盘。`,
      ],
      platform,
      primaryDiagnosis: "需要补充基础数据，当前只能做平台识别和复盘模板建议。",
      scoreLabel: "待补充数据",
      titleSuggestions: buildTitleSuggestions(niche),
    };
  }

  const insights = buildInsights(metrics, derivedMetrics);
  const primaryDiagnosis = choosePrimaryDiagnosis(metrics, derivedMetrics);

  return {
    derivedMetrics,
    input,
    insights,
    metrics,
    nextActions: buildNextActions(primaryDiagnosis, niche),
    platform,
    primaryDiagnosis,
    scoreLabel: chooseScoreLabel(metrics, derivedMetrics),
    titleSuggestions: buildTitleSuggestions(niche),
  };
}

export function buildSeriesVideoReport(analysis: SeriesVideoAnalysis): string {
  const title = analysis.input.title?.trim() || "未填写标题";
  const niche = analysis.input.niche?.trim() || "当前赛道";

  return [
    "系列视频分析报告",
    "",
    `标题：${title}`,
    `赛道：${niche}`,
    `平台：${platformLabels[analysis.platform]}`,
    `评级：${analysis.scoreLabel}`,
    "",
    "核心诊断",
    analysis.primaryDiagnosis,
    "",
    "关键数据",
    `播放：${analysis.metrics.views}`,
    `点赞率：${formatRate(analysis.derivedMetrics.likeRate)}`,
    `评论率：${formatRate(analysis.derivedMetrics.commentRate)}`,
    `收藏率：${formatRate(analysis.derivedMetrics.favoriteRate)}`,
    `涨粉率：${formatRate(analysis.derivedMetrics.followerRate)}`,
    `完播率：${formatRate(analysis.metrics.completionRate / 100)}`,
    "",
    "数据解读",
    ...analysis.insights.map((item) => `- ${item}`),
    "",
    "下一步建议",
    ...analysis.nextActions.map((item) => `- ${item}`),
    "",
    "标题候选",
    ...analysis.titleSuggestions.map((item) => `- ${item}`),
  ].join("\n");
}

function buildDerivedMetrics(
  metrics: SeriesVideoMetrics,
): SeriesVideoDerivedMetrics {
  if (metrics.views <= 0) {
    return {
      commentRate: 0,
      favoriteRate: 0,
      followerRate: 0,
      interactionRate: 0,
      likeRate: 0,
      shareRate: 0,
    };
  }

  const interactions =
    metrics.likes + metrics.comments + metrics.favorites + metrics.shares;

  return {
    commentRate: metrics.comments / metrics.views,
    favoriteRate: metrics.favorites / metrics.views,
    followerRate: metrics.followersGained / metrics.views,
    interactionRate: interactions / metrics.views,
    likeRate: metrics.likes / metrics.views,
    shareRate: metrics.shares / metrics.views,
  };
}

function buildInsights(
  metrics: SeriesVideoMetrics,
  derived: SeriesVideoDerivedMetrics,
) {
  const insights = [
    `互动率 ${formatRate(derived.interactionRate)}，用于判断观众是否只是路过。`,
    `涨粉率 ${formatRate(derived.followerRate)}，用于判断系列人设是否被记住。`,
  ];

  if (metrics.views === 0 && hasEngagement(metrics)) {
    insights.push("播放量为 0 但存在互动数据，建议先核对后台数据录入。");
  }

  if (metrics.completionRate > 0) {
    insights.push(`完播率 ${formatRate(metrics.completionRate / 100)}，优先用于判断开头和中段结构。`);
  }

  if (derived.favoriteRate >= 0.06) {
    insights.push("收藏率较高，内容对观众有参考价值，可以加强标题封面的点击理由。");
  }

  if (derived.commentRate >= 0.02) {
    insights.push("评论率较高，说明选题有情绪或讨论空间，下一条要承接评论区问题。");
  }

  return insights;
}

function choosePrimaryDiagnosis(
  metrics: SeriesVideoMetrics,
  derived: SeriesVideoDerivedMetrics,
) {
  if (metrics.views === 0 && hasEngagement(metrics)) {
    return "数据存在异常：播放量为 0 但有互动，建议先核对录入后再判断内容问题。";
  }

  if (metrics.views >= 5000 && derived.followerRate < 0.001) {
    return "播放已经打开，但涨粉弱，核心问题更可能是人设记忆点或系列承接不足。";
  }

  if (metrics.views <= 500 && derived.favoriteRate >= 0.06) {
    return "内容有价值但没有被充分点击，优先优化标题封面和前 3 秒开头。";
  }

  if (derived.commentRate >= 0.02 && derived.favoriteRate < 0.01) {
    return "评论意愿强但收藏弱，情绪或争议够了，信息沉淀和复用价值不足。";
  }

  if (derived.favoriteRate >= 0.04 && derived.commentRate < 0.005) {
    return "收藏表现好但评论弱，内容有用但互动问题设计不足。";
  }

  if (metrics.completionRate > 0 && metrics.completionRate < 35) {
    return "完播率偏低，优先重做开头钩子和中段节奏。";
  }

  if (derived.followerRate >= 0.008) {
    return "涨粉效率不错，当前赛道和表达方式值得继续做第二条或复盘条。";
  }

  return "数据没有明显单点优势，建议换一个更具体的切入角度后重测。";
}

function buildNextActions(primaryDiagnosis: string, niche: string) {
  if (primaryDiagnosis.includes("人设")) {
    return [
      "下一条开头先说你是谁、正在挑战什么，以及本条和系列主线的关系。",
      `补一条“挑战${niche}后我发现最难的不是内容，而是人设被记住”的复盘。`,
      "结尾固定引导观众评论下一个想看的赛道，增强系列追更感。",
    ];
  }

  if (primaryDiagnosis.includes("标题封面")) {
    return [
      "下一条先重写标题，把结果、成本、天数或翻车点放到最前面。",
      `封面文案建议使用“${niche}｜普通人真能做吗”。`,
      "前 3 秒直接给结论或冲突，不要先铺垫背景。",
    ];
  }

  if (primaryDiagnosis.includes("评论")) {
    return [
      "下一条从评论区挑一个具体问题做回应。",
      "把情绪点后面补上步骤、数据或成本，让观众有收藏理由。",
      "置顶评论问观众是否要按他们的方法重测一次。",
    ];
  }

  if (primaryDiagnosis.includes("收藏")) {
    return [
      "下一条结尾加一个更具体的问题，引导观众说出自己的赛道或数据。",
      "把有用信息拆成 3 个清晰判断，降低评论门槛。",
      "标题中加入“我建议普通人先看完再做”。",
    ];
  }

  if (primaryDiagnosis.includes("完播率")) {
    return [
      "下一条删除长铺垫，开头 3 秒直接抛出结果或最大翻车点。",
      "中段按“规则-执行-数据-结论”四段走，每段只保留一个信息点。",
      "用字幕标出挑战天数、投入成本和当前数据，减少理解成本。",
    ];
  }

  if (primaryDiagnosis.includes("值得继续")) {
    return [
      `下一条继续${niche}，做“第 2 天/第 2 条”的过程更新。`,
      "把评论区问题做成下一条开头，承接已有关注。",
      "开始记录同赛道 3 条数据，不要只用单条判断赛道。",
    ];
  }

  return [
    "下一条换一个更具体的冲突切口，避免只说“挑战开始”。",
    `用“我以为${niche}很简单，结果最难的是 X”作为开头结构。`,
    "如果连续 3 条都没有有效互动，再考虑暂停该赛道。",
  ];
}

function buildTitleSuggestions(niche: string) {
  return [
    `我用 7 天挑战${niche}，普通人到底能不能做起来`,
    `挑战${niche}第 1 天，我发现新手最容易卡在这一步`,
    `我以为${niche}很好做，结果真实数据出来了`,
  ];
}

function chooseScoreLabel(
  metrics: SeriesVideoMetrics,
  derived: SeriesVideoDerivedMetrics,
) {
  if (derived.followerRate >= 0.008 || metrics.completionRate >= 70) {
    return "建议继续";
  }

  if (
    derived.favoriteRate >= 0.04 ||
    derived.commentRate >= 0.02 ||
    derived.interactionRate >= 0.08
  ) {
    return "建议优化后重测";
  }

  if (metrics.views <= 200 && derived.interactionRate < 0.03) {
    return "建议换切口";
  }

  return "需要继续观察";
}

function normalizePositiveNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasEngagement(metrics: SeriesVideoMetrics) {
  return (
    metrics.likes +
      metrics.comments +
      metrics.favorites +
      metrics.shares +
      metrics.followersGained >
    0
  );
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export const seriesVideoPlatformLabels = platformLabels;
export const defaultSeriesVideoMetrics = emptyMetrics;
