import Link from "next/link";

export default function KnowledgePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <Link className="text-sm text-blue-700" href="/">
          返回首页
        </Link>
        <h1 className="text-3xl font-semibold text-slate-950">公开知识库</h1>
        <p className="text-slate-600">
          后续这里展示已发布文章。当前只保留路由和页面结构。
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        暂无公开文章。MVP 功能阶段会接入笔记发布流程。
      </div>
    </main>
  );
}

