import Link from "next/link";
import { CalendarDays, FileText, ImageIcon, Shapes } from "lucide-react";
import type { DashboardSummary } from "@/server/tools-dashboard";

type DashboardSummaryCardsProps = {
  summary: DashboardSummary;
};

type SummaryCardConfig = {
  label: string;
  value: string;
  href: string;
  icon: typeof CalendarDays;
  accent: string;
};

/**
 * 工作台摘要卡片组。
 * 展示今日任务完成率、草稿文章数、今日生图数、IP 项目数，
 * 每张卡片可点击跳转到对应工具页面。
 */
export function DashboardSummaryCards({
  summary,
}: DashboardSummaryCardsProps) {
  const cards: SummaryCardConfig[] = [
    {
      label: "今日任务",
      value: `${summary.todayTaskCompleted}/${summary.todayTaskTotal}`,
      href: "/tools/plan",
      icon: CalendarDays,
      accent: "border-blue-100 bg-blue-50 text-blue-700",
    },
    {
      label: "草稿文章",
      value: String(summary.draftCount),
      href: "/admin",
      icon: FileText,
      accent: "border-violet-100 bg-violet-50 text-violet-700",
    },
    {
      label: "今日生图",
      value: String(summary.todayImageCount),
      href: "/tools/ai-image",
      icon: ImageIcon,
      accent: "border-cyan-100 bg-cyan-50 text-cyan-700",
    },
    {
      label: "IP 项目",
      value: String(summary.ipProjectCount),
      href: "/tools/ip-prototype",
      icon: Shapes,
      accent: "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_56px_rgba(15,23,42,0.09)]"
            href={card.href}
            key={card.label}
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl border ${card.accent}`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {card.value}
            </p>
          </Link>
        );
      })}
    </section>
  );
}
