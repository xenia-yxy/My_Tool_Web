"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CheckSquare,
  Copy,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readJsonResponse } from "@/lib/http-response";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";

type AiImageAsset = {
  id: string;
  mode: string;
  sourceTool: string | null;
  status: string;
  jobId: string | null;
  title: string;
  description: string | null;
  caption: string | null;
  tags: string[];
  productKeywords: string[];
  prompt: string;
  imageUrl: string;
  downloadUrl: string;
  fileName: string;
  note: string | null;
  errorMessage: string | null;
  referenceImages: string[];
  referenceLabels: string[];
  createdAt: string;
};

type AiImageJob = {
  id: string;
  mode: string;
  sourceTool: string | null;
  status: string;
  title: string;
  batchCount: number;
  completedCount: number;
  failedCount: number;
  errorMessage: string | null;
  createdAt: string;
};

type GalleryPayload = {
  assets: AiImageAsset[];
  jobs: AiImageJob[];
  error?: string;
};

type MenswearProvenance = {
  modelProfileId: string | null;
  projectId: string;
  references: Array<{
    fidelity: number;
    materialId: string;
    policy: string;
    role: string;
  }>;
};

const modeFilters = [
  { value: "", label: "全部" },
  { value: "menswear", label: "男装" },
  { value: "womenswear", label: "女装" },
  { value: "snack-grocery", label: "零食百货" },
  { value: "custom", label: "自定义" },
  { value: "outfit", label: "服装综合" },
];

const statusFilters = [
  { value: "", label: "全部状态" },
  { value: "SUCCEEDED", label: "成功" },
  { value: "RUNNING", label: "生成中" },
  { value: "FAILED", label: "失败" },
];

export function AiImageGalleryWorkbench() {
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("");
  const [assets, setAssets] = useState<AiImageAsset[]>([]);
  const [jobs, setJobs] = useState<AiImageJob[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [detailAsset, setDetailAsset] = useState<AiImageAsset | null>(null);
  const [previewImage, setPreviewImage] = useState<{ alt: string; url: string } | null>(null);

  const runningJobs = useMemo(
    () => jobs.filter((job) => job.status === "PENDING" || job.status === "RUNNING"),
    [jobs],
  );
  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedIds.has(asset.id)),
    [assets, selectedIds],
  );
  const allVisibleSelected = assets.length > 0 && selectedIds.size === assets.length;

  useEffect(() => {
    void loadGallery({ keepCurrentList: assets.length > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status]);

  async function loadGallery(options: { keepCurrentList?: boolean } = {}) {
    if (options.keepCurrentList) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (mode) params.set("mode", mode);
      if (status) params.set("status", status);

      const response = await fetch(`/api/tools/image-assets?${params.toString()}`);
      const payload = (await readJsonResponse<GalleryPayload>(response)) as GalleryPayload;

      if (!response.ok) {
        throw new Error(payload.error || "加载画廊失败");
      }

      setAssets(payload.assets);
      setJobs(payload.jobs);
      setSelectedIds((current) => {
        const visibleIds = new Set(payload.assets.map((asset) => asset.id));
        return new Set([...current].filter((id) => visibleIds.has(id)));
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "加载画廊失败");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  }

  function toggleSelected(assetId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(assets.map((asset) => asset.id)));
  }

  async function deleteAssets(ids: string[]) {
    if (ids.length === 0) {
      setError("请先选择要删除的图片");
      return;
    }
    if (!window.confirm(`确认删除 ${ids.length} 张图片？`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/tools/image-assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const payload = (await readJsonResponse<{ error?: string; ids?: string[] }>(
        response,
      )) as { error?: string; ids?: string[] };

      if (!response.ok) {
        throw new Error(payload.error || "删除失败");
      }

      const deletedIds = new Set(payload.ids ?? ids);
      setAssets((current) => current.filter((asset) => !deletedIds.has(asset.id)));
      setSelectedIds((current) => new Set([...current].filter((id) => !deletedIds.has(id))));
      if (detailAsset && deletedIds.has(detailAsset.id)) {
        setDetailAsset(null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  }

  async function downloadAssets(targetAssets: AiImageAsset[]) {
    if (targetAssets.length === 0) {
      setError("暂无可下载图片");
      return;
    }

    if (targetAssets.length === 1) {
      triggerBrowserDownload(
        targetAssets[0].downloadUrl || targetAssets[0].imageUrl,
        targetAssets[0].fileName,
      );
      return;
    }

    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch("/api/tools/image-assets/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targetAssets.map((asset) => asset.id) }),
      });

      if (!response.ok) {
        const payload = (await readJsonResponse<{ error?: string }>(response)) as {
          error?: string;
        };
        throw new Error(payload.error || "打包下载失败");
      }

      const archiveUrl = URL.createObjectURL(await response.blob());
      triggerBrowserDownload(archiveUrl, "ai-image-assets.zip");
      window.setTimeout(() => URL.revokeObjectURL(archiveUrl), 0);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "打包下载失败");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>统一图片资产</CardTitle>
              <CardDescription>
                图片只展示画面；标题、文案、tags 和选品词都在卡片里管理。
              </CardDescription>
            </div>
            <Button
              className="gap-2"
              disabled={isRefreshing}
              onClick={() => void loadGallery({ keepCurrentList: true })}
              type="button"
              variant="secondary"
            >
              {isRefreshing ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
              )}
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5">
          <FilterPills items={modeFilters} onChange={setMode} value={mode} />
          <FilterPills compact items={statusFilters} onChange={setStatus} value={status} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Button
              className="h-9 gap-2 px-3"
              disabled={assets.length === 0}
              onClick={toggleSelectAll}
              type="button"
              variant="secondary"
            >
              {allVisibleSelected ? (
                <CheckSquare aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Square aria-hidden="true" className="h-4 w-4" />
              )}
              {allVisibleSelected ? "取消全选" : "全选"}
            </Button>
            <span>
              共 {assets.length} 张，已选 {selectedIds.size} 张
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-9 gap-2 px-3"
              disabled={assets.length === 0 || isDownloading}
              onClick={() => void downloadAssets(assets)}
              type="button"
              variant="secondary"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              下载全部
            </Button>
            <Button
              className="h-9 gap-2 px-3"
              disabled={selectedAssets.length === 0 || isDownloading}
              onClick={() => void downloadAssets(selectedAssets)}
              type="button"
              variant="secondary"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              下载选中
            </Button>
            <Button
              className="h-9 gap-2 px-3"
              disabled={selectedAssets.length === 0 || isDeleting}
              onClick={() => void deleteAssets(selectedAssets.map((asset) => asset.id))}
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              删除选中
            </Button>
          </div>
        </CardContent>
      </Card>

      {runningJobs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>批量生图状态</CardTitle>
            <CardDescription>生成任务会先在这里显示，完成后图片进入下方画廊。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {runningJobs.map((job) => (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4" key={job.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{job.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {getModeLabel(job.mode)} · {job.completedCount}/{job.batchCount}
                      </p>
                    </div>
                    <Badge variant="default">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      生成中
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isInitialLoading ? (
        <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500">
          正在加载画廊
        </div>
      ) : assets.length === 0 ? (
        <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-white px-4 text-center text-sm text-slate-500">
          暂无图片。去男装、女装或零食百货工具发起批量生图。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <GalleryCard
              asset={asset}
              copiedKey={copiedKey}
              isSelected={selectedIds.has(asset.id)}
              key={asset.id}
              onCopy={copyText}
              onDelete={(id) => void deleteAssets([id])}
              onDetail={setDetailAsset}
              onDownload={(item) => void downloadAssets([item])}
              onPreview={(item) => setPreviewImage({ alt: item.title, url: item.imageUrl })}
              onToggleSelect={toggleSelected}
            />
          ))}
        </div>
      )}

      {detailAsset ? (
        <AssetDetailModal
          asset={detailAsset}
          copiedKey={copiedKey}
          onClose={() => setDetailAsset(null)}
          onCopy={copyText}
          onDownload={(asset) => void downloadAssets([asset])}
          onPreview={(url, alt) => setPreviewImage({ alt, url })}
        />
      ) : null}
      <ImagePreviewDialog alt={previewImage?.alt} imageUrl={previewImage?.url || null} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

function triggerBrowserDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function FilterPills({
  compact,
  items,
  onChange,
  value,
}: {
  compact?: boolean;
  items: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          className={[
            compact ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
            "rounded-full border font-semibold transition-colors",
            value === item.value
              ? compact
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
          ].join(" ")}
          key={item.value}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function GalleryCard({
  asset,
  copiedKey,
  isSelected,
  onCopy,
  onDelete,
  onDetail,
  onDownload,
  onPreview,
  onToggleSelect,
}: {
  asset: AiImageAsset;
  copiedKey: string | null;
  isSelected: boolean;
  onCopy: (key: string, text: string) => Promise<void>;
  onDelete: (assetId: string) => void;
  onDetail: (asset: AiImageAsset) => void;
  onDownload: (asset: AiImageAsset) => void;
  onPreview: (asset: AiImageAsset) => void;
  onToggleSelect: (assetId: string) => void;
}) {
  return (
    <article
      className={[
        "overflow-hidden rounded-lg border bg-white shadow-sm transition-colors",
        isSelected ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200",
      ].join(" ")}
    >
      <div className="relative aspect-[3/4] bg-slate-50">
        <button
          aria-label={isSelected ? "取消选择图片" : "选择图片"}
          className="absolute left-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm"
          onClick={() => onToggleSelect(asset.id)}
          type="button"
        >
          {isSelected ? (
            <CheckSquare aria-hidden="true" className="h-4 w-4 text-blue-600" />
          ) : (
            <Square aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
        <button
          aria-label={`查看 ${asset.title}`}
          className="absolute inset-0 cursor-zoom-in"
          onClick={() => onPreview(asset)}
          type="button"
        >
          <Image
            alt={asset.title}
            className="object-contain"
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            src={asset.imageUrl}
            unoptimized
          />
        </button>
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={asset.status === "FAILED" ? "warning" : "secondary"}>
            {getModeLabel(asset.mode)}
          </Badge>
          <Badge variant={asset.status === "SUCCEEDED" ? "success" : "warning"}>
            {getStatusLabel(asset.status)}
          </Badge>
          {asset.referenceImages.length > 0 ? (
            <Badge variant="secondary">参考图 {asset.referenceImages.length}</Badge>
          ) : null}
        </div>
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-950">{asset.title}</h3>
          {asset.caption ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{asset.caption}</p>
          ) : asset.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{asset.description}</p>
          ) : null}
        </div>

        {asset.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {asset.tags.slice(0, 8).map((tag) => (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button className="h-9 gap-2 px-3" onClick={() => onDetail(asset)} type="button" variant="secondary">
            <Eye aria-hidden="true" className="h-3.5 w-3.5" />
            详情
          </Button>
          <Button className="h-9 gap-2 px-3" onClick={() => onDownload(asset)} type="button" variant="secondary">
            <Download aria-hidden="true" className="h-3.5 w-3.5" />
            下载
          </Button>
          <Button
            className="h-9 gap-2 px-3"
            onClick={() => void onCopy(`${asset.id}-caption`, buildCopy(asset))}
            type="button"
            variant="secondary"
          >
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            {copiedKey === `${asset.id}-caption` ? "已复制" : "文案"}
          </Button>
          <Button className="h-9 gap-2 px-3" onClick={() => onDelete(asset.id)} type="button" variant="danger">
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            删除
          </Button>
        </div>
      </div>
    </article>
  );
}

function AssetDetailModal({
  asset,
  copiedKey,
  onClose,
  onCopy,
  onDownload,
  onPreview,
}: {
  asset: AiImageAsset;
  copiedKey: string | null;
  onClose: () => void;
  onCopy: (key: string, text: string) => Promise<void>;
  onDownload: (asset: AiImageAsset) => void;
  onPreview: (url: string, alt: string) => void;
}) {
  const menswearProvenance = getMenswearProvenance(asset);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-700">{getModeLabel(asset.mode)}</p>
            <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-slate-950">{asset.title}</h2>
          </div>
          <button
            aria-label="关闭详情"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-74px)] gap-5 overflow-y-auto p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="grid gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">生成效果图</p>
              <button aria-label={`预览 ${asset.title}`} className="relative block aspect-[3/4] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50" onClick={() => onPreview(asset.imageUrl, asset.title)} type="button">
                <Image alt={asset.title} className="object-contain" fill sizes="60vw" src={asset.imageUrl} unoptimized />
              </button>
            </div>
            {asset.referenceImages.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">参考图</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {asset.referenceImages.map((url, index) => (
                    <div className="grid gap-1" key={`${url}-${index}`}>
                      <button aria-label={`预览参考图 ${index + 1}`} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50" onClick={() => onPreview(url, `参考图 ${index + 1}`)} type="button">
                        <Image alt={`参考图 ${index + 1}`} className="object-contain" fill sizes="160px" src={url} unoptimized />
                      </button>
                      <p className="text-center text-xs text-slate-500">
                        {getReferenceImageLabel(asset, index)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="grid h-fit gap-4">
            <DetailBlock title="正文文案">{asset.caption || asset.description || "暂无文案"}</DetailBlock>
            {menswearProvenance ? (
              <MenswearProvenanceDetails provenance={menswearProvenance} />
            ) : null}
            <DetailBlock title="Tags">{asset.tags.length ? asset.tags.join(" ") : "暂无 tags"}</DetailBlock>
            <DetailBlock title="选品关键词">
              {asset.productKeywords.length ? asset.productKeywords.join("、") : "暂无选品关键词"}
            </DetailBlock>
            <DetailBlock title="生图提示词">{asset.prompt}</DetailBlock>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2" onClick={() => onDownload(asset)} type="button" variant="secondary">
                <Download aria-hidden="true" className="h-4 w-4" />
                下载图片
              </Button>
              <Button className="gap-2" onClick={() => void onCopy(`${asset.id}-detail`, buildCopy(asset))} type="button">
                <Copy aria-hidden="true" className="h-4 w-4" />
                {copiedKey === `${asset.id}-detail` ? "已复制" : "复制文案"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MenswearProvenanceDetails({ provenance }: { provenance: MenswearProvenance }) {
  const lockedProductReferences = provenance.references.filter(
    (reference) => reference.policy === "LOCKED" && isMenswearProductRole(reference.role),
  );

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <p className="text-sm font-semibold text-slate-900">男装项目溯源</p>
      <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
        <p>
          项目：
          <Link
            className="ml-1 text-blue-700 underline underline-offset-2"
            href={`/tools/menswear/generate?projectId=${encodeURIComponent(provenance.projectId)}`}
          >
            返回项目 {provenance.projectId}
          </Link>
        </p>
        <p>模特档案：{provenance.modelProfileId || "系统生成模特"}</p>
        <p>参考素材数量：{provenance.references.length}</p>
        <div>
          <p className="font-medium text-slate-900">锁定商品参考</p>
          {lockedProductReferences.length > 0 ? (
            <ul className="mt-1 grid gap-1">
              {lockedProductReferences.map((reference) => (
                <li key={`${reference.role}-${reference.materialId}`}>
                  {getMenswearRoleLabel(reference.role)}：{reference.materialId}，保真度 {reference.fidelity}%
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">未记录锁定商品参考</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ children, title }: { children: string; title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{children}</p>
    </div>
  );
}

function getMenswearProvenance(asset: AiImageAsset): MenswearProvenance | null {
  if ((asset.sourceTool === "menswear-studio" || asset.sourceTool === "menswear-scene-image") && asset.description) {
    try {
      const value = JSON.parse(asset.description) as unknown;
      if (!isRecord(value) || typeof value.projectId !== "string" || !Array.isArray(value.references)) {
        return null;
      }

      const references = value.references.flatMap((reference) => {
        if (!isRecord(reference) || typeof reference.materialId !== "string" || typeof reference.role !== "string" || typeof reference.policy !== "string") {
          return [];
        }

        return [{
          fidelity: typeof reference.fidelity === "number" ? reference.fidelity : 0,
          materialId: reference.materialId,
          policy: reference.policy,
          role: reference.role,
        }];
      });

      return {
        modelProfileId: typeof value.modelProfileId === "string" ? value.modelProfileId : null,
        projectId: value.projectId,
        references,
      };
    } catch {
      return null;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMenswearProductRole(role: string) {
  return ["top", "inner", "bottom", "shoes", "bag", "accessory", "outfit"].includes(role);
}

function getMenswearRoleLabel(role: string) {
  const labels: Record<string, string> = {
    accessory: "配饰",
    bag: "包",
    bottom: "裤子",
    inner: "内搭",
    outfit: "整套穿搭",
    shoes: "鞋子",
    top: "主上衣",
  };

  return labels[role] ?? role;
}

function getReferenceImageLabel(asset: AiImageAsset, index: number) {
  const explicitLabel = asset.referenceLabels[index];
  if (explicitLabel) return explicitLabel;
  const { sourceTool } = asset;
  const total = asset.referenceImages.length;
  if (sourceTool === "menswear-style-reference") {
    return index === total - 1 ? "风格参考图" : `主图 ${index + 1}`;
  }
  if (sourceTool === "menswear-multi-outfit") {
    return `主商品参考图 ${index + 1}`;
  }
  if (sourceTool === "menswear-flatlay-outfit-split") {
    return index === total - 1 ? "平铺多搭参考图" : `锁定主体商品图 ${index + 1}`;
  }
  if (sourceTool === "menswear-single-outfit") {
    return index === 0 ? "锁定单品参考图" : `穿搭/脸部参考图 ${index + 1}`;
  }
  if (sourceTool === "platform-cover-design") {
    return index === 0 ? "封面原图" : `风格参考图 ${index}`;
  }
  if (sourceTool === "ip-factory") {
    return index === 0 ? "主 IP 图" : `辅助参考图 ${index}`;
  }
  if (sourceTool === "menswear-studio") {
    return "男装控制参考图";
  }
  if (sourceTool === "menswear-scene-image") {
    return `场景图参考 ${index + 1}`;
  }
  if (sourceTool === "ip-prototype") {
    return index === 0 ? "草稿/主体参考图" : "风格参考图";
  }

  return `参考图 ${index + 1}`;
}

function getModeLabel(mode: string) {
  const labels: Record<string, string> = {
    menswear: "男装",
    womenswear: "女装",
    "snack-grocery": "零食百货",
    custom: "自定义",
    outfit: "服装综合",
  };

  return labels[mode] ?? mode;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "等待中",
    RUNNING: "生成中",
    SUCCEEDED: "成功",
    FAILED: "失败",
  };

  return labels[status] ?? status;
}

function buildCopy(asset: AiImageAsset) {
  return [
    asset.title,
    asset.caption,
    asset.tags.length ? asset.tags.join(" ") : "",
    asset.productKeywords.length ? `选品关键词：${asset.productKeywords.join("、")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
