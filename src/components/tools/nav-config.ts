import {
  CalendarDays,
  ClipboardList,
  Flame,
  Home,
  ImageIcon,
  Images,
  LayoutGrid,
  LineChart,
  PackageCheck,
  PanelsTopLeft,
  Shapes,
  Shirt,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";

/** 导航项 */
export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

/** 导航分组 */
export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

/** 总览入口（独立项，不属于任何分组） */
export const overviewNav: NavItem = {
  id: "overview",
  label: "总览",
  href: "/tools",
  icon: Home,
};

/** 分组导航配置（4 组：规划/创作/电商/资源） */
export const navGroups: NavGroup[] = [
  {
    id: "planning",
    label: "规划",
    icon: CalendarDays,
    items: [
      {
        id: "plan",
        label: "计划中心",
        href: "/tools/plan",
        icon: CalendarDays,
      },
    ],
  },
  {
    id: "create",
    label: "创作",
    icon: Sparkles,
    items: [
      {
        id: "ai-image",
        label: "AI 生图",
        href: "/tools/ai-image",
        icon: ImageIcon,
      },
      {
        id: "platform-cover-design",
        label: "平台封面设计",
        href: "/tools/platform-cover-design",
        icon: ImageIcon,
      },
      {
        id: "ip-prototype",
        label: "IP 原型",
        href: "/tools/ip-prototype",
        icon: Shapes,
      },
      {
        id: "ip-factory",
        label: "IP 衍生工厂",
        href: "/tools/ip-factory",
        icon: Sparkles,
      },
      {
        id: "series-video-analyzer",
        label: "系列视频分析",
        href: "/tools/series-video-analyzer",
        icon: LineChart,
      },
      {
        id: "hotspots",
        label: "热点查询",
        href: "/tools/hotspots",
        icon: Flame,
      },
    ],
  },
  {
    id: "creative-center",
    label: "智能创作中心",
    icon: PanelsTopLeft,
    items: [
      {
        id: "creative-canvas",
        label: "创作画布",
        href: "/tools/creative-center/canvas",
        icon: PanelsTopLeft,
      },
      {
        id: "creative-skills",
        label: "Skill 管理",
        href: "/tools/creative-center/skills",
        icon: Shapes,
      },
    ],
  },
  {
    id: "ecommerce",
    label: "电商",
    icon: PackageCheck,
    items: [
      {
        id: "menswear",
        label: "男装视觉工作台",
        href: "/tools/menswear",
        icon: Shirt,
      },
      {
        id: "products",
        label: "选品中心",
        href: "/tools/products",
        icon: PackageCheck,
      },
      {
        id: "womenswear",
        label: "女装视觉工作台",
        href: "/tools/womenswear",
        icon: Shirt,
      },
      {
        id: "snack-grocery",
        label: "零食百货",
        href: "/tools/snack-grocery",
        icon: PackageCheck,
      },
      {
        id: "social-commerce",
        label: "小红书/闲鱼",
        href: "/tools/social-commerce",
        icon: Store,
      },
      {
        id: "digital-product-pack",
        label: "资料包生成",
        href: "/tools/digital-product-pack",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "resource",
    label: "资源",
    icon: LayoutGrid,
    items: [
      {
        id: "sites",
        label: "网站库",
        href: "/tools/sites",
        icon: LayoutGrid,
      },
      {
        id: "image-gallery",
        label: "图片画廊",
        href: "/tools/image-gallery",
        icon: Images,
      },
    ],
  },
];

/** 根据 pathname 获取当前激活的导航项 ID */
export function getActiveNavId(pathname: string): string | null {
  if (pathname === "/tools") {
    return "overview";
  }

  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href)) {
        return item.id;
      }
    }
  }

  return null;
}

/** 根据 pathname 获取当前激活的分组 ID */
export function getActiveGroupId(pathname: string): string | null {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href)) {
        return group.id;
      }
    }
  }

  return null;
}

/** 获取所有导航项的扁平列表（含总览），用于移动端横向滚动导航 */
export function getAllNavItemsFlat(): NavItem[] {
  return [overviewNav, ...navGroups.flatMap((group) => group.items)];
}
