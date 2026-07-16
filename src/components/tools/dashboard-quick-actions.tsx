import Link from "next/link";
import { CalendarDays, FileText, ImageIcon, LayoutGrid } from "lucide-react";

type QuickActionConfig = {
  label: string;
  href: string;
  icon: typeof CalendarDays;
  accent: string;
};

const actions: QuickActionConfig[] = [
  {
    label: "新建计划",
    href: "/tools/plan",
    icon: CalendarDays,
    accent: "border-blue-100 bg-blue-50 text-blue-700",
  },
  {
    label: "快速生图",
    href: "/tools/ai-image",
    icon: ImageIcon,
    accent: "border-cyan-100 bg-cyan-50 text-cyan-700",
  },
  {
    label: "写文章",
    href: "/admin/notes/new",
    icon: FileText,
    accent: "border-violet-100 bg-violet-50 text-violet-700",
  },
  {
    label: "看书签",
    href: "/tools/sites",
    icon: LayoutGrid,
    accent: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
];

/**
 * 工作台快捷操作区。
 * 提供 4 个常用入口按钮：新建计划、快速生图、写文章、看书签。
 */
export function DashboardQuickActions() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-950">
        快捷操作
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              href={action.href}
              key={action.label}
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-full border ${action.accent}`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-700">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
