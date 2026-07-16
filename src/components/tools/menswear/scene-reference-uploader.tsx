"use client";

import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useId, useState } from "react";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";
import type { MenswearMaterial } from "@/components/tools/menswear/types";

export function SceneReferenceUploader({
  materials,
  onChange,
  maxFiles = 6,
}: {
  materials: MenswearMaterial[];
  onChange: (materials: MenswearMaterial[]) => void;
  maxFiles?: number;
}) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function uploadFiles(files: File[]) {
    const available = Math.max(maxFiles - materials.length, 0);
    const selected = files.slice(0, available);
    if (selected.length === 0) return;

    setIsUploading(true);
    setError(null);
    try {
      const uploaded: MenswearMaterial[] = [];
      for (const file of selected) {
        const formData = new FormData();
        formData.set("image", file);
        formData.set("name", file.name.replace(/\.[^.]+$/, ""));
        formData.set("category", "background");
        formData.set("tags", "场景图");
        const response = await fetch("/api/tools/menswear/materials/upload", {
          body: formData,
          method: "POST",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          material?: MenswearMaterial;
        };
        if (!response.ok || !payload.material) {
          throw new Error(payload.error || "上传场景图失败");
        }
        uploaded.push(payload.material);
      }
      onChange([...materials, ...uploaded]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "上传场景图失败");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">上传场景图（1-6 张）</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">系统将按当前场景模式保留人物、姿势、背景、光线或构图。</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-500">{materials.length}/{maxFiles} 张</span>
      </div>

      {materials.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {materials.map((material) => (
            <div className="group relative aspect-[3/4] overflow-hidden rounded-md border border-slate-200 bg-slate-50" key={material.id}>
              <button aria-label={`预览场景图${material.name}`} className="absolute inset-0" onClick={() => setPreviewUrl(material.imageUrl)} type="button">
                <Image alt={material.name} className="object-cover" fill sizes="160px" src={material.imageUrl} unoptimized />
              </button>
              <button aria-label={`移除场景图${material.name}`} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-slate-950/75 text-white opacity-0 transition-opacity group-hover:opacity-100" onClick={() => onChange(materials.filter((item) => item.id !== material.id))} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {materials.length < maxFiles ? (
        <label className="grid min-h-36 cursor-pointer place-items-center rounded-md border border-dashed border-blue-300 bg-blue-50/40 px-4 text-center text-sm text-slate-600 hover:bg-blue-50" htmlFor={inputId}>
          <span className="grid gap-2">
            {isUploading ? <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" /> : <ImagePlus className="mx-auto h-7 w-7 text-blue-600" />}
            <span className="font-semibold text-slate-900">{isUploading ? "场景图上传中" : "选择场景图"}</span>
            <span>可一次选择多张，最多 {maxFiles} 张</span>
          </span>
        </label>
      ) : null}
      <input accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={isUploading} id={inputId} multiple onChange={(event) => { void uploadFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} type="file" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ImagePreviewDialog alt="场景图预览" imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}
