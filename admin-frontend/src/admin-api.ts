export type ContentStatus = "PRIVATE" | "PUBLISHED";

export type ContentAssetListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export type ContentAsset = ContentAssetListItem & {
  content: string;
  authorId: string;
};

export type ContentStats = {
  total: number;
  private: number;
  published: number;
};

export type ContentAssetInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ContentStatus;
};

type DashboardPayload = {
  stats: ContentStats;
  recent: ContentAssetListItem[];
};

type ContentListPayload = {
  assets: ContentAssetListItem[];
  stats: ContentStats;
  filter: {
    status: "ALL" | ContentStatus;
    query: string;
  };
};

type ContentPayload = {
  asset: ContentAsset;
};

const adminBackendUrl =
  import.meta.env.VITE_ADMIN_BACKEND_URL || "http://localhost:3001";
const adminApiToken = import.meta.env.VITE_ADMIN_API_TOKEN || "";

export function getAdminBackendUrl() {
  return String(adminBackendUrl).replace(/\/+$/, "");
}

async function adminFetch<T>(path: string, init: RequestInit = {}) {
  if (!adminApiToken) {
    throw new Error("管理端缺少 VITE_ADMIN_API_TOKEN 环境变量");
  }

  const response = await fetch(`${getAdminBackendUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${adminApiToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || `请求失败：HTTP ${response.status}`);
  }

  return payload as T;
}

export function getDashboard() {
  return adminFetch<DashboardPayload>("/api/admin/dashboard");
}

export function listContentAssets(input: { status?: string; q?: string }) {
  const params = new URLSearchParams();

  if (input.status && input.status !== "ALL") {
    params.set("status", input.status);
  }

  if (input.q) {
    params.set("q", input.q);
  }

  const search = params.toString();

  return adminFetch<ContentListPayload>(
    `/api/admin/content${search ? `?${search}` : ""}`,
  );
}

export async function getContentAsset(id: string) {
  const payload = await adminFetch<ContentPayload>(`/api/admin/content/${id}`);

  return payload.asset;
}

export async function createContentAsset(input: ContentAssetInput) {
  const payload = await adminFetch<ContentPayload>("/api/admin/content", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return payload.asset;
}

export async function updateContentAsset(
  id: string,
  input: ContentAssetInput,
) {
  const payload = await adminFetch<ContentPayload>(`/api/admin/content/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return payload.asset;
}

export function updateContentStatus(id: string, action: "publish" | "withdraw") {
  return adminFetch<ContentPayload>(`/api/admin/content/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export function deleteContentAsset(id: string) {
  return adminFetch<{ ok: true }>(`/api/admin/content/${id}`, {
    method: "DELETE",
  });
}
