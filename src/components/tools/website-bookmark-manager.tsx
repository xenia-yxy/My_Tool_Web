"use client";

import { useMemo, useState, type FormEvent } from "react";
import useSWR from "swr";
import {
  ArrowUpRight,
  BookMarked,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recordWorkbenchAction } from "@/components/tools/workbench-action-recorder";

type WebsiteBookmark = {
  id: string;
  title: string;
  url: string;
  category: string;
  subcategory: string;
  summary: string;
  tags: string[];
  note: string | null;
  source: "preset" | "user";
};

type WebsiteBookmarkPayload = {
  bookmarks: WebsiteBookmark[];
  stats: {
    total: number;
    douyin: number;
    xiaohongshu: number;
    ai: number;
    crossPlatform: number;
    custom: number;
  };
};

type SummaryDraft = {
  title: string;
  url: string;
  summary: string;
  error?: boolean;
};

const categories = [
  ["all", "全部"],
  ["douyin", "抖音"],
  ["xiaohongshu", "小红书"],
  ["ai", "AI"],
  ["crossPlatform", "跨平台"],
  ["custom", "自定义"],
] as const;

const categoryLabels = Object.fromEntries(categories) as Record<string, string>;

async function fetchBookmarks(url: string) {
  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as
    | WebsiteBookmarkPayload
    | { error?: string };

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "网站库加载失败");
  }

  return payload as WebsiteBookmarkPayload;
}

export function WebsiteBookmarkManager() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState<SummaryDraft>({
    title: "",
    url: "",
    summary: "",
  });
  const [summaryDrafts, setSummaryDrafts] = useState<SummaryDraft[]>([]);
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("category", category);
    if (query.trim()) params.set("q", query.trim());

    return `/api/website-bookmarks?${params.toString()}`;
  }, [category, query]);
  const { data, error: loadError, isLoading, mutate } = useSWR(
    apiUrl,
    fetchBookmarks,
  );
  const bookmarks = useMemo(() => data?.bookmarks ?? [], [data?.bookmarks]);
  const groupedBookmarks = useMemo(
    () => groupBookmarks(bookmarks, category),
    [bookmarks, category],
  );

  async function summarizeUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSummarizing(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/website-bookmarks/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: formData.get("urls") }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      url?: string;
      title?: string;
      summary?: string;
      results?: SummaryDraft[];
      error?: string;
    };

    setIsSummarizing(false);

    if (!response.ok) {
      setError(payload.error || "网页总结失败");
      return;
    }

    const drafts = payload.results?.length
      ? payload.results
      : [
          {
            title: payload.title || "",
            url: payload.url || "",
            summary: payload.summary || "",
          },
        ];
    setSummaryDrafts(drafts);
    setSummaryDraft(drafts[0] || { title: "", url: "", summary: "" });
    void recordWorkbenchAction({
      toolId: "sites",
      toolLabel: "网站库",
      actionLabel: "生成摘要",
      title: `网页摘要：${drafts[0]?.title || drafts[0]?.url || "批量网址"}`,
      fields: [
        { label: "网址数量", value: String(drafts.length) },
        { label: "首个网址", value: drafts[0]?.url || "" },
      ],
      inputSnapshot: {
        urls: drafts.map((draft) => draft.url),
      },
      outputSummary: `已生成 ${drafts.length} 个网页摘要。`,
      outputSnapshot: {
        drafts,
      },
    });
  }

  async function saveBookmark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/website-bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        url: formData.get("url"),
        category: formData.get("category"),
        subcategory: formData.get("subcategory"),
        summary: formData.get("summary"),
        tags: formData.get("tags"),
        note: formData.get("note"),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      bookmark?: WebsiteBookmark;
      error?: string;
    };

    setIsSaving(false);

    if (!response.ok || !payload.bookmark) {
      setError(payload.error || "网站保存失败");
      return;
    }

    await mutate();
    void recordWorkbenchAction({
      toolId: "sites",
      toolLabel: "网站库",
      actionLabel: "保存网站",
      title: `保存网站：${payload.bookmark.title}`,
      fields: [
        { label: "网站名称", value: payload.bookmark.title },
        { label: "网址", value: payload.bookmark.url },
        { label: "分类", value: categoryLabels[payload.bookmark.category] || payload.bookmark.category },
      ],
      inputSnapshot: {
        id: payload.bookmark.id,
        title: payload.bookmark.title,
        url: payload.bookmark.url,
        category: payload.bookmark.category,
        subcategory: payload.bookmark.subcategory,
        tags: payload.bookmark.tags,
      },
      outputSummary: "网站已保存到网站库。",
    });
    event.currentTarget.reset();
    setSummaryDraft({ title: "", url: "", summary: "" });
    setSummaryDrafts([]);
    setIsAddOpen(false);
  }

  async function deleteBookmark(bookmark: WebsiteBookmark) {
    const response = await fetch(`/api/website-bookmarks/${bookmark.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(payload.error || "网站删除失败");
      return;
    }

    await mutate();
    void recordWorkbenchAction({
      toolId: "sites",
      toolLabel: "网站库",
      actionLabel: "删除网站",
      title: `删除网站：${bookmark.title}`,
      fields: [
        { label: "网站名称", value: bookmark.title },
        { label: "网址", value: bookmark.url },
      ],
      inputSnapshot: {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category,
      },
      outputSummary: "自存网站已删除。",
    });
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">网站展示</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              共 {data?.stats.total ?? 0} 个网站。这里专注浏览、分类筛选和打开工具。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map(([value, label]) => (
                <button
                  className={`h-9 rounded-full border px-3 text-sm font-medium transition-colors ${
                    category === value
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:text-slate-950"
                  }`}
                  key={value}
                  onClick={() => setCategory(value)}
                  type="button"
                >
                  {label}
                  {value !== "all" && data?.stats[value as keyof WebsiteBookmarkPayload["stats"]]
                    ? ` ${data.stats[value as keyof WebsiteBookmarkPayload["stats"]]}`
                    : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
            <label className="relative block min-w-0 sm:w-80">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索网站、标签、摘要"
                value={query}
              />
            </label>
            <Button
              className="h-10 gap-2"
              onClick={() => setIsAddOpen(true)}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              添加网站
            </Button>
          </div>
        </div>

        {error || loadError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error || (loadError instanceof Error ? loadError.message : "加载失败")}
          </div>
        ) : null}
      </section>

      {isAddOpen ? (
        <AddWebsitePanel
          error={error}
          isSaving={isSaving}
          isSummarizing={isSummarizing}
          onClose={() => setIsAddOpen(false)}
          onSave={saveBookmark}
          onSummarize={summarizeUrl}
          setSummaryDraft={setSummaryDraft}
          summaryDraft={summaryDraft}
          summaryDrafts={summaryDrafts}
        />
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          加载网站库...
        </div>
      ) : groupedBookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          当前分类下没有网站。
        </div>
      ) : (
        <section className="grid gap-5">
          {groupedBookmarks.map((group) => (
            <div className="grid gap-3" key={group.title}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {group.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {group.items.length} 个网站
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((bookmark) => (
                  <WebsiteCard
                    bookmark={bookmark}
                    key={bookmark.id}
                    onDelete={deleteBookmark}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function AddWebsitePanel({
  error,
  isSaving,
  isSummarizing,
  onClose,
  onSave,
  onSummarize,
  setSummaryDraft,
  summaryDraft,
  summaryDrafts,
}: {
  error: string;
  isSaving: boolean;
  isSummarizing: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSummarize: (event: FormEvent<HTMLFormElement>) => void;
  setSummaryDraft: (draft: SummaryDraft) => void;
  summaryDraft: SummaryDraft;
  summaryDrafts: SummaryDraft[];
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">添加网站</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            从顶部入口添加；保存后回到网站展示区。
          </p>
        </div>
        <button
          aria-label="关闭添加网站"
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-950">网页总结</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                输入网址后自动提取标题和摘要，可批量最多 5 个。
              </p>
            </div>
          </div>
          <form className="mt-4 grid gap-3" onSubmit={onSummarize}>
            <textarea
              className="min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              name="urls"
              placeholder={"https://example.com\nhttps://example.com/page"}
              required
            />
            <Button className="h-11 gap-2" disabled={isSummarizing} type="submit">
              {isSummarizing ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="h-4 w-4" />
              )}
              生成摘要
            </Button>
          </form>
          {summaryDrafts.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {summaryDrafts.map((draft) => (
                <button
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    summaryDraft.url === draft.url
                      ? "border-blue-200 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                  key={draft.url}
                  onClick={() => setSummaryDraft(draft)}
                  type="button"
                >
                  <span className="block font-medium">{draft.title}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5">
                    {draft.summary}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-950">保存网站</h3>
          <form
            className="mt-4 grid gap-3"
            key={`${summaryDraft.url}-${summaryDraft.title}`}
            onSubmit={onSave}
          >
            <TextInput
              defaultValue={summaryDraft.title}
              label="网站名称"
              name="title"
              placeholder="例如：蝉妈妈"
            />
            <TextInput
              defaultValue={summaryDraft.url}
              label="网站地址"
              name="url"
              placeholder="https://..."
              type="url"
            />
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">分类</span>
              <select
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                name="category"
              >
                {categories.slice(1).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <TextInput label="子分类" name="subcategory" placeholder="例如：数据分析" />
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">摘要</span>
              <textarea
                className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                defaultValue={summaryDraft.summary}
                name="summary"
                placeholder="这个网站主要用来做什么"
                required
              />
            </label>
            <TextInput label="标签" name="tags" placeholder="抖音, 数据, 投流" />
            <TextInput label="备注" name="note" placeholder="自己的使用记录" required={false} />

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button className="h-11" disabled={isSaving} type="submit">
              {isSaving ? "保存中" : "保存到网站库"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function WebsiteCard({
  bookmark,
  onDelete,
}: {
  bookmark: WebsiteBookmark;
  onDelete: (bookmark: WebsiteBookmark) => Promise<void>;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">{bookmark.title}</h3>
            <Badge variant={bookmark.source === "preset" ? "secondary" : "success"}>
              {bookmark.source === "preset" ? "预置" : "自存"}
            </Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-blue-700">
            {categoryLabels[bookmark.category] || bookmark.category} /{" "}
            {bookmark.subcategory}
          </p>
        </div>
        <BookMarked aria-hidden="true" className="h-5 w-5 text-slate-300" />
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
        {bookmark.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {bookmark.tags.map((tag) => (
          <span
            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild className="gap-2" variant="secondary">
          <a href={bookmark.url} rel="noreferrer" target="_blank">
            打开网站
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </Button>
        {bookmark.source === "user" ? (
          <Button
            onClick={() => void onDelete(bookmark)}
            type="button"
            variant="danger"
          >
            <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
            删除
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function TextInput({
  defaultValue,
  label,
  name,
  placeholder,
  required = true,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function groupBookmarks(bookmarks: WebsiteBookmark[], activeCategory: string) {
  const groups = new Map<string, WebsiteBookmark[]>();

  bookmarks.forEach((bookmark) => {
    const title =
      activeCategory === "all"
        ? categoryLabels[bookmark.category] || bookmark.category
        : bookmark.subcategory || "未分类";
    const existing = groups.get(title) || [];
    existing.push(bookmark);
    groups.set(title, existing);
  });

  return Array.from(groups.entries()).map(([title, items]) => ({
    title,
    items,
  }));
}
