import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <Link className="text-sm text-blue-700" href="/">
          返回首页
        </Link>
        <h1 className="text-3xl font-semibold text-slate-950">私人工作台</h1>
        <p className="text-slate-600">
          当前是框架占位页。后续 MVP 阶段会接入登录鉴权、笔记统计和快捷入口。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-base font-semibold text-slate-900">
            私人笔记
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            后续支持私密保存、编辑、发布和撤回。
          </p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-base font-semibold text-slate-900">
            自研工具
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            本阶段只预留工具入口，不实现工具状态管理。
          </p>
        </section>
      </div>
    </main>
  );
}

