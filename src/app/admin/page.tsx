import Link from "next/link";
import { PencilLine } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentAssetActions } from "@/components/admin/content-asset-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminContentAssets, type ContentAssetFilter } from "@/server/content-queries";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
  }>;
};

const filters: Array<{ title: string; value: ContentAssetFilter; href: string }> = [
  { title: "全部", value: "ALL", href: "/admin" },
  { title: "草稿", value: "PRIVATE", href: "/admin?status=PRIVATE" },
  { title: "已发布", value: "PUBLISHED", href: "/admin?status=PUBLISHED" },
];

function readFilter(value?: string | string[]): ContentAssetFilter {
  const status = Array.isArray(value) ? value[0] : value;

  if (status === "PRIVATE" || status === "PUBLISHED") {
    return status;
  }

  return "ALL";
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminUser();
  const params = searchParams ? await searchParams : {};
  const activeFilter = readFilter(params.status);
  const notes = await listAdminContentAssets(activeFilter);

  return (
    <AdminShell
      description="列表即后台首页。这里管理草稿、已发布内容，以及进入公开知识库的发布状态。"
      title="内容资产"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              className={
                activeFilter === filter.value
                  ? "rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                  : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
              }
              href={filter.href}
              key={filter.value}
            >
              {filter.title}
            </Link>
          ))}
        </div>

        <Button asChild>
          <Link href="/admin/content/new">新建内容</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {notes.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div>
              <p className="text-base font-semibold text-slate-950">
                还没有内容资产
              </p>
              <p className="mt-2 text-sm text-slate-500">
                先写一条 Markdown 内容，发布后它会进入公开知识库。
              </p>
              <Button asChild className="mt-5">
                <Link href="/admin/content/new">新建内容</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notes.map((note) => (
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
                  <Link
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    href={`/admin/content/${note.id}`}
                  >
                    编辑
                  </Link>
                  <ContentAssetActions id={note.id} status={note.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
