import Link from "next/link";
import { Button } from "@/components/ui/button";

const capabilities = [
  "AI 辅助开发实践",
  "个人知识库沉淀",
  "自研效率工具",
  "SOP 企业服务",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <section className="flex flex-1 flex-col justify-center gap-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium text-blue-700">AI Practitioner</p>
          <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            个人网站与 AI 实践知识库
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            这里会沉淀真实的一线 AI 开发经验、自研工具和 SOP 服务能力。当前处于 MVP 框架初始化阶段。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {capabilities.map((item) => (
            <div
              className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/knowledge">查看知识库</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin">进入私人工作台</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

