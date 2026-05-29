import {
  BarChart3,
  FileText,
  Gauge,
  KeyRound,
  Settings,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";

export const adminNavItems = [
  { title: "仪表盘", href: "/admin", icon: Gauge },
  { title: "内容资产", href: "/admin/content", icon: FileText },
  { title: "工具管理", href: "/admin/tools", icon: Wrench },
  { title: "用户管理", href: "/admin/users", icon: Users },
  { title: "权限管理", href: "/admin/roles", icon: KeyRound },
  { title: "订单管理", href: "/admin/orders", icon: ShoppingBag },
  { title: "数据大屏", href: "/admin/analytics", icon: BarChart3 },
  { title: "系统设置", href: "/admin/settings", icon: Settings },
];

export function isAdminNavItemActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
