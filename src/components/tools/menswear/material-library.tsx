"use client";

import Image from "next/image";
import { Loader2, Pencil, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";
import { ImageCropDialog } from "@/components/tools/image-crop-dialog";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import type { MenswearMaterial } from "@/components/tools/menswear/types";
import type { MenswearMaterialAnalysis } from "@/lib/menswear-material-analysis";

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

const categoryLabels = Object.fromEntries(categories) as Record<string, string>;

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
  const [analysis, setAnalysis] = useState<MenswearMaterialAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MenswearMaterial | null>(null);
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
      formData.set("category", analysis?.category || uploadCategory);
      formData.set("tags", tags);
      formData.set("analysis", JSON.stringify(analysis ?? {}));
      formData.set("promptNotes", analysis?.description ?? "");
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
      setAnalysis(null);
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

  async function analyzeMaterial() {
    if (!file) {
      setError("请先选择并裁剪选品图片");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("category", uploadCategory);
      const response = await fetch("/api/tools/menswear/materials/analyze", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as {
        analysis?: MenswearMaterialAnalysis;
        error?: string;
      };
      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || "AI 识别选品失败");
      }

      setAnalysis(payload.analysis);
      setName((current) => current || payload.analysis!.name);
      setUploadCategory(payload.analysis.category);
      setTags(payload.analysis.tags.join(" "));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "AI 识别选品失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function updateMaterial(material: MenswearMaterial, input: MaterialEditInput) {
    setError(null);
    try {
      const response = await fetch(`/api/tools/menswear/materials/${material.id}`, {
        body: JSON.stringify({
          analysis: input.analysis,
          category: input.category,
          imageUrl: material.imageUrl,
          name: input.name,
          promptNotes: input.description,
          sourceType: material.sourceType || "UPLOAD",
          tags: input.tags,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string; material?: MenswearMaterial };
      if (!response.ok || !payload.material) {
        throw new Error(payload.error || "更新选品失败");
      }
      setMaterials((current) => current.map((item) => item.id === material.id ? payload.material! : item));
      setEditingMaterial(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "更新选品失败");
    }
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
      <div><h2 className="text-base font-semibold text-slate-950">选品素材库</h2><p className="mt-1 text-sm text-slate-500">图片裁剪、AI 识别和人工补充后保存为当前账号的私人选品素材。系统公开素材库与私人选品素材分开管理。</p></div>
      <section className="grid gap-3 border-b border-slate-200 pb-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">搜索选品素材</span>
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
        <ImageReferenceUploader emptyText="上传选品图片" files={uploadFiles} helper="先框选需要的商品或素材区域，再 AI 识别并保存" label="上传选品图片" maxFiles={1} onChange={chooseMaterialImage} />
        <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setName(event.target.value)} placeholder="素材名称" value={name} />
        <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setUploadCategory(event.target.value)} value={uploadCategory}>
          {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setTags(event.target.value)} placeholder="标签，用空格分隔" value={tags} />
          <Button className="gap-2" disabled={isAnalyzing || !file} onClick={() => void analyzeMaterial()} type="button" variant="secondary">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI 识别图片
          </Button>
          <Button className="gap-2" disabled={isUploading || !file} onClick={() => void uploadMaterial()} type="button">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            保存选品
          </Button>
        </div>
      </section>

      {analysis ? (
        <section className="grid gap-3 rounded-md border border-blue-200 bg-blue-50 p-4">
          <div><h3 className="text-sm font-semibold text-slate-900">AI 识别结果</h3><p className="mt-1 text-sm leading-6 text-slate-600">结果已回填到保存表单；保存前可继续修改名称、分类和标签。</p></div>
          <p className="text-sm leading-6 text-slate-700">{analysis.description}</p>
          {analysis.sellPoints.length ? <div className="flex flex-wrap gap-1.5">{analysis.sellPoints.map((item) => <span className="rounded bg-white px-2 py-1 text-xs text-slate-600" key={item}>{item}</span>)}</div> : null}
        </section>
      ) : null}

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {isLoading ? <div className="grid min-h-48 place-items-center text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div> : null}
      {!isLoading && materials.length === 0 ? <div className="grid min-h-48 place-items-center border border-dashed border-slate-300 text-sm text-slate-500">暂无选品素材，先上传并裁剪商品、服装、鞋包或场景图片。</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {materials.map((material) => (
          <article className="overflow-hidden rounded-md border border-slate-200 bg-white" key={material.id}>
            <button aria-label={`预览${material.name}`} className="relative block aspect-square w-full cursor-zoom-in bg-slate-50" onClick={() => setPreviewUrl(material.imageUrl)} type="button">
              <Image alt={material.name} className="object-contain" fill sizes="(min-width: 1280px) 20vw, 50vw" src={material.imageUrl} unoptimized />
            </button>
            <div className="grid gap-2 p-3">
              <p className="truncate text-sm font-semibold text-slate-900">{material.name}</p>
              <p className="text-xs text-slate-500">{material.category === "other" ? "待分类" : categoryLabels[material.category] || material.category} · 公开素材</p>
              {material.promptNotes ? <p className="line-clamp-2 text-xs leading-5 text-slate-600">{material.promptNotes}</p> : null}
              <div className="flex flex-wrap gap-1">{material.tags.slice(0, 3).map((tag) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600" key={tag}>{tag}</span>)}</div>
              <div className="flex justify-between gap-2">
                <div className="flex gap-1">{onSelect ? <Button className="h-8 px-2 text-xs" onClick={() => onSelect(material)} type="button" variant="secondary"><Plus className="mr-1 h-3.5 w-3.5" />选择</Button> : null}<button aria-label={`编辑选品${material.name}`} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600" onClick={() => setEditingMaterial(material)} type="button"><Pencil className="h-4 w-4" /></button></div>
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
          setAnalysis(null);
          setCropSourceFile(null);
        }}
        open={Boolean(cropSourceFile)}
      />
      {editingMaterial ? <MaterialEditDialog categories={categories} key={editingMaterial.id} material={editingMaterial} onClose={() => setEditingMaterial(null)} onSave={updateMaterial} /> : null}
    </div>
  );
}

type MaterialEditInput = {
  analysis: Record<string, unknown>;
  category: string;
  description: string;
  name: string;
  tags: string[];
};

function MaterialEditDialog({
  categories,
  material,
  onClose,
  onSave,
}: {
  categories: ReadonlyArray<readonly [string, string]>;
  material: MenswearMaterial;
  onClose: () => void;
  onSave: (material: MenswearMaterial, input: MaterialEditInput) => Promise<void>;
}) {
  const [name, setName] = useState(material.name);
  const [category, setCategory] = useState(material.category);
  const [tags, setTags] = useState(material.tags.join(" "));
  const [description, setDescription] = useState(
    material.promptNotes || analysisText(material.analysis, "description"),
  );

  const tagList = tags.split(/[，,\s\n]+/).map((item) => item.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <section className="grid w-full max-w-xl gap-4 rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">编辑选品</h2><p className="mt-1 text-sm text-slate-500">修改后会更新当前私人素材，原图片不会被替换。</p></div><button aria-label="关闭编辑选品" className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">关闭</button></div>
        <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">素材名称</span><input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setName(event.target.value)} value={name} /></label>
        <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">分类</span><select className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setCategory(event.target.value)} value={category}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">选品描述</span><textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm leading-6" maxLength={500} onChange={(event) => setDescription(event.target.value)} value={description} /></label>
        <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">标签</span><input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setTags(event.target.value)} value={tags} /></label>
        <div className="flex justify-end gap-2"><Button onClick={onClose} type="button" variant="secondary">取消</Button><Button disabled={!name.trim()} onClick={() => void onSave(material, { analysis: { ...(material.analysis || {}), description }, category, description, name: name.trim(), tags: tagList })} type="button">保存修改</Button></div>
      </section>
    </div>
  );
}

function analysisText(value: Record<string, unknown> | undefined, key: string) {
  const result = value?.[key];
  return typeof result === "string" ? result : "";
}
