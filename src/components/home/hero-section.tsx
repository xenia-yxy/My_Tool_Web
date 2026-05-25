import Link from "next/link";
import { ArrowRight, CircuitBoard, Layers3, PencilLine, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const systemNodes = [
  { label: "Knowledge", value: "一线复盘", tone: "bg-blue-50 text-blue-700" },
  { label: "Tools", value: "自研验证", tone: "bg-cyan-50 text-cyan-700" },
  { label: "Projects", value: "产品沉淀", tone: "bg-violet-50 text-violet-700" },
  { label: "SOP", value: "服务交付", tone: "bg-emerald-50 text-emerald-700" },
];

export function HeroSection() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-160px)] w-full min-w-0 max-w-6xl items-center gap-12 px-5 py-12 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
      <div className="min-w-0 max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
          <WandSparkles aria-hidden="true" className="h-4 w-4" />
          AI 实践者 · 一线做东西
        </div>

        <h1 className="hero-title max-w-full break-words text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
          把 AI 实践、工具和知识沉淀成一个可持续生长的数字系统
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          这里不是简历页，而是一个公开的 AI 实践现场。你可以看到知识库、自研工具、项目进展和 SOP
          服务入口，判断这个人是否真的在一线构建。
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-11 px-5">
            <Link href="/tools">
              查看自研工具
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="h-11 px-5" variant="secondary">
            <Link href="/knowledge">阅读知识库</Link>
          </Button>
        </div>

        <Link
          className="mt-5 inline-flex text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
          href="/services"
        >
          需要把 AI 流程做成企业 SOP？查看服务入口
        </Link>
      </div>

      <div className="relative min-h-[420px] min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white/62 p-5 shadow-[0_30px_90px_rgba(37,99,235,0.14)] backdrop-blur-xl">
        <div className="surface-noise absolute inset-0 opacity-40" />
        <div className="relative flex h-full min-h-[380px] flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Live System</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                个人 AI 能力中枢
              </h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              MVP 生长中
            </span>
          </div>

          <div className="my-8 grid gap-3 sm:grid-cols-2">
            {systemNodes.map((node) => (
              <div
                className="rounded-xl border border-white/90 bg-white/76 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                key={node.label}
              >
                <p className="text-xs font-medium text-slate-500">{node.label}</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{node.value}</p>
                <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${node.tone}`}>
                  已接入首页入口
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4">
              <PencilLine aria-hidden="true" className="h-5 w-5 text-blue-700" />
              <p className="mt-4 text-sm font-semibold text-slate-950">记录</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">私人笔记沉淀真实经验</p>
            </div>
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/80 p-4">
              <CircuitBoard aria-hidden="true" className="h-5 w-5 text-cyan-700" />
              <p className="mt-4 text-sm font-semibold text-slate-950">工具</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">自研能力先自用验证</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
              <Layers3 aria-hidden="true" className="h-5 w-5 text-emerald-700" />
              <p className="mt-4 text-sm font-semibold text-slate-950">交付</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">SOP 服务逐步产品化</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
