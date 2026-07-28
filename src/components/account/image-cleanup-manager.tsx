"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Database, HardDrive, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ImageCleanupTargetId =
  | "generated-gallery"
  | "material-library"
  | "product-images"
  | "ip-prototypes"
  | "workbench-cache"
  | "runtime-files";

type ImageCleanupSummary = {
  generatedAssets: number;
  imageJobs: number;
  materialImages: number;
  materialProfileLinks: number;
  materialProjectLinks: number;
  productImages: number;
  ipPrototypeGenerations: number;
  workbenchSessions: number;
  creativeCanvasSessions: number;
  runtimeFiles: number;
  runtimeBytes: number;
  storedUrls: number;
};

type ImageCleanupPayload = {
  summary?: ImageCleanupSummary;
  result?: ImageCleanupSummary & {
    deletedStoredObjects: number;
    failedStoredObjects: number;
  };
  error?: string;
};

const cleanupTargets: Array<{
  id: ImageCleanupTargetId;
  title: string;
  description: string;
}> = [
  {
    id: "generated-gallery",
    title: "生成图和画廊",
    description: "清理 AI 生图结果、下载图、参考图记录和生成任务队列。",
  },
  {
    id: "material-library",
    title: "素材库和模特引用",
    description: "清理公开素材、模特参考图绑定、男装/女装项目引用。",
  },
  {
    id: "product-images",
    title: "选品图片",
    description: "保留商品档案文字信息，只清空商品图片。",
  },
  {
    id: "ip-prototypes",
    title: "IP 原型图片",
    description: "清理 IP 原型生成图、草图和风格参考图记录。",
  },
  {
    id: "workbench-cache",
    title: "工作记录和画布缓存",
    description: "清理工作记录里的图片引用、创作画布节点和运行记录。",
  },
  {
    id: "runtime-files",
    title: "服务器本地残留文件",
    description: "清理 .runtime/uploads 下的本地图片文件，不影响代码静态资源。",
  },
];

const allTargetIds = cleanupTargets.map((target) => target.id);

async function fetchCleanupPreview(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as ImageCleanupPayload;

  if (!response.ok || !payload.summary) {
    throw new Error(payload.error || "图片清理统计失败");
  }

  return payload.summary;
}

export function ImageCleanupManager() {
  const [selectedTargets, setSelectedTargets] = useState<ImageCleanupTargetId[]>(allTargetIds);
  const [confirmText, setConfirmText] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const previewUrl = useMemo(() => {
    const params = new URLSearchParams();
    selectedTargets.forEach((target) => params.append("target", target));
    return `/api/admin/image-cleanup?${params.toString()}`;
  }, [selectedTargets]);
  const { data, error: loadError, isLoading, mutate } = useSWR(
    previewUrl,
    fetchCleanupPreview,
  );

  function toggleTarget(target: ImageCleanupTargetId) {
    setSelectedTargets((current) =>
      current.includes(target)
        ? current.filter((item) => item !== target)
        : [...current, target],
    );
  }

  async function runCleanup() {
    setError("");
    setNotice("");
    setIsDeleting(true);

    const response = await fetch("/api/admin/image-cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirm: confirmText,
        targets: selectedTargets,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as ImageCleanupPayload;
    setIsDeleting(false);

    if (!response.ok || !payload.result) {
      setError(payload.error || "图片清理失败");
      return;
    }

    setNotice(
      `已清理 ${payload.result.storedUrls} 个图片引用，删除存储对象 ${payload.result.deletedStoredObjects} 个。`,
    );
    setConfirmText("");
    await mutate();
  }

  const summary = data || emptySummary;
  const canDelete = selectedTargets.length > 0 && confirmText === "DELETE_IMAGES" && !isDeleting;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>图片清理中心</CardTitle>
          <CardDescription>
            用于释放 OSS 和服务器本地图片空间。这里只清理运行数据图片，不删除代码里的图标、Logo 或页面静态资源。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard icon="database" label="数据库图片引用" value={`${summary.storedUrls} 个`} />
            <SummaryCard icon="database" label="生成图记录" value={`${summary.generatedAssets} 条`} />
            <SummaryCard icon="hard-drive" label="本地残留文件" value={`${summary.runtimeFiles} 个 / ${formatBytes(summary.runtimeBytes)}`} />
          </div>

          {loadError ? <StatusMessage tone="error">{loadError instanceof Error ? loadError.message : "统计失败"}</StatusMessage> : null}
          {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void mutate()} type="button" variant="secondary">
              <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
              刷新统计
            </Button>
            <Button onClick={() => setSelectedTargets(allTargetIds)} type="button" variant="secondary">
              全选
            </Button>
            <Button onClick={() => setSelectedTargets([])} type="button" variant="secondary">
              清空选择
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>清理范围</CardTitle>
            <CardDescription>
              勾选后会一起清理数据库记录、OSS 对象和本地残留文件。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {cleanupTargets.map((target) => (
                <label
                  className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                  key={target.id}
                >
                  <input
                    checked={selectedTargets.includes(target.id)}
                    className="mt-1 h-4 w-4"
                    onChange={() => toggleTarget(target.id)}
                    type="checkbox"
                  />
                  <span>
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-950">
                      {target.title}
                      <Badge variant={selectedTargets.includes(target.id) ? "success" : "secondary"}>
                        {selectedTargets.includes(target.id) ? "将清理" : "保留"}
                      </Badge>
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-600">
                      {target.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>执行删除</CardTitle>
            <CardDescription>
              删除不可恢复。执行前请确认已选范围和统计数量。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              输入 <span className="font-semibold">DELETE_IMAGES</span> 后才允许执行。
            </div>
            <input
              className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="DELETE_IMAGES"
              value={confirmText}
            />
            <Button
              className="h-11 gap-2"
              disabled={!canDelete}
              onClick={() => void runCleanup()}
              type="button"
              variant="danger"
            >
              {isDeleting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}
              清理所选图片
            </Button>
            {isLoading ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                正在统计
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>当前统计明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            <StatLine label="生成图" value={summary.generatedAssets} />
            <StatLine label="生成任务" value={summary.imageJobs} />
            <StatLine label="素材图片" value={summary.materialImages} />
            <StatLine label="素材模特绑定" value={summary.materialProfileLinks} />
            <StatLine label="素材项目引用" value={summary.materialProjectLinks} />
            <StatLine label="选品图片" value={summary.productImages} />
            <StatLine label="IP 生成图" value={summary.ipPrototypeGenerations} />
            <StatLine label="工作记录" value={summary.workbenchSessions} />
            <StatLine label="画布会话" value={summary.creativeCanvasSessions} />
            <StatLine label="本地文件" value={summary.runtimeFiles} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: "database" | "hard-drive";
  label: string;
  value: string;
}) {
  const Icon = icon === "database" ? Database : HardDrive;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function StatusMessage({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  return <div className={tone === "error" ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"}>{children}</div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

const emptySummary: ImageCleanupSummary = {
  generatedAssets: 0,
  imageJobs: 0,
  materialImages: 0,
  materialProfileLinks: 0,
  materialProjectLinks: 0,
  productImages: 0,
  ipPrototypeGenerations: 0,
  workbenchSessions: 0,
  creativeCanvasSessions: 0,
  runtimeFiles: 0,
  runtimeBytes: 0,
  storedUrls: 0,
};
