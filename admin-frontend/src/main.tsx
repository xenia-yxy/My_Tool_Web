import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createContentAsset,
  deleteContentAsset,
  getAdminBackendUrl,
  getContentAsset,
  getDashboard,
  listContentAssets,
  updateContentAsset,
  updateContentStatus,
  type ContentAsset,
  type ContentAssetInput,
  type ContentAssetListItem,
  type ContentStats,
  type ContentStatus,
} from "./admin-api";
import "./styles.css";

type View =
  | { name: "dashboard" }
  | { name: "content" }
  | { name: "new" }
  | { name: "edit"; id: string };

const emptyStats: ContentStats = {
  total: 0,
  private: 0,
  published: 0,
};

function getViewFromLocation(): View {
  const path = window.location.pathname;

  if (path === "/content/new") {
    return { name: "new" };
  }

  if (path.startsWith("/content/")) {
    return { name: "edit", id: path.replace("/content/", "") };
  }

  if (path === "/content") {
    return { name: "content" };
  }

  return { name: "dashboard" };
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function App() {
  const [view, setView] = useState<View>(() => getViewFromLocation());

  useEffect(() => {
    const onPopState = () => setView(getViewFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">Xenia Admin</p>
        <p className="backend">Backend: {getAdminBackendUrl()}</p>
        <nav aria-label="管理端导航" className="nav">
          <button onClick={() => navigate("/")} type="button">
            仪表盘
          </button>
          <button onClick={() => navigate("/content")} type="button">
            内容资产
          </button>
          <button onClick={() => navigate("/content/new")} type="button">
            新建内容
          </button>
        </nav>
      </aside>
      <main className="main">
        {view.name === "dashboard" ? <DashboardView /> : null}
        {view.name === "content" ? <ContentListView /> : null}
        {view.name === "new" ? <ContentFormView mode="create" /> : null}
        {view.name === "edit" ? (
          <ContentFormView id={view.id} mode="edit" />
        ) : null}
      </main>
    </div>
  );
}

function useAsync<T>(load: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    load()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((reason: unknown) => {
        if (alive) {
          setError(reason instanceof Error ? reason.message : "请求失败");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, deps);

  return { data, error, loading };
}

function DashboardView() {
  const { data, error, loading } = useAsync(() => getDashboard(), []);
  const stats = data?.stats || emptyStats;

  return (
    <div>
      <Header
        actionLabel="新建内容"
        onAction={() => navigate("/content/new")}
        eyebrow="管理端"
        title="本地管理端仪表盘"
      />
      <StatsGrid stats={stats} />
      <section className="card spaced">
        <div className="toolbar">
          <div>
            <h2>最近更新</h2>
            <p className="muted">最近 5 条内容资产。</p>
          </div>
          <button onClick={() => navigate("/content")} type="button">
            查看全部
          </button>
        </div>
        <ContentState error={error} loading={loading} />
        {data?.recent.map((asset) => (
          <ContentRow asset={asset} key={asset.id} />
        ))}
        {data && data.recent.length === 0 ? (
          <p className="muted">暂无内容资产。</p>
        ) : null}
      </section>
    </div>
  );
}

function ContentListView() {
  const query = new URLSearchParams(window.location.search);
  const [status, setStatus] = useState(query.get("status") || "ALL");
  const [q, setQ] = useState(query.get("q") || "");
  const [refreshKey, setRefreshKey] = useState(0);
  const request = useMemo(() => ({ status, q }), [status, q]);
  const { data, error, loading } = useAsync(
    () => listContentAssets(request),
    [request, refreshKey],
  );
  const stats = data?.stats || emptyStats;

  async function changeStatus(asset: ContentAssetListItem) {
    await updateContentStatus(
      asset.id,
      asset.status === "PUBLISHED" ? "withdraw" : "publish",
    );
    setRefreshKey((value) => value + 1);
  }

  async function remove(id: string) {
    if (!window.confirm("确定删除这条内容？")) return;
    await deleteContentAsset(id);
    setRefreshKey((value) => value + 1);
  }

  return (
    <div>
      <Header
        actionLabel="新建内容"
        onAction={() => navigate("/content/new")}
        eyebrow="内容资产"
        title="内容管理"
      />
      <StatsGrid stats={stats} />
      <section className="card spaced">
        <div className="toolbar">
          <div className="actions">
            {["ALL", "PRIVATE", "PUBLISHED"].map((item) => (
              <button
                className={status === item ? "primary" : ""}
                key={item}
                onClick={() => setStatus(item)}
                type="button"
              >
                {item === "ALL" ? "全部" : item === "PRIVATE" ? "草稿" : "已发布"}
              </button>
            ))}
          </div>
          <form
            className="actions"
            onSubmit={(event) => {
              event.preventDefault();
              setRefreshKey((value) => value + 1);
            }}
          >
            <input
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索标题、摘要或 slug"
              value={q}
            />
            <button type="submit">搜索</button>
          </form>
        </div>
        <ContentState error={error} loading={loading} />
        {data?.assets.map((asset) => (
          <ContentRow
            asset={asset}
            key={asset.id}
            onChangeStatus={() => void changeStatus(asset)}
            onDelete={() => void remove(asset.id)}
          />
        ))}
        {data && data.assets.length === 0 ? (
          <p className="muted">没有匹配的内容资产。</p>
        ) : null}
      </section>
    </div>
  );
}

function ContentFormView({
  id,
  mode,
}: {
  id?: string;
  mode: "create" | "edit";
}) {
  const isEdit = mode === "edit";
  const { data, error, loading } = useAsync<ContentAsset | null>(
    () => (id ? getContentAsset(id) : Promise.resolve(null)),
    [id],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: ContentAssetInput = {
      title: String(formData.get("title") || ""),
      slug: String(formData.get("slug") || ""),
      excerpt: String(formData.get("excerpt") || ""),
      content: String(formData.get("content") || ""),
      status:
        formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "PRIVATE",
    };
    const asset = isEdit && id
      ? await updateContentAsset(id, input)
      : await createContentAsset(input);

    navigate(`/content/${asset.id}`);
  }

  if (loading && isEdit) return <p className="muted">加载中...</p>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div>
      <Header
        actionLabel="返回列表"
        onAction={() => navigate("/content")}
        eyebrow="内容资产"
        title={isEdit ? "编辑内容" : "新建内容"}
      />
      <section className="card">
        <form className="form" onSubmit={(event) => void submit(event)}>
          <div className="grid two">
            <Field label="标题" name="title" required value={data?.title} />
            <Field label="链接标识" name="slug" value={data?.slug} />
          </div>
          <label className="field">
            <span>摘要</span>
            <textarea defaultValue={data?.excerpt || ""} name="excerpt" />
          </label>
          <label className="field">
            <span>Markdown 正文</span>
            <textarea defaultValue={data?.content || ""} name="content" required />
          </label>
          <label className="field">
            <span>状态</span>
            <select defaultValue={data?.status || "PRIVATE"} name="status">
              <option value="PRIVATE">保存草稿</option>
              <option value="PUBLISHED">发布</option>
            </select>
          </label>
          <div className="actions">
            <button className="primary" type="submit">
              {isEdit ? "保存修改" : "保存"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Header({
  actionLabel,
  eyebrow,
  onAction,
  title,
}: {
  actionLabel: string;
  eyebrow: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{title}</h1>
      </div>
      <button className="primary" onClick={onAction} type="button">
        {actionLabel}
      </button>
    </header>
  );
}

function StatsGrid({ stats }: { stats: ContentStats }) {
  return (
    <section className="grid stats">
      <div className="card">
        <p className="eyebrow">全部内容</p>
        <p className="stat-value">{stats.total}</p>
      </div>
      <div className="card">
        <p className="eyebrow">草稿</p>
        <p className="stat-value">{stats.private}</p>
      </div>
      <div className="card">
        <p className="eyebrow">已发布</p>
        <p className="stat-value">{stats.published}</p>
      </div>
    </section>
  );
}

function ContentRow({
  asset,
  onChangeStatus,
  onDelete,
}: {
  asset: ContentAssetListItem;
  onChangeStatus?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="row">
      <div>
        <span className={asset.status === "PUBLISHED" ? "badge published" : "badge"}>
          {asset.status === "PUBLISHED" ? "已发布" : "草稿"}
        </span>
        <h3>
          <button className="link" onClick={() => navigate(`/content/${asset.id}`)} type="button">
            {asset.title}
          </button>
        </h3>
        <p className="muted">{asset.excerpt || "暂无摘要"}</p>
        <p className="muted small">/knowledge/{asset.slug}</p>
      </div>
      <div className="actions">
        <button onClick={() => navigate(`/content/${asset.id}`)} type="button">
          编辑
        </button>
        {onChangeStatus ? (
          <button onClick={onChangeStatus} type="button">
            {asset.status === "PUBLISHED" ? "撤回" : "发布"}
          </button>
        ) : null}
        {onDelete ? (
          <button className="danger" onClick={onDelete} type="button">
            删除
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Field({
  label,
  name,
  required,
  value,
}: {
  label: string;
  name: string;
  required?: boolean;
  value?: string | null;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input defaultValue={value || ""} name={name} required={required} />
    </label>
  );
}

function ContentState({ error, loading }: { error: string; loading: boolean }) {
  if (loading) return <p className="muted">加载中...</p>;
  if (error) return <div className="card error">{error}</div>;
  return null;
}

createRoot(document.getElementById("root")!).render(<App />);
