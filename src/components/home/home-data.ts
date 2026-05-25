export type EntranceItem = {
  title: string;
  description: string;
  href: string;
  status: "已开放" | "即将上线" | "内测中";
  accent: "blue" | "cyan" | "violet" | "emerald";
};

export type FeaturedItem = {
  title: string;
  description: string;
  meta: string;
  href: string;
  status?: string;
};

export type ContactAction = {
  title: string;
  description: string;
  href: string;
  status: string;
};

export const navItems = [
  { title: "知识库", href: "/knowledge" },
  { title: "工具", href: "/tools" },
  { title: "项目", href: "/projects" },
  { title: "SOP 服务", href: "/services" },
  { title: "联系", href: "#contact" },
];

export const entrances: EntranceItem[] = [
  {
    title: "公开知识库",
    description: "沉淀真实的一线 AI 实践、产品判断和数字系统构建记录。",
    href: "/knowledge",
    status: "已开放",
    accent: "blue",
  },
  {
    title: "自研工具台",
    description: "创作、效率和学习类工具会先自用验证，再逐步开放。",
    href: "/tools",
    status: "内测中",
    accent: "cyan",
  },
  {
    title: "项目展示",
    description: "展示正在构建的产品、实验和后续可复用的商业化模块。",
    href: "/projects",
    status: "即将上线",
    accent: "violet",
  },
  {
    title: "SOP 企业服务",
    description: "把 AI 工作流、内容流程和业务 SOP 做成可交付的系统。",
    href: "/services",
    status: "即将上线",
    accent: "emerald",
  },
];

export const featuredKnowledge: FeaturedItem[] = [
  {
    title: "从零搭建个人 AI 数字据点",
    description: "记录个人网站、知识库、工具宿主和服务入口如何合成一个长期资产。",
    meta: "产品设计 / MVP",
    href: "/knowledge",
    status: "种子内容",
  },
  {
    title: "AI 辅助开发的工作流边界",
    description: "哪些环节适合交给 AI，哪些决策必须由一线实践者自己把关。",
    meta: "AI 开发 / 实战复盘",
    href: "/knowledge",
    status: "准备中",
  },
];

export const featuredTools: FeaturedItem[] = [
  {
    title: "闪念捕获",
    description: "把临时想法快速收进私人工作台，后续再筛选为公开文章或项目素材。",
    meta: "效率工具",
    href: "/tools",
    status: "内测中",
  },
  {
    title: "内容 SOP 助手",
    description: "把选题、拆解、发布和复盘做成可重复执行的创作流程。",
    meta: "创作工具",
    href: "/tools",
    status: "规划中",
  },
];

export const featuredProjects: FeaturedItem[] = [
  {
    title: "AI 实践者个人网站",
    description: "一个同时承载个人名片、知识库、自研工具和 SOP 服务的数字系统。",
    meta: "当前项目",
    href: "/projects",
    status: "MVP 构建中",
  },
];

export const contactActions: ContactAction[] = [
  {
    title: "微信咨询",
    description: "适合交流 SOP 搭建、AI 工作流和企业服务需求。",
    href: "#contact",
    status: "预留入口",
  },
  {
    title: "抖音 / 小红书",
    description: "后续用于发布一线实践记录，并把内容流量带回网站。",
    href: "#contact",
    status: "内容入口",
  },
  {
    title: "GitHub / 邮箱",
    description: "适合项目合作、工具反馈和更正式的沟通。",
    href: "mailto:admin@example.com",
    status: "可替换",
  },
];
