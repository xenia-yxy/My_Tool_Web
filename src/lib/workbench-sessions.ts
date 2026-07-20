export const workbenchTools = [
  { id: "overview", label: "总览", href: "/tools", supportsPrompt: true },
  { id: "plan", label: "计划中心", href: "/tools/plan", supportsPrompt: true },
  { id: "ai-image", label: "AI 生图", href: "/tools/ai-image", supportsPrompt: true },
  { id: "platform-cover-design", label: "平台封面设计", href: "/tools/platform-cover-design", supportsPrompt: true },
  { id: "ip-prototype", label: "IP 原型", href: "/tools/ip-prototype", supportsPrompt: true },
  { id: "ip-factory", label: "IP 衍生工厂", href: "/tools/ip-factory", supportsPrompt: true },
  { id: "creative-canvas", label: "创作画布", href: "/tools/creative-center/canvas", supportsPrompt: true },
  { id: "creative-skills", label: "Skill 管理", href: "/tools/creative-center/skills", supportsPrompt: false },
  { id: "series-video-analyzer", label: "系列视频分析", href: "/tools/series-video-analyzer", supportsPrompt: true },
  { id: "hotspots", label: "热点查询", href: "/tools/hotspots", supportsPrompt: true },
  { id: "products", label: "选品中心", href: "/tools/products", supportsPrompt: false },
  { id: "menswear-scene-image", label: "男装场景图生成", href: "/tools/menswear/scene-image", supportsPrompt: true },
  { id: "menswear", label: "男装视觉工作台", href: "/tools/menswear", supportsPrompt: true },
  { id: "menswear-style-reference", label: "男装风格参考生图", href: "/tools/menswear/style-reference", supportsPrompt: true },
  { id: "menswear-single-outfit", label: "男装单品穿搭生图", href: "/tools/menswear/single-outfit", supportsPrompt: true },
  { id: "menswear-multi-outfit", label: "男装一衣多搭生图", href: "/tools/menswear/multi-outfit", supportsPrompt: true },
  { id: "menswear-flatlay-outfit-split", label: "男装平铺多搭拆分生图", href: "/tools/menswear/flatlay-outfit-split", supportsPrompt: true },
  { id: "womenswear", label: "女装视觉工作台", href: "/tools/womenswear", supportsPrompt: true },
  { id: "womenswear-style-reference", label: "女装风格参考生图", href: "/tools/womenswear/style-reference", supportsPrompt: true },
  { id: "womenswear-single-outfit", label: "女装单品穿搭生图", href: "/tools/womenswear/single-outfit", supportsPrompt: true },
  { id: "womenswear-multi-outfit", label: "女装一衣多搭生图", href: "/tools/womenswear/multi-outfit", supportsPrompt: true },
  { id: "womenswear-flatlay-outfit-split", label: "女装平铺多搭拆分生图", href: "/tools/womenswear/flatlay-outfit-split", supportsPrompt: true },
  { id: "outfit-image", label: "AI 穿搭生图", href: "/tools/outfit-image", supportsPrompt: true },
  { id: "fashion-prompts", label: "穿搭提示词", href: "/tools/fashion-prompts", supportsPrompt: true },
  { id: "snack-grocery", label: "零食百货", href: "/tools/snack-grocery", supportsPrompt: true },
  { id: "social-commerce", label: "小红书/闲鱼", href: "/tools/social-commerce", supportsPrompt: true },
  { id: "digital-product-pack", label: "资料包生成", href: "/tools/digital-product-pack", supportsPrompt: true },
  { id: "sites", label: "网站库", href: "/tools/sites", supportsPrompt: true },
  { id: "image-gallery", label: "图片画廊", href: "/tools/image-gallery", supportsPrompt: true },
  { id: "directory", label: "工具目录", href: "/tools/directory", supportsPrompt: true },
] as const;

export type WorkbenchToolId = (typeof workbenchTools)[number]["id"];
export type WorkbenchSessionStatus = "DRAFT" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type WorkbenchPromptField = {
  label: string;
  value: string;
};

export function getWorkbenchTool(toolId: string) {
  return workbenchTools.find((tool) => tool.id === toolId) ?? null;
}

export function getWorkbenchToolForPathname(pathname: string) {
  if (pathname === "/tools") {
    return getWorkbenchTool("overview");
  }

  return workbenchTools
    .filter((tool) => tool.href !== "/tools" && pathname.startsWith(tool.href))
    .sort((left, right) => right.href.length - left.href.length)[0] ?? null;
}

export function buildWorkbenchPrompt(toolLabel: string, fields: WorkbenchPromptField[]) {
  const lines = fields
    .map((field) => ({ label: field.label.trim(), value: field.value.trim() }))
    .filter((field) => field.label && field.value)
    .map((field) => `${field.label}：${field.value}`);

  return [`${toolLabel} 当前操作`, ...lines].join("\n");
}
