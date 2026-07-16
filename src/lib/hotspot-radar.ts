export type HotspotPlatform = "douyin" | "xiaohongshu" | "bilibili";

export type HotspotTopic =
  | "综合"
  | "娱乐"
  | "社会"
  | "科技"
  | "财经"
  | "生活"
  | "影视"
  | "游戏"
  | "知识"
  | "电商"
  | "AI";

export type HotspotEntry = {
  id: string;
  platform: HotspotPlatform;
  title: string;
  description: string;
  topic: HotspotTopic;
  tags: string[];
  href: string;
};

export type HotspotSearchShortcut = {
  platform: HotspotPlatform;
  title: string;
  href: string;
};

export type HotspotFilter = {
  platform?: HotspotPlatform | "全部";
  topic?: HotspotTopic | "全部";
  query?: string;
};

export const hotspotPlatformLabels: Record<HotspotPlatform, string> = {
  bilibili: "B站",
  douyin: "抖音",
  xiaohongshu: "小红书",
};

export const hotspotPlatformOptions = [
  "全部",
  "douyin",
  "xiaohongshu",
  "bilibili",
] as const;

export const hotspotTopicOptions = [
  "全部",
  "综合",
  "娱乐",
  "社会",
  "科技",
  "财经",
  "生活",
  "影视",
  "游戏",
  "知识",
  "电商",
  "AI",
] as const;

export const hotspotEntries: HotspotEntry[] = [
  {
    id: "douyin-hot",
    platform: "douyin",
    title: "抖音热榜",
    description: "观察抖音站内综合热门话题、视频和公共讨论趋势。",
    topic: "综合",
    tags: ["选题观察", "爆款拆解", "评论区洞察"],
    href: "https://www.douyin.com/hot",
  },
  {
    id: "douyin-search",
    platform: "douyin",
    title: "抖音关键词搜索",
    description: "围绕关键词查看短视频、账号、话题和用户讨论。",
    topic: "综合",
    tags: ["关键词验证", "选题观察", "评论区洞察"],
    href: "https://www.douyin.com/search/%E7%83%AD%E7%82%B9",
  },
  {
    id: "douyin-hotspot",
    platform: "douyin",
    title: "抖音热点宝",
    description: "面向内容创作者的热点观察入口，适合追踪热点生命周期。",
    topic: "娱乐",
    tags: ["热点追踪", "内容策划", "爆款拆解"],
    href: "https://creator.douyin.com/creator-micro/hotspot",
  },
  {
    id: "douyin-commerce",
    platform: "douyin",
    title: "抖音电商趋势观察",
    description: "结合电商工具与平台搜索，观察商品、直播和带货内容趋势。",
    topic: "电商",
    tags: ["商品趋势", "直播观察", "爆款拆解"],
    href: "https://qianchuan.jinritemai.com/",
  },
  {
    id: "douyin-ai",
    platform: "douyin",
    title: "抖音 AI 话题观察",
    description: "快速查看 AI 工具、AIGC、智能体和副业类短视频热度。",
    topic: "AI",
    tags: ["AI趋势", "选题观察", "知识内容"],
    href: "https://www.douyin.com/search/AI",
  },
  {
    id: "xiaohongshu-search",
    platform: "xiaohongshu",
    title: "小红书关键词搜索",
    description: "查看笔记、评论和用户真实场景表达，适合生活方式热点观察。",
    topic: "生活",
    tags: ["关键词验证", "评论区洞察", "种草观察"],
    href: "https://www.xiaohongshu.com/search_result?keyword=%E7%83%AD%E7%82%B9",
  },
  {
    id: "xiaohongshu-commerce",
    platform: "xiaohongshu",
    title: "小红书商品与种草趋势",
    description: "观察商品种草、买前决策、合集笔记和消费场景变化。",
    topic: "电商",
    tags: ["商品趋势", "种草观察", "爆款拆解"],
    href: "https://www.xiaohongshu.com/search_result?keyword=%E7%88%86%E6%AC%BE%E5%A5%BD%E7%89%A9",
  },
  {
    id: "xiaohongshu-beauty-life",
    platform: "xiaohongshu",
    title: "小红书生活方式热点",
    description: "覆盖穿搭、美妆、家居、旅行、情绪价值和城市生活方式。",
    topic: "生活",
    tags: ["生活方式", "选题观察", "评论区洞察"],
    href: "https://www.xiaohongshu.com/search_result?keyword=%E7%94%9F%E6%B4%BB%E6%96%B9%E5%BC%8F",
  },
  {
    id: "xiaohongshu-ai",
    platform: "xiaohongshu",
    title: "小红书 AI 应用热点",
    description: "观察 AI 写作、生图、办公、副业和学习类笔记的内容反馈。",
    topic: "AI",
    tags: ["AI趋势", "知识内容", "选题观察"],
    href: "https://www.xiaohongshu.com/search_result?keyword=AI",
  },
  {
    id: "bilibili-popular",
    platform: "bilibili",
    title: "B站热门视频",
    description: "查看 B站全站热门内容，适合发现年轻用户关注的内容方向。",
    topic: "综合",
    tags: ["选题观察", "爆款拆解", "评论区洞察"],
    href: "https://www.bilibili.com/v/popular/all",
  },
  {
    id: "bilibili-ranking",
    platform: "bilibili",
    title: "B站排行榜",
    description: "按全站与分区榜单观察播放、互动和内容供给变化。",
    topic: "知识",
    tags: ["榜单观察", "内容策划", "知识内容"],
    href: "https://www.bilibili.com/ranking",
  },
  {
    id: "bilibili-game",
    platform: "bilibili",
    title: "B站游戏热点",
    description: "观察游戏视频、攻略、直播切片和玩家社区讨论趋势。",
    topic: "游戏",
    tags: ["游戏趋势", "社区观察", "爆款拆解"],
    href: "https://search.bilibili.com/all?keyword=%E6%B8%B8%E6%88%8F%E7%83%AD%E7%82%B9",
  },
  {
    id: "bilibili-film",
    platform: "bilibili",
    title: "B站影视热点",
    description: "观察影视解说、二创、剧集讨论和弹幕反馈。",
    topic: "影视",
    tags: ["影视趋势", "评论区洞察", "选题观察"],
    href: "https://search.bilibili.com/all?keyword=%E5%BD%B1%E8%A7%86%E7%83%AD%E7%82%B9",
  },
  {
    id: "bilibili-ai",
    platform: "bilibili",
    title: "B站 AI 科技热点",
    description: "观察 AI 模型、工具测评、教程和科技类长视频内容热度。",
    topic: "AI",
    tags: ["AI趋势", "科技观察", "知识内容"],
    href: "https://search.bilibili.com/all?keyword=AI",
  },
];

export function filterHotspotEntries(
  filter: HotspotFilter,
  entries = hotspotEntries,
) {
  const platform =
    filter.platform && filter.platform !== "全部" ? filter.platform : undefined;
  const topic = filter.topic && filter.topic !== "全部" ? filter.topic : undefined;
  const query = filter.query?.trim().toLowerCase();

  return entries.filter((entry) => {
    if (platform && entry.platform !== platform) {
      return false;
    }

    if (topic && entry.topic !== topic) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      hotspotPlatformLabels[entry.platform],
      entry.title,
      entry.description,
      entry.topic,
      ...entry.tags,
    ].some((value) => value.toLowerCase().includes(query));
  });
}

export function buildHotspotSearchShortcuts(
  keyword: string,
): HotspotSearchShortcut[] {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    return [];
  }

  const encodedKeyword = encodeURIComponent(trimmedKeyword);

  return [
    {
      platform: "douyin",
      title: "抖音搜索",
      href: `https://www.douyin.com/search/${encodedKeyword}`,
    },
    {
      platform: "xiaohongshu",
      title: "小红书搜索",
      href: `https://www.xiaohongshu.com/search_result?keyword=${encodedKeyword}`,
    },
    {
      platform: "bilibili",
      title: "B站搜索",
      href: `https://search.bilibili.com/all?keyword=${encodedKeyword}`,
    },
  ];
}

export function getHotspotStats(entries = hotspotEntries) {
  return {
    entries: entries.length,
    linkedEntries: entries.filter((entry) => entry.href).length,
    platforms: new Set(entries.map((entry) => entry.platform)).size,
  };
}
