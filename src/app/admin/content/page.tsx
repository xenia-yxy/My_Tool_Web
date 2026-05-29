import Link from "next/link";
import { PencilLine, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentAssetActions } from "@/components/admin/content-asset-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAdminContentAssetStats,
  listAdminContentAssets,
  type ContentAssetFilter,
} from "@/server/content-queries";
import {
  normalizeContentAssetFilter,
  normalizeContentAssetQuery,
  getPublishedContentAssetHref,
} from "@/server/content-assets";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

type AdminContentPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
    q?: string | string[];
  }>;
};

const filters: Array<{ title: string; value: ContentAssetFilter }> = [
  { title: "全部", value: "ALL" },
  { title: "草稿", value: "PRIVATE" },
  { title: "已发布", value: "PUBLISHED" },
];

function buildFilterHref(filter: ContentAssetFilter, query?: string) {
  const params = new URLSearchParams();

  if (filter !== "ALL") {
    params.set("status", filter);
  }

  if (query) {
    params.set("q", query);
  }

  const search = params.toString();

  return search ? `/admin/content?${search}` : "/admin/content";
}

function formatDate(date: Date | null) {
  if (!date) {
    return "未发布";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminContentPage({
  searchParams,
}: AdminContentPageProps) {
  await requireAdminUser();
  const params = searchParams ? await searchParams : {};
  const activeFilter = normalizeContentAssetFilter(params.status);
  const query = normalizeContentAssetQuery(params.q);
  const [notes, stats] = await Promise.all([
    listAdminContentAssets({ status: activeFilter, query }),
    getAdminContentAssetStats(),
  ]);
  const hasActiveSearch = activeFilter !== "ALL" || Boolean(query);

  return (
    <AdminShell
      description="管理草稿、已发布内容和公开知识库的发布状态。"
      title="内容资产"
    >
      <div className="mb-5 grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "全部内容", value: stats.total },
            { label: "草稿", value: stats.private },
            { label: "已发布", value: stats.published },
          ].map((item) => (
            <div
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              key={item.label}
            >
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Link
                  className={
                    activeFilter === filter.value
                      ? "rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                      : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                  }
                  href={buildFilterHref(filter.value, query)}
                  key={filter.value}
                >
                  {filter.title}
                </Link>
              ))}
            </div>
            {hasActiveSearch ? (
              <p className="text-xs text-slate-500">
                当前显示 {notes.length} 条结果
                {query ? `，关键词“${query}”` : ""}
                {activeFilter !== "ALL"
                  ? `，状态为${activeFilter === "PUBLISHED" ? "已发布" : "草稿"}`
                  : ""}
                。
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form action="/admin/content" className="flex min-w-0 gap-2">
              {activeFilter !== "ALL" ? (
                <input name="status" type="hidden" value={activeFilter} />
              ) : null}
              <label className="sr-only" htmlFor="content-search">
                搜索内容资产
              </label>
              <div className="relative min-w-0 flex-1 sm:w-72">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  defaultValue={query}
                  id="content-search"
                  name="q"
                  placeholder="搜索标题、摘要或 slug"
                />
              </div>
              <Button type="submit" variant="secondary">
                搜索
              </Button>
            </form>
            {hasActiveSearch ? (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                href="/admin/content"
              >
                清空
              </Link>
            ) : null}

            <Button asChild>
              <Link href="/admin/content/new">新建内容</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {notes.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div>
              <p className="text-base font-semibold text-slate-950">
                没有匹配的内容资产
              </p>
              <p className="mt-2 text-sm text-slate-500">
                可以调整筛选条件，或先写一条 Markdown 内容。
              </p>
              <Button asChild className="mt-5">
                <Link href="/admin/content/new">新建内容</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notes.map((note) => {
              const publicHref = getPublishedContentAssetHref(note);

              return (
                <article
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  key={note.id}
                >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={note.status === "PUBLISHED" ? "success" : "secondary"}
                    >
                      {note.status === "PUBLISHED" ? "已发布" : "草稿"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      更新于 {formatDate(note.updatedAt)}
                    </span>
                  </div>

                  <Link
                    className="mt-3 inline-flex min-w-0 items-center gap-2 text-base font-semibold text-slate-950 transition-colors hover:text-blue-700"
                    href={`/admin/content/${note.id}`}
                  >
                    <PencilLine aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </Link>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {note.excerpt || "暂无摘要。"}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    /knowledge/{note.slug} · {formatDate(note.publishedAt)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  {publicHref ? (
                    <Link
                      className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                      href={publicHref}
                      rel="noreferrer"
                      target="_blank"
                    >
                      公开页
                    </Link>
                  ) : null}
                  <Link
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    href={`/admin/content/${note.id}`}
                  >
                    编辑
                  </Link>
                  <ContentAssetActions id={note.id} status={note.status} />
                </div>
              </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
