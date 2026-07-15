import {
  filterHotspotEntries,
  hotspotEntries,
  hotspotPlatformLabels,
  hotspotTopicOptions,
  type HotspotPlatform,
  type HotspotTopic,
} from "@/lib/hotspot-radar";

export type HotspotQueryPlatform = HotspotPlatform | "all";
export type HotspotQueryTopic = HotspotTopic | "all";

export type NormalizedHotspotQuery = {
  platform: HotspotQueryPlatform;
  query: string;
  topic: HotspotQueryTopic;
};

export type RealHotspotItem = {
  author?: string;
  heatLabel?: string;
  id: string;
  kind: "real";
  rank: number;
  title: string;
  topic: HotspotTopic;
  url: string;
};

export type FallbackHotspotItem = {
  description: string;
  id: string;
  kind: "fallback";
  reason: string;
  title: string;
  topic: HotspotTopic;
  url: string;
};

export type HotspotSourceResult = {
  fetchedAt: string;
  items: Array<RealHotspotItem | FallbackHotspotItem>;
  message: string;
  platform: HotspotPlatform;
  sourceName: string;
  sourceUrl: string;
  status: "real" | "fallback" | "unavailable";
};

export type HotspotAnalysis = {
  basis: "real-data" | "fallback-context";
  commerceAngles: string[];
  contentAngles: string[];
  platformFit: string[];
  riskChecks: string[];
  trendSummary: string;
};

export type HotspotQueryResponse = {
  analysis: HotspotAnalysis;
  fetchedAt: string;
  query: NormalizedHotspotQuery;
  sources: HotspotSourceResult[];
};

type RawBilibiliPopularItem = {
  bvid?: unknown;
  owner?: {
    name?: unknown;
  };
  stat?: {
    like?: unknown;
    view?: unknown;
  };
  title?: unknown;
};

const BILIBILI_POPULAR_API =
  "https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1";

const platforms: HotspotPlatform[] = ["douyin", "xiaohongshu", "bilibili"];

export function normalizeHotspotQuery(input: {
  platform?: string | null;
  query?: string | null;
  topic?: string | null;
}): NormalizedHotspotQuery {
  const platform = platforms.includes(input.platform as HotspotPlatform)
    ? (input.platform as HotspotPlatform)
    : "all";
  const topicValues = hotspotTopicOptions.filter((topic) => topic !== "全部");
  const topic = topicValues.includes(input.topic as HotspotTopic)
    ? (input.topic as HotspotTopic)
    : "all";

  return {
    platform,
    query: input.query?.trim() ?? "",
    topic,
  };
}

export function normalizeBilibiliPopularItems(
  items: RawBilibiliPopularItem[],
): RealHotspotItem[] {
  const normalizedItems: RealHotspotItem[] = [];

  items.forEach((item, index) => {
    const bvid = typeof item.bvid === "string" ? item.bvid : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";

    if (!bvid || !title) {
      return;
    }

    const view = typeof item.stat?.view === "number" ? item.stat.view : 0;
    const like = typeof item.stat?.like === "number" ? item.stat.like : 0;
    const author =
      typeof item.owner?.name === "string" ? item.owner.name : undefined;
    const normalizedItem: RealHotspotItem = {
      heatLabel: `${formatChineseCount(view)}播放 · ${formatChineseCount(like)}点赞`,
      id: `bilibili-${bvid}`,
      kind: "real",
      rank: index + 1,
      title,
      topic: inferTopicFromText(title),
      url: `https://www.bilibili.com/video/${bvid}`,
    };

    if (author) {
      normalizedItem.author = author;
    }

    normalizedItems.push(normalizedItem);
  });

  return normalizedItems;
}

export function buildFallbackSourceResult(
  platform: HotspotPlatform,
  fetchedAt: string,
  message: string,
  filter: Pick<NormalizedHotspotQuery, "query" | "topic"> = {
    query: "",
    topic: "all",
  },
): HotspotSourceResult {
  const topic = filter.topic === "all" ? "全部" : filter.topic;
  const entries = filterHotspotEntries({
    platform,
    query: filter.query,
    topic,
  });
  const sourceEntry =
    entries[0] ?? hotspotEntries.find((entry) => entry.platform === platform);

  return {
    fetchedAt,
    items: entries.map((entry) => ({
      description: entry.description,
      id: `${entry.id}-fallback`,
      kind: "fallback" as const,
      reason: "当前版本不绕过登录、反爬或平台限制，请打开官方入口确认实时结果。",
      title: entry.title,
      topic: entry.topic,
      url: entry.href,
    })),
    message,
    platform,
    sourceName: `${hotspotPlatformLabels[platform]}官方入口`,
    sourceUrl: sourceEntry?.href ?? "",
    status: "fallback",
  };
}

export function buildUnavailableSourceResult(
  platform: HotspotPlatform,
  fetchedAt: string,
  message: string,
): HotspotSourceResult {
  return {
    fetchedAt,
    items: [],
    message,
    platform,
    sourceName: `${hotspotPlatformLabels[platform]}公开数据`,
    sourceUrl: "",
    status: "unavailable",
  };
}

export function buildHotspotAnalysis({
  platform,
  query,
  sources,
  topic,
}: NormalizedHotspotQuery & {
  sources: HotspotSourceResult[];
}): HotspotAnalysis {
  const realItems = sources.flatMap((source) =>
    source.items.filter((item): item is RealHotspotItem => item.kind === "real"),
  );
  const scope = [
    platform === "all" ? "全平台" : hotspotPlatformLabels[platform],
    topic === "all" ? "全类型" : topic,
    query ? `关键词「${query}」` : "未指定关键词",
  ].join(" · ");

  if (realItems.length > 0) {
    const topItems = realItems
      .slice(0, 3)
      .map((item) => `#${item.rank} ${item.title}`)
      .join("；");

    return {
      basis: "real-data",
      commerceAngles: buildCommerceAngles(query, topic),
      contentAngles: [
        `优先拆解真实榜单前排内容：${topItems}`,
        "把标题、封面承诺、评论区争议点拆开，复用为短视频脚本或图文选题。",
        "对同主题做反向角度、避坑角度和清单角度，避免只复述热点。",
      ],
      platformFit: buildPlatformFit(platform),
      riskChecks: [
        "发布前打开原始链接复核标题、排名和评论变化。",
        "不要把单个平台热门直接等同于全网趋势。",
        "涉及社会、财经、医疗或争议人物时，先做事实核验再创作。",
      ],
      trendSummary: `基于本次获取的真实数据（${scope}），可优先观察：${topItems}。`,
    };
  }

  return {
    basis: "fallback-context",
    commerceAngles: buildCommerceAngles(query, topic),
    contentAngles: [
      query
        ? `围绕「${query}」先在官方入口确认实时结果，再拆解高互动内容。`
        : "先打开官方入口查看实时榜单，再选择一个具体关键词做二次查询。",
      "记录高频标题词、评论区疑问和用户情绪，再转成内容选题。",
      "不要把当前页面的官方入口当作实时榜单结论。",
    ],
    platformFit: buildPlatformFit(platform),
    riskChecks: [
      "当前结果不是实时榜单结论，需要打开官方页面确认。",
      "确认发布时间、互动量和评论方向后再判断是否跟进。",
      "平台搜索结果会个性化，建议用多个关键词交叉验证。",
    ],
    trendSummary: `当前没有可展示的站内真实热点数据；以下分析基于${scope}和平台特征，不是实时榜单结论。`,
  };
}

export async function queryHotspotSources(
  query: NormalizedHotspotQuery,
  fetcher: typeof fetch = fetch,
): Promise<HotspotQueryResponse> {
  const fetchedAt = new Date().toISOString();
  const selectedPlatforms =
    query.platform === "all" ? platforms : [query.platform];
  const sources = await Promise.all(
    selectedPlatforms.map((platform) =>
      platform === "bilibili"
        ? fetchBilibiliSource(query, fetchedAt, fetcher)
        : Promise.resolve(
            buildUnavailableSourceResult(
              platform,
              fetchedAt,
              `${hotspotPlatformLabels[platform]}未提供可稳定访问的公开热榜接口，本次未把导航链接当作热点数据。`,
            ),
          ),
    ),
  );

  return {
    analysis: buildHotspotAnalysis({ ...query, sources }),
    fetchedAt,
    query,
    sources,
  };
}

async function fetchBilibiliSource(
  query: NormalizedHotspotQuery,
  fetchedAt: string,
  fetcher: typeof fetch,
): Promise<HotspotSourceResult> {
  try {
    const response = await fetcher(BILIBILI_POPULAR_API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return buildUnavailableSourceResult(
        "bilibili",
        fetchedAt,
        "B站热门接口暂时不可用，本次未展示伪造或缓存的热点数据。",
      );
    }

    const payload = (await response.json()) as {
      data?: {
        list?: RawBilibiliPopularItem[];
      };
    };
    const rawItems = Array.isArray(payload.data?.list) ? payload.data.list : [];
    const items = filterRealItems(
      normalizeBilibiliPopularItems(rawItems),
      query,
    );

    return {
      fetchedAt,
      items,
      message:
        items.length > 0
          ? "已获取 B站热门真实数据。"
          : "已获取 B站热门真实数据，但当前筛选条件下没有匹配条目。",
      platform: "bilibili",
      sourceName: "B站热门",
      sourceUrl: BILIBILI_POPULAR_API,
      status: "real",
    };
  } catch {
    return buildUnavailableSourceResult(
      "bilibili",
      fetchedAt,
      "B站热门数据获取失败，本次未展示伪造或缓存的热点数据。",
    );
  }
}

function filterRealItems(
  items: RealHotspotItem[],
  query: NormalizedHotspotQuery,
) {
  const keyword = query.query.toLowerCase();

  return items.filter((item) => {
    if (query.topic !== "all" && item.topic !== query.topic) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return [item.title, item.author, item.topic, item.heatLabel]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(keyword));
  });
}

function inferTopicFromText(text: string): HotspotTopic {
  const lowerText = text.toLowerCase();

  if (/(ai|aigc|模型|智能体|机器人|deepseek|openai|chatgpt)/i.test(lowerText)) {
    return "AI";
  }
  if (/(游戏|手游|steam|主机|玩家|攻略|电竞)/.test(text)) {
    return "游戏";
  }
  if (/(电影|电视剧|影视|短剧|综艺|番剧|动画)/.test(text)) {
    return "影视";
  }
  if (/(科技|手机|电脑|芯片|数码|汽车)/.test(text)) {
    return "科技";
  }
  if (/(财经|股票|基金|消费|商业|经济)/.test(text)) {
    return "财经";
  }
  if (/(知识|教程|科普|学习|历史|人文)/.test(text)) {
    return "知识";
  }
  if (/(商品|好物|带货|电商|开箱|测评)/.test(text)) {
    return "电商";
  }
  if (/(明星|娱乐|八卦|演唱会)/.test(text)) {
    return "娱乐";
  }
  if (/(社会|事件|新闻|公共)/.test(text)) {
    return "社会";
  }
  if (/(生活|穿搭|美食|旅行|家居|情绪)/.test(text)) {
    return "生活";
  }

  return "综合";
}

function formatChineseCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }

  return String(value);
}

function buildCommerceAngles(
  query: string,
  topic: HotspotQueryTopic,
): string[] {
  if (topic === "电商") {
    return [
      "提炼商品痛点、价格锚点和使用场景，转成种草或测评脚本。",
      "观察评论区的购买顾虑，补成问答型内容。",
    ];
  }

  if (query) {
    return [
      `判断「${query}」是否能绑定具体产品、服务或工具清单。`,
      "优先选择能展示前后对比、使用场景和真实反馈的角度。",
    ];
  }

  return [
    "先确认热点是否能连接到具体人群、场景和可交付结果。",
    "避免为了追热点硬塞商品，先验证用户需求是否真实存在。",
  ];
}

function buildPlatformFit(platform: HotspotQueryPlatform): string[] {
  if (platform === "douyin") {
    return ["抖音适合强情绪、强反差、短时间讲清楚的热点跟进。"];
  }

  if (platform === "xiaohongshu") {
    return ["小红书适合经验分享、生活方式、种草清单和评论区共鸣。"];
  }

  if (platform === "bilibili") {
    return ["B站适合长视频拆解、知识解释、测评复盘和社区讨论延展。"];
  }

  return [
    "抖音适合快速抓注意力，小红书适合沉淀场景和信任，B站适合做深度解释和复盘。",
  ];
}
