import { prisma } from "@/lib/prisma";
import { createAiGateway } from "@/server/ai-gateway/provider-registry";
import { buildAiRuntimeConfigsForUser } from "@/server/ai-model-configs";

export type WebsiteBookmarkCategory =
  | "douyin"
  | "xiaohongshu"
  | "ai"
  | "crossPlatform"
  | "custom";

export type WebsiteBookmarkView = {
  id: string;
  title: string;
  url: string;
  category: WebsiteBookmarkCategory;
  subcategory: string;
  summary: string;
  tags: string[];
  note: string | null;
  source: "preset" | "user";
};

export type WebsiteBookmarkInput = {
  title?: unknown;
  url?: unknown;
  category?: unknown;
  subcategory?: unknown;
  summary?: unknown;
  tags?: unknown;
  note?: unknown;
};

const categories = new Set<WebsiteBookmarkCategory>([
  "douyin",
  "xiaohongshu",
  "ai",
  "crossPlatform",
  "custom",
]);

export const defaultWebsiteBookmarks: WebsiteBookmarkView[] = [
  bookmark("preset-douyin-doudian", "抖店商家后台", "https://www.douyin.com/", "douyin", "官方基础工具", "店铺核心管理中枢", ["抖音", "店铺"]),
  bookmark("preset-douyin-qianchuan", "巨量千川", "https://qianchuan.jinritemai.com/", "douyin", "官方基础工具", "付费投流工具", ["抖音", "投流"]),
  bookmark("preset-douyin-xingtu", "巨量星图", "https://xingtu.cn/", "douyin", "官方基础工具", "达人撮合合作工具", ["抖音", "达人"]),
  bookmark("preset-douyin-capcut", "剪映", "https://www.capcut.cn/", "douyin", "官方基础工具", "免费视频剪辑工具", ["视频", "剪辑"]),
  bookmark("preset-douyin-chanmama", "蝉妈妈", "https://www.chanmama.com/", "douyin", "第三方数据分析", "抖音电商和内容数据分析", ["数据", "竞品"]),
  bookmark("preset-douyin-feigua", "飞瓜数据", "https://www.feigua.cn/", "douyin", "第三方数据分析", "短视频和直播数据分析", ["数据", "直播"]),
  bookmark("preset-douyin-newrank", "新榜", "https://www.newrank.cn/", "douyin", "第三方数据分析", "内容榜单和账号观察", ["数据", "榜单"]),
  bookmark("preset-douyin-douchacha", "抖查查", "http://www.douchacha.com/", "douyin", "第三方数据分析", "抖音数据查询工具", ["数据"]),
  bookmark("preset-douyin-jiushuyun", "九数云BI", "https://www.jiushuyun.com/", "douyin", "第三方数据分析", "BI 数据分析和报表", ["BI", "数据"]),
  bookmark("preset-douyin-matrix", "矩阵通", "https://matrix.newrank.cn/", "douyin", "第三方数据分析", "矩阵账号管理工具", ["矩阵", "账号"]),
  bookmark("preset-xhs-qianfan", "小红书千帆", "https://ark.xiaohongshu.com/", "xiaohongshu", "官方工具", "小红书商家经营平台", ["小红书", "商家"]),
  bookmark("preset-xhs-home", "小红书官网", "https://www.xiaohongshu.com/", "xiaohongshu", "官方工具", "小红书内容平台", ["小红书"]),
  bookmark("preset-xhs-creator", "小红书创作者平台", "https://creator.xiaohongshu.com/login", "xiaohongshu", "官方工具", "创作者发布和数据入口", ["创作者"]),
  bookmark("preset-xhs-open", "小红书开放平台", "https://open.xiaohongshu.com/", "xiaohongshu", "官方工具", "开发者和开放能力入口", ["开放平台"]),
  bookmark("preset-xhs-qiangua", "千瓜数据", "https://www.qian-gua.com/", "xiaohongshu", "数据分析", "小红书数据分析工具", ["数据", "小红书"]),
  bookmark("preset-xhs-aichaoer", "火兔工具箱", "https://www.aichaoer.cn/", "xiaohongshu", "AI创作工具", "小红书和内容创作工具箱", ["AI", "创作"]),
  bookmark("preset-xhs-okbob", "okbob助手", "http://www.hongtaotk.com/", "xiaohongshu", "AI创作工具", "小红书创作辅助工具", ["AI", "创作"]),
  bookmark("preset-xhs-canva", "Canva可画", "https://www.canva.cn/", "xiaohongshu", "AI创作工具", "设计和内容视觉制作", ["设计", "图片"]),
  bookmark("preset-ai-chatgpt", "ChatGPT", "https://chat.openai.com/", "ai", "文字/AI写作", "通用 AI 对话和写作", ["AI", "写作"]),
  bookmark("preset-ai-claude", "Claude", "https://claude.ai/", "ai", "文字/AI写作", "长文写作、分析和代码辅助", ["AI", "写作"]),
  bookmark("preset-ai-gemini", "Gemini", "https://gemini.google.com/", "ai", "文字/AI写作", "Google 多模态 AI 助手", ["AI", "多模态"]),
  bookmark("preset-ai-deepseek", "DeepSeek", "https://www.deepseek.com/", "ai", "文字/AI写作", "推理、代码和中文问答", ["AI", "推理"]),
  bookmark("preset-ai-doubao", "豆包", "https://www.doubao.com/", "ai", "文字/AI写作", "中文 AI 助手", ["AI", "中文"]),
  bookmark("preset-ai-kimi", "Kimi", "https://kimi.moonshot.cn/", "ai", "文字/AI写作", "长文本阅读和问答", ["AI", "长文本"]),
  bookmark("preset-ai-tongyi", "通义千问", "https://tongyi.aliyun.com/", "ai", "文字/AI写作", "阿里通义大模型入口", ["AI", "阿里"]),
  bookmark("preset-ai-yiyan", "文心一言", "https://yiyan.baidu.com/", "ai", "文字/AI写作", "百度文心大模型入口", ["AI", "百度"]),
  bookmark("preset-ai-yuanbao", "腾讯元宝", "https://yuanbao.tencent.com/", "ai", "文字/AI写作", "腾讯 AI 助手", ["AI", "腾讯"]),
  bookmark("preset-ai-perplexity", "Perplexity", "https://www.perplexity.ai/", "ai", "文字/AI写作", "AI 搜索和资料问答", ["AI", "搜索"]),
  bookmark("preset-ai-magickpen", "MagickPen", "https://magickpen.com/", "ai", "文字/AI写作", "AI 写作辅助", ["写作"]),
  bookmark("preset-ai-chuangfei", "创飞写作", "https://chuangfeiai.com/", "ai", "文字/AI写作", "中文内容写作工具", ["写作"]),
  bookmark("preset-ai-prism", "Prism", "https://prism.openai.com/", "ai", "文字/AI写作", "OpenAI Prism", ["AI"]),
  bookmark("preset-ai-flux", "Flux Art", "https://flux-art.ai/", "ai", "图片/AI绘画", "AI 图片生成工具", ["图片", "生成"]),
  bookmark("preset-ai-pixpix", "PixPix", "https://www.pixpix.com/", "ai", "图片/AI绘画", "AI 图片创作平台", ["图片"]),
  bookmark("preset-ai-dreamina", "Dreamina", "https://dreamina.capcut.com/", "ai", "图片/AI绘画", "剪映旗下 AI 创作工具", ["图片", "视频"]),
  bookmark("preset-ai-yige", "文心一格", "https://yige.baidu.com/", "ai", "图片/AI绘画", "百度 AI 绘画工具", ["图片"]),
  bookmark("preset-ai-tensor", "Tensor Art", "https://tensor.art/", "ai", "图片/AI绘画", "模型和 AI 图像社区", ["图片", "模型"]),
  bookmark("preset-ai-wavespeed", "WaveSpeedAI", "https://wavespeed.ai/", "ai", "图片/AI绘画", "AI 图片和视频生成 API", ["图片", "API"]),
  bookmark("preset-ai-jimeng", "即梦AI", "https://jimeng.jianying.com/", "ai", "视频/AI视频生成", "AI 图片和视频创作", ["视频", "图片"]),
  bookmark("preset-ai-kling", "可灵AI", "https://klingai.kuaishou.com/", "ai", "视频/AI视频生成", "快手 AI 视频生成", ["视频"]),
  bookmark("preset-ai-yike", "万镜一刻", "https://www.yikeai.com/", "ai", "视频/AI视频生成", "AI 视频生成平台", ["视频"]),
  bookmark("preset-ai-vibeknow", "VibeKnow", "https://vibeknow.com/", "ai", "视频/AI视频生成", "AI 视频创作工具", ["视频"]),
  bookmark("preset-ai-pavo", "Pavo", "https://app.pavo-ai.work/", "ai", "视频/AI视频生成", "AI 视频生成工作台", ["视频"]),
  bookmark("preset-ai-bailian", "阿里云百炼", "https://www.aliyun.com/product/bailian", "ai", "多模态/全模态平台", "阿里云大模型开发平台", ["多模态", "API"]),
  bookmark("preset-ai-tokenhub", "TokenHub", "https://tokenhub.tencentcloudmaas.com/", "ai", "多模态/全模态平台", "腾讯云模型服务入口", ["多模态", "API"]),
  bookmark("preset-ai-agnes", "Agnes AI", "https://platform.agnes-ai.com/", "ai", "多模态/全模态平台", "AI 平台工具", ["多模态"]),
  bookmark("preset-ai-lobster", "LobsterAI", "https://lobsterai.youdao.com/", "ai", "多模态/全模态平台", "有道 AI 平台", ["多模态"]),
  bookmark("preset-ai-nav-aiagiai", "AI导航网", "https://www.aiagiai.com/", "ai", "AI工具导航/合集", "AI 工具导航合集", ["导航"]),
  bookmark("preset-ai-ainav", "AINav", "https://www.ainav.cn/", "ai", "AI工具导航/合集", "AI 工具导航", ["导航"]),
  bookmark("preset-ai-toolify", "Toolify.ai", "http://www.toolify.ai/", "ai", "AI工具导航/合集", "海外 AI 工具导航", ["导航"]),
  bookmark("preset-ai-awesome", "awesome-ai-tools", "https://github.com/foodman1227/awesome-ai-tools", "ai", "AI工具导航/合集", "GitHub AI 工具合集", ["导航", "GitHub"]),
  bookmark("preset-cross-huotu", "火兔工具箱", "https://www.aichaoer.cn/", "crossPlatform", "跨平台全域工具", "跨平台内容创作工具箱", ["跨平台", "创作"]),
  bookmark("preset-cross-qiangua", "千瓜数据", "https://www.qian-gua.com/", "crossPlatform", "跨平台全域工具", "小红书数据分析", ["数据"]),
  bookmark("preset-cross-chanmama", "蝉妈妈", "https://www.chanmama.com/", "crossPlatform", "跨平台全域工具", "抖音电商数据分析", ["数据"]),
  bookmark("preset-cross-newrank", "新榜", "https://www.newrank.cn/", "crossPlatform", "跨平台全域工具", "内容榜单和账号观察", ["数据"]),
  bookmark("preset-cross-jiushuyun", "九数云BI", "https://www.jiushuyun.com/", "crossPlatform", "跨平台全域工具", "BI 数据分析", ["BI"]),
];

export function normalizeWebsiteBookmarkInput(input: WebsiteBookmarkInput) {
  const title = readString(input.title);
  const url = normalizeUrl(input.url);
  const category = normalizeCategory(input.category);
  const subcategory = readString(input.subcategory) || "未分类";
  const summary = readString(input.summary);
  const note = readString(input.note);
  const tags = normalizeTags(input.tags);

  if (!title) {
    throw new Error("网站名称不能为空");
  }

  if (!summary) {
    throw new Error("网站摘要不能为空");
  }

  return {
    title,
    url,
    category,
    subcategory,
    summary,
    tags,
    note,
  };
}

export function normalizeWebsiteSummaryUrls(value: unknown) {
  const urls = String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const normalized: string[] = [];

  urls.forEach((url) => {
    const normalizedUrl = normalizeUrl(url);

    if (!normalized.includes(normalizedUrl)) {
      normalized.push(normalizedUrl);
    }
  });

  if (normalized.length === 0) {
    throw new Error("请至少输入一个网站地址");
  }

  if (normalized.length > 5) {
    throw new Error("一次最多总结 5 个网站");
  }

  return normalized;
}

export function filterWebsiteBookmarks<T extends Pick<WebsiteBookmarkView, "title" | "url" | "category" | "subcategory" | "summary" | "tags" | "note">>(
  bookmarks: T[],
  input: { category?: string | null; query?: string | null },
) {
  const category = input.category || "all";
  const query = readString(input.query).toLowerCase();

  return bookmarks.filter((bookmark) => {
    if (category !== "all" && bookmark.category !== category) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      bookmark.title,
      bookmark.url,
      bookmark.subcategory,
      bookmark.summary,
      bookmark.note || "",
      ...bookmark.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function summarizeWebsiteBookmarkStats(
  bookmarks: Array<{ category: string }>,
) {
  return bookmarks.reduce(
    (stats, bookmark) => {
      stats.total += 1;

      if (bookmark.category === "douyin") stats.douyin += 1;
      if (bookmark.category === "xiaohongshu") stats.xiaohongshu += 1;
      if (bookmark.category === "ai") stats.ai += 1;
      if (bookmark.category === "crossPlatform") stats.crossPlatform += 1;
      if (bookmark.category === "custom") stats.custom += 1;

      return stats;
    },
    {
      total: 0,
      douyin: 0,
      xiaohongshu: 0,
      ai: 0,
      crossPlatform: 0,
      custom: 0,
    },
  );
}

export async function listWebsiteBookmarks(userId: string, input: {
  category?: string | null;
  query?: string | null;
}) {
  const customBookmarks = await prisma.websiteBookmark.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const combined: WebsiteBookmarkView[] = [
    ...customBookmarks.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      category: normalizeCategory(item.category),
      subcategory: item.subcategory,
      summary: item.summary,
      tags: item.tags,
      note: item.note,
      source: "user" as const,
    })),
    ...defaultWebsiteBookmarks,
  ];
  const bookmarks = filterWebsiteBookmarks(combined, input);

  return {
    bookmarks,
    stats: summarizeWebsiteBookmarkStats(combined),
  };
}

export async function createWebsiteBookmark(userId: string, input: WebsiteBookmarkInput) {
  const normalized = normalizeWebsiteBookmarkInput(input);
  const bookmark = await prisma.websiteBookmark.create({
    data: {
      ...normalized,
      note: normalized.note || null,
      userId,
    },
  });

  return bookmark;
}

export async function deleteWebsiteBookmark(userId: string, id: string) {
  const bookmark = await prisma.websiteBookmark.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!bookmark) {
    throw new Error("网站不存在");
  }

  await prisma.websiteBookmark.delete({ where: { id } });

  return { ok: true };
}

export async function summarizeWebsiteUrl(userId: string, url: string) {
  const normalizedUrl = normalizeUrl(url);
  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 XeniaTools/1.0",
    },
  });
  const html = await response.text();
  const title = extractTitle(html) || normalizedUrl;
  const text = stripHtml(html).slice(0, 6000);
  const models = await buildAiRuntimeConfigsForUser(userId);

  if (models.length === 0 || !text.trim()) {
    return {
      title,
      summary: text.trim().slice(0, 220) || "已保存网页，暂无可提取摘要。",
    };
  }

  try {
    const summary = await createAiGateway({ models }).generateText({
      messages: [
        {
          role: "system",
          content: "你是网页资料整理助手。用中文输出 80 字以内摘要，只写结论。",
        },
        {
          role: "user",
          content: `标题：${title}\n网址：${normalizedUrl}\n正文：${text}`,
        },
      ],
      temperature: 0.2,
    });

    return { title, summary };
  } catch {
    return {
      title,
      summary: text.trim().slice(0, 220) || "网页已抓取，但模型总结失败。",
    };
  }
}

function bookmark(
  id: string,
  title: string,
  url: string,
  category: WebsiteBookmarkCategory,
  subcategory: string,
  summary: string,
  tags: string[],
): WebsiteBookmarkView {
  return {
    id,
    title,
    url,
    category,
    subcategory,
    summary,
    tags,
    note: null,
    source: "preset",
  };
}

function normalizeCategory(value: unknown): WebsiteBookmarkCategory {
  const category = readString(value) as WebsiteBookmarkCategory;

  return categories.has(category) ? category : "custom";
}

function normalizeUrl(value: unknown) {
  const rawUrl = readString(value);
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("网站地址格式不正确");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("只支持 http 或 https 网站地址");
  }

  return url.toString();
}

function normalizeTags(value: unknown) {
  const tags = Array.isArray(value) ? value : String(value || "").split(",");
  const normalized: string[] = [];

  tags.forEach((tag) => {
    const item = readString(tag);

    if (item && !normalized.includes(item)) {
      normalized.push(item);
    }
  });

  return normalized.slice(0, 12);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractTitle(html: string) {
  return html
    .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
