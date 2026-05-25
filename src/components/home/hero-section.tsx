import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, PenLine, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PracticeMapItem = {
  index: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const practiceMapItems: PracticeMapItem[] = [
  {
    index: "01",
    label: "Knowledge Notes",
    title: "知识沉淀",
    description: "记录真实 AI 实践、产品判断和一线复盘。",
    icon: BookOpen,
  },
  {
    index: "02",
    label: "Tool Experiments",
    title: "工具验证",
    description: "把高频工作流做成可复用的自研工具。",
    icon: Wrench,
  },
  {
    index: "03",
    label: "Project Logs",
    title: "项目记录",
    description: "沉淀正在构建的产品、案例和系统模块。",
    icon: PenLine,
  },
  {
    index: "04",
    label: "SOP Systems",
    title: "流程服务",
    description: "把 AI 工作流整理成能交付、能复用的 SOP。",
    icon: Layers3,
  },
];

export function HeroSection() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-96px)] w-full min-w-0 max-w-6xl items-center gap-12 px-5 py-12 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:px-8">
      <div className="min-w-0 max-w-3xl">
        <p className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-blue-700">
          Personal AI Practice
        </p>

        <h1 className="hero-title max-w-full break-words text-5xl font-semibold leading-none text-slate-950 sm:text-6xl lg:text-7xl">
          AI Practice
        </h1>

        <p className="mt-6 max-w-2xl text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
          一个个人 AI 实践者的数字据点
        </p>

        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          记录真实 AI 实践，把知识、工具和流程沉淀成可持续生长的系统。
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold !text-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition-colors hover:bg-blue-700"
            href="/knowledge"
            style={{ color: "#ffffff" }}
          >
            <span className="text-white">阅读知识库</span>
            <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Link>
          <Link
            className="inline-flex h-12 min-w-[128px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
            href="/tools"
          >
            查看工具
          </Link>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-500">
          右下角的「问问 AI Practice」可以快速了解网站、工具方向和 SOP 服务。
        </p>
      </div>

      <div className="relative min-h-[440px] min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-slate-200/80 bg-white/82 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="surface-noise absolute inset-0 opacity-40" />
        <div className="relative flex h-full min-h-[400px] flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Practice Map</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                从真实实践长出来的系统
              </h2>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              MVP
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {practiceMapItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-slate-200/80 bg-white/80 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_40px_rgba(37,99,235,0.08)]"
                  key={item.label}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700">
                        {item.index}
                      </span>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        {item.label}
                      </p>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-5">
            <Link
              className="inline-flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-blue-700"
              href="/services"
            >
              需要把 AI 流程做成企业 SOP？查看服务入口
              <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
