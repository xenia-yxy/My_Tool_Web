import Link from "next/link";
import { FileText } from "lucide-react";
import type { DashboardRecentDraft } from "@/server/tools-dashboard";

type DashboardRecentDraftsProps = {
  drafts: DashboardRecentDraft[];
};

/** 将 ISO 日期字符串格式化为中文相对时间 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "刚刚";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return date.toLocaleDateString("zh-CN");
}

/**
 * 最近草稿文章展示区。
 * 列出最近 3 篇草稿文章，显示标题和相对更新时间，点击跳转到编辑器。
 * 无草稿时展示空状态。
 */
export function DashboardRecentDrafts({
  drafts,
}: DashboardRecentDraftsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-950">最近草稿</h2>
        <Link
          className="text-sm font-medium text-blue-700 hover:underline"
          href="/admin"
        >
          查看全部
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          <div className="flex flex-col items-center gap-2">
            <FileText
              aria-hidden="true"
              className="h-6 w-6 text-slate-300"
            />
            还没有草稿文章
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {drafts.map((draft) => (
            <Link
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/40"
              href={`/admin/notes/${draft.slug}`}
              key={draft.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {draft.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatRelativeTime(draft.updatedAt)}
                </p>
              </div>
              <FileText
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-slate-300"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
