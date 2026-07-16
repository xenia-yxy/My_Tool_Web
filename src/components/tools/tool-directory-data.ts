export type ExternalToolItem = {
  name: string;
  description: string;
  href?: string;
};

export type ExternalToolGroup = {
  title: string;
  category: string;
  description: string;
  items: ExternalToolItem[];
};

export type ToolDirectoryFilter = {
  category?: string;
  query?: string;
};

export const toolDirectoryCategories = [
  "全部",
  "抖音",
  "小红书",
  "AI 写作",
  "AI 图片",
  "AI 视频",
  "全模态",
  "工具导航",
] as const;

export const externalToolGroups: ExternalToolGroup[] = [
  {
    title: "抖音官方工具",
    category: "抖音",
    description: "店铺管理、客服、数据复盘、投流和达人合作。",
    items: [
      { name: "抖店商家后台", description: "店铺核心管理中枢", href: "https://www.douyin.com/" },
      { name: "飞鸽 IM", description: "抖店后台内置专属客服运营工具" },
      { name: "抖音电商罗盘", description: "抖店后台内置免费数据复盘工具" },
      { name: "巨量千川", description: "付费投流工具", href: "https://qianchuan.jinritemai.com/" },
      { name: "巨量星图", description: "达人撮合合作工具", href: "https://xingtu.cn/" },
      { name: "剪映", description: "免费视频剪辑工具", href: "https://www.capcut.cn/" },
    ],
  },
  {
    title: "抖音数据分析",
    category: "抖音",
    description: "账号、达人、商品、直播和矩阵数据分析。",
    items: [
      { name: "蝉妈妈", description: "抖音电商数据分析", href: "https://www.chanmama.com/" },
      { name: "飞瓜数据", description: "短视频和直播数据分析", href: "https://www.feigua.cn/" },
      { name: "新榜", description: "内容和账号榜单分析", href: "https://www.newrank.cn/" },
      { name: "抖查查", description: "抖音数据查询", href: "http://www.douchacha.com/" },
      { name: "九数云 BI", description: "经营数据可视化分析", href: "https://www.jiushuyun.com/" },
      { name: "矩阵通", description: "矩阵账号运营管理", href: "https://matrix.newrank.cn/" },
    ],
  },
  {
    title: "小红书官方工具",
    category: "小红书",
    description: "商家、创作者、开放平台和社区入口。",
    items: [
      { name: "小红书千帆", description: "小红书商家后台", href: "https://ark.xiaohongshu.com/" },
      { name: "小红书官网", description: "社区主站", href: "https://www.xiaohongshu.com/" },
      { name: "小红书创作者平台", description: "创作者运营入口", href: "https://creator.xiaohongshu.com/login" },
      { name: "小红书开放平台", description: "开放能力与接口", href: "https://open.xiaohongshu.com/" },
    ],
  },
  {
    title: "小红书数据分析",
    category: "小红书",
    description: "内容选题、达人分析、竞品分析和投放参考。",
    items: [
      { name: "千瓜数据", description: "小红书数据分析", href: "https://www.qian-gua.com/" },
      { name: "红宝书", description: "第三方小红书工具，需搜索确认" },
    ],
  },
  {
    title: "小红书 AI 创作",
    category: "小红书",
    description: "笔记创作、标题、封面和运营辅助。",
    items: [
      { name: "火兔工具箱", description: "小红书 AI 创作工具", href: "https://www.aichaoer.cn/" },
      { name: "okbob 助手", description: "小红书运营辅助", href: "http://www.hongtaotk.com/" },
      { name: "七燕 AI", description: "微信公众号工具：七燕 AI" },
      { name: "超尔 AI", description: "AI 内容创作工具", href: "https://aichaoer.com/" },
      { name: "海燕工具箱", description: "网页端小红书工具" },
      { name: "图小玉", description: "网页端小红书图文工具" },
      { name: "Aichaoer", description: "AI 创作工具", href: "https://aichaoer.com/" },
      { name: "Canva 可画", description: "在线设计工具", href: "https://www.canva.cn/" },
    ],
  },
  {
    title: "AI 写作与搜索",
    category: "AI 写作",
    description: "文字生成、问答、搜索和内容生产。",
    items: [
      { name: "ChatGPT", description: "通用 AI 助手", href: "https://chat.openai.com/" },
      { name: "Claude", description: "通用 AI 助手", href: "https://claude.ai/" },
      { name: "Gemini", description: "Google AI 助手", href: "https://gemini.google.com/" },
      { name: "DeepSeek", description: "AI 对话与写作", href: "https://www.deepseek.com/" },
      { name: "豆包", description: "字节 AI 助手", href: "https://www.doubao.com/" },
      { name: "Kimi", description: "长文本 AI 助手", href: "https://kimi.moonshot.cn/" },
      { name: "通义千问", description: "阿里 AI 助手", href: "https://tongyi.aliyun.com/" },
      { name: "文心一言", description: "百度 AI 助手", href: "https://yiyan.baidu.com/" },
      { name: "腾讯元宝", description: "腾讯 AI 助手", href: "https://yuanbao.tencent.com/" },
      { name: "Perplexity", description: "AI 搜索", href: "https://www.perplexity.ai/" },
      { name: "MagickPen", description: "AI 写作工具", href: "https://magickpen.com/" },
      { name: "创飞写作", description: "AI 写作工具", href: "https://chuangfeiai.com/" },
      { name: "Prism", description: "OpenAI Prism", href: "https://prism.openai.com/" },
    ],
  },
  {
    title: "AI 图片与绘画",
    category: "AI 图片",
    description: "AI 绘画、图片生成和视觉素材。",
    items: [
      { name: "Flux Art", description: "AI 图片生成", href: "https://flux-art.ai/" },
      { name: "PixPix", description: "AI 图片工具", href: "https://www.pixpix.com/" },
      { name: "Dreamina", description: "剪映生态 AI 生图工具", href: "https://dreamina.capcut.com/" },
      { name: "文心一格", description: "百度 AI 绘画", href: "https://yige.baidu.com/" },
      { name: "Tensor Art", description: "AI 绘画社区", href: "https://tensor.art/" },
      { name: "Dreamifly", description: "AI 图片生成", href: "https://dreamifly.com/" },
      { name: "WaveSpeedAI", description: "AI 图片和模型服务", href: "https://wavespeed.ai/" },
      { name: "MeiGen", description: "AI 图片生成", href: "https://www.meigen.ai/" },
    ],
  },
  {
    title: "AI 视频生成",
    category: "AI 视频",
    description: "AI 视频、短片、广告素材和创意视频生成。",
    items: [
      { name: "即梦 AI", description: "AI 图片和视频生成", href: "https://jimeng.jianying.com/" },
      { name: "可灵 AI", description: "AI 视频生成", href: "https://klingai.kuaishou.com/" },
      { name: "万镜一刻", description: "AI 视频生成", href: "https://www.yikeai.com/" },
      { name: "火山剧创", description: "AI 剧情和视频创作", href: "https://s.c1ns.cn/jaPpy" },
      { name: "VibeKnow", description: "AI 视频工具", href: "https://vibeknow.com/" },
      { name: "Pavo", description: "AI 视频生成", href: "https://app.pavo-ai.work/" },
    ],
  },
  {
    title: "多模态与全模态平台",
    category: "全模态",
    description: "模型平台、全模态能力和 API 服务。",
    items: [
      { name: "阿里云百炼", description: "多模型应用开发平台", href: "https://www.aliyun.com/product/bailian" },
      { name: "TokenHub", description: "腾讯云 MaaS 平台", href: "https://tokenhub.tencentcloudmaas.com/" },
      { name: "TopenRouter", description: "多模型路由平台", href: "https://TopenRouter.com/" },
      { name: "Agnes AI", description: "AI 平台", href: "https://platform.agnes-ai.com/" },
      { name: "LobsterAI", description: "有道 AI 平台", href: "https://lobsterai.youdao.com/" },
      { name: "Qwen3.5-Omni", description: "通义全模态模型入口", href: "https://t.aliyun.com/U/JbblVp" },
    ],
  },
  {
    title: "AI 工具导航",
    category: "工具导航",
    description: "查找和对比更多 AI 工具。",
    items: [
      { name: "AI 导航网", description: "AI 工具合集", href: "https://www.aiagiai.com/" },
      { name: "AINav", description: "AI 工具导航", href: "https://www.ainav.cn/" },
      { name: "Toolify.ai", description: "全球 AI 工具目录", href: "http://www.toolify.ai/" },
      { name: "awesome-ai-tools", description: "GitHub AI 工具合集", href: "https://github.com/foodman1227/awesome-ai-tools" },
    ],
  },
  {
    title: "跨平台全域工具",
    category: "工具导航",
    description: "跨平台内容、电商、数据和 BI 工具。",
    items: [
      { name: "火兔工具箱", description: "跨平台 AI 创作工具", href: "https://www.aichaoer.cn/" },
      { name: "千瓜数据", description: "小红书数据分析", href: "https://www.qian-gua.com/" },
      { name: "蝉妈妈", description: "抖音电商数据分析", href: "https://www.chanmama.com/" },
      { name: "新榜", description: "内容和账号榜单分析", href: "https://www.newrank.cn/" },
      { name: "九数云 BI", description: "经营数据可视化分析", href: "https://www.jiushuyun.com/" },
    ],
  },
];

export function getExternalToolStats(groups = externalToolGroups) {
  const tools = groups.reduce((count, group) => count + group.items.length, 0);
  const linkedTools = groups.reduce(
    (count, group) => count + group.items.filter((item) => item.href).length,
    0,
  );

  return {
    groups: groups.length,
    tools,
    linkedTools,
  };
}

export function filterExternalToolGroups(
  filter: ToolDirectoryFilter,
  groups = externalToolGroups,
) {
  const category = filter.category && filter.category !== "全部"
    ? filter.category
    : undefined;
  const query = filter.query?.trim().toLowerCase();

  return groups
    .filter((group) => !category || group.category === category)
    .map((group) => ({
      ...group,
      items: query
        ? group.items.filter((item) =>
            [item.name, item.description, item.href]
              .filter(Boolean)
              .some((value) => value!.toLowerCase().includes(query)),
          )
        : group.items,
    }))
    .filter((group) => group.items.length > 0);
}
