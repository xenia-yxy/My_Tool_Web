import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPublishedContentAssets } from "@/server/content-queries";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function KnowledgePage() {
  const notes = await listPublishedContentAssets();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <Link className="text-sm text-blue-700" href="/">
          返回首页
        </Link>
        <h1 className="text-3xl font-semibold text-slate-950">公开知识库</h1>
        <p className="text-slate-600">
          这里沉淀已发布的 AI 实践复盘、方法论和可复用的内容资产。
        </p>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          暂无公开文章。后台发布内容资产后会显示在这里。
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Link
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              href={`/knowledge/${note.slug}`}
              key={note.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {formatDate(note.publishedAt)}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950 group-hover:text-blue-700">
                    {note.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {note.excerpt || "这是一条来自后台内容资产的公开知识库文章。"}
                  </p>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-blue-700"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
