"use client";

import Image from "next/image";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";
import { ImageCropDialog } from "@/components/tools/image-crop-dialog";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import type { MenswearMaterial } from "@/components/tools/menswear/types";

const categories = [
  ["top", "上衣"],
  ["inner", "内搭"],
  ["bottom", "裤子"],
  ["shoes", "鞋子"],
  ["bag", "包"],
  ["accessory", "配饰"],
  ["outfit", "整套穿搭"],
  ["model_face", "模特脸部"],
  ["model_body", "模特身体"],
  ["pose", "姿势"],
  ["background", "背景"],
  ["composition", "构图"],
  ["lighting", "光线"],
  ["mood", "氛围"],
  ["other", "其他"],
] as const;

export function MaterialLibrary({
  onSelect,
}: {
  onSelect?: (material: MenswearMaterial) => void;
}) {
  const [materials, setMaterials] = useState<MenswearMaterial[]>([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("top");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const file = uploadFiles[0] ?? null;

  const loadMaterials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (query.trim()) params.set("query", query.trim());
      const response = await fetch(`/api/tools/menswear/materials?${params.toString()}`);
      const payload = (await response.json()) as { error?: string; materials?: MenswearMaterial[] };
      if (!response.ok) throw new Error(payload.error || "加载素材失败");
      setMaterials(payload.materials ?? []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "加载素材失败");
    } finally {
      setIsLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMaterials(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMaterials]);

  async function uploadMaterial() {
    if (!file) {
      setError("请先选择素材图片");
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("name", name || file.name.replace(/\.[^.]+$/, ""));
      formData.set("category", uploadCategory);
      formData.set("tags", tags);
      const response = await fetch("/api/tools/menswear/materials/upload", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; material?: MenswearMaterial };
      if (!response.ok || !payload.material) throw new Error(payload.error || "上传素材失败");
      setMaterials((current) => [payload.material!, ...current]);
      setUploadFiles([]);
      setName("");
      setTags("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "上传素材失败");
    } finally {
      setIsUploading(false);
    }
  }

  function chooseMaterialImage(files: File[]) {
    const selected = files[0];
    if (!selected) {
      setUploadFiles([]);
      return;
    }
    setCropSourceFile(selected);
  }

  async function deleteMaterial(material: MenswearMaterial) {
    if (!window.confirm(`删除素材「${material.name}」？`)) return;
    const response = await fetch(`/api/tools/menswear/materials/${material.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setMaterials((current) => current.filter((item) => item.id !== material.id));
    }
  }

  return (
    <div className="grid gap-5">
      <div><h2 className="text-base font-semibold text-slate-950">公开素材库</h2><p className="mt-1 text-sm text-slate-500">素材按类别集中管理，上传后可在所有男装参考槽位中选择。</p></div>
      <section className="grid gap-3 border-b border-slate-200 pb-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">搜索公开素材</span>
          <input
            className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void loadMaterials()}
            placeholder="名称或标签"
            value={query}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">分类</span>
          <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="">全部分类</option>
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <Button onClick={() => void loadMaterials()} type="button" variant="secondary">刷新</Button>
      </section>

      <section className="grid gap-3 border-b border-slate-200 pb-5 lg:grid-cols-[minmax(240px,1.3fr)_1fr_180px_1fr] lg:items-end">
        <ImageReferenceUploader emptyText="上传公开素材图片" files={uploadFiles} helper="先框选需要的区域，再保存到公开素材库" label="上传公开素材" maxFiles={1} onChange={chooseMaterialImage} />
        <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setName(event.target.value)} placeholder="素材名称" value={name} />
        <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setUploadCategory(event.target.value)} value={uploadCategory}>
          {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setTags(event.target.value)} placeholder="标签，用空格分隔" value={tags} />
          <Button className="gap-2" disabled={isUploading} onClick={() => void uploadMaterial()} type="button">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            保存到公开素材库
          </Button>
        </div>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {isLoading ? <div className="grid min-h-48 place-items-center text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div> : null}
      {!isLoading && materials.length === 0 ? <div className="grid min-h-48 place-items-center border border-dashed border-slate-300 text-sm text-slate-500">暂无公开素材，先上传服装、姿势、背景或模特参考图。</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {materials.map((material) => (
          <article className="overflow-hidden rounded-md border border-slate-200 bg-white" key={material.id}>
            <button aria-label={`预览${material.name}`} className="relative block aspect-square w-full cursor-zoom-in bg-slate-50" onClick={() => setPreviewUrl(material.imageUrl)} type="button">
              <Image alt={material.name} className="object-contain" fill sizes="(min-width: 1280px) 20vw, 50vw" src={material.imageUrl} unoptimized />
            </button>
            <div className="grid gap-2 p-3">
              <p className="truncate text-sm font-semibold text-slate-900">{material.name}</p>
              <p className="text-xs text-slate-500">{material.category} · 公开素材</p>
              <div className="flex flex-wrap gap-1">{material.tags.slice(0, 3).map((tag) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600" key={tag}>{tag}</span>)}</div>
              <div className="flex justify-between gap-2">
                {onSelect ? <Button className="h-8 px-2 text-xs" onClick={() => onSelect(material)} type="button" variant="secondary"><Plus className="mr-1 h-3.5 w-3.5" />选择</Button> : <span />}
                <button aria-label={`删除${material.name}`} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" onClick={() => void deleteMaterial(material)} type="button"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <ImagePreviewDialog imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
      <ImageCropDialog
        file={cropSourceFile}
        onClose={() => setCropSourceFile(null)}
        onConfirm={(croppedFile) => {
          setUploadFiles([croppedFile]);
          setCropSourceFile(null);
        }}
        open={Boolean(cropSourceFile)}
      />
    </div>
  );
}
