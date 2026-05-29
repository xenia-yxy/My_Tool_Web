import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, PencilLine } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdminUser } from "@/server/auth";
import {
  getAdminContentAssetStats,
  listRecentAdminContentAssets,
} from "@/server/content-queries";
import {
  normalizeContentAssetFilter,
  normalizeContentAssetQuery,
} from "@/server/content-assets";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
    q?: string | string[];
  }>;
};

function buildLegacyContentRedirect(params: {
  status?: string | string[];
  q?: string | string[];
}) {
  const status = normalizeContentAssetFilter(params.status);
  const query = normalizeContentAssetQuery(params.q);
  const searchParams = new URLSearchParams();

  if (status !== "ALL") {
    searchParams.set("status", status);
  }

  if (query) {
    searchParams.set("q", query);
  }

  const search = searchParams.toString();

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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminUser();
  const params = searchParams ? await searchParams : {};

  if (params.status !== undefined || params.q !== undefined) {
    redirect(buildLegacyContentRedirect(params));
  }

  const [stats, recentNotes] = await Promise.all([
    getAdminContentAssetStats(),
    listRecentAdminContentAssets(5),
  ]);

  return (
    <AdminShell
      description="快速查看内容运营状态，并进入内容资产、工具和后续业务模块。"
      title="仪表盘"
    >
      <div className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              label: "内容总数",
              value: stats.total,
              detail: "全部沉淀内容",
              href: "/admin/content",
            },
            {
              label: "已发布",
              value: stats.published,
              detail: "公开知识库可见",
              href: "/admin/content?status=PUBLISHED",
            },
            {
              label: "草稿",
              value: stats.private,
              detail: "仅后台可见",
              href: "/admin/content?status=PRIVATE",
            },
          ].map((item) => (
            <Link
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              href={item.href}
              key={item.href}
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {item.value}
              </p>
              <p className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-500">
                {item.detail}
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-700"
                />
              </p>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  最近更新内容
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  从这里快速回到正在沉淀的内容资产。
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/admin/content">查看全部</Link>
              </Button>
            </div>

            {recentNotes.length === 0 ? (
              <div className="grid place-items-center px-6 py-14 text-center">
                <div>
                  <FileText
                    aria-hidden="true"
                    className="mx-auto h-8 w-8 text-slate-300"
                  />
                  <p className="mt-4 text-base font-semibold text-slate-950">
                    还没有内容资产
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    先写一条 Markdown 内容，后台会从这里开始生长。
                  </p>
                  <Button asChild className="mt-5">
                    <Link href="/admin/content/new">新建内容</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotes.map((note) => (
                  <article className="px-5 py-4" key={note.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          note.status === "PUBLISHED" ? "success" : "secondary"
                        }
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
                      <PencilLine
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="truncate">{note.title}</span>
                    </Link>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {note.excerpt || "暂无摘要。"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">快捷入口</h2>
            <div className="mt-4 grid gap-3">
              {[
                {
                  title: "新建内容",
                  description: "记录新的实践、方法论或复盘。",
                  href: "/admin/content/new",
                },
                {
                  title: "内容资产中心",
                  description: "搜索、筛选、发布和撤回内容。",
                  href: "/admin/content",
                },
                {
                  title: "最近草稿",
                  description: "继续编辑还没有公开的内容。",
                  href: "/admin/content?status=PRIVATE",
                },
                {
                  title: "已发布内容",
                  description: "查看当前公开知识库内容。",
                  href: "/admin/content?status=PUBLISHED",
                },
              ].map((item) => (
                <Link
                  className="group rounded-lg border border-slate-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                  href={item.href}
                  key={item.href}
                >
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-950">
                    {item.title}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-700"
                    />
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-500">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
