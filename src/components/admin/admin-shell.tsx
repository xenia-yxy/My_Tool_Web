import Link from "next/link";
import {
  BarChart3,
  FileText,
  Gauge,
  Globe2,
  KeyRound,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
};

const navItems = [
  { title: "仪表盘", href: "/admin", icon: Gauge },
  { title: "内容资产", href: "/admin/content", icon: FileText },
  { title: "工具管理", href: "/admin/tools", icon: Wrench },
  { title: "用户管理", href: "/admin/users", icon: Users },
  { title: "权限管理", href: "/admin/roles", icon: KeyRound },
  { title: "订单管理", href: "/admin/orders", icon: ShoppingBag },
  { title: "数据大屏", href: "/admin/analytics", icon: BarChart3 },
  { title: "系统设置", href: "/admin/settings", icon: Settings },
];

export function AdminShell({ children, title, description }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-slate-50/70">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-slate-200 bg-white/80 px-5 py-5 backdrop-blur lg:border-b-0 lg:border-r">
          <Link className="block" href="/admin">
            <p className="text-sm font-semibold text-slate-950">YXY AI Practice</p>
            <p className="mt-1 text-xs text-slate-500">内容资产工作台</p>
          </Link>

          <nav aria-label="后台导航" className="mt-8 flex flex-wrap gap-2 lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 flex flex-col items-start gap-3 border-t border-slate-200 pt-5">
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
              href="/admin/content/new"
            >
              <Package aria-hidden="true" className="h-4 w-4" />
              新建内容
            </Link>
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
              href="/"
            >
              <Globe2 aria-hidden="true" className="h-4 w-4" />
              返回公开网站
            </Link>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-6 sm:px-8 lg:px-10">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            <LogoutButton />
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}
