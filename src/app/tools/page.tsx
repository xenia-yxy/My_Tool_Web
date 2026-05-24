import Link from "next/link";

export default function ToolsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <Link className="text-sm text-blue-700" href="/">
        返回首页
      </Link>
      <div className="mt-8 space-y-3">
        <h1 className="text-3xl font-semibold text-slate-950">自研工具</h1>
        <p className="text-slate-600">
          工具宿主路径已预留。MVP 阶段暂不实现工具状态管理。
        </p>
      </div>
    </main>
  );
}

