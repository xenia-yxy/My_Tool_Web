"use client";

import Image from "next/image";
import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";
import { MaterialPickerDialog } from "@/components/tools/menswear/material-picker-dialog";
import { policyLabels } from "@/lib/menswear-studio";
import type { DraftReference, MenswearMaterial } from "@/components/tools/menswear/types";

const strictProductRoles = new Set([
  "top",
  "inner",
  "bottom",
  "shoes",
  "bag",
  "accessory",
  "outfit",
]);

const materialCategoryByRole: Record<string, string> = {
  accessory: "accessory",
  background: "background",
  bag: "bag",
  bottom: "bottom",
  composition: "composition",
  inner: "inner",
  lighting: "lighting",
  model_body: "model_body",
  model_face: "model_face",
  mood: "mood",
  outfit: "outfit",
  pose: "pose",
  shoes: "shoes",
  top: "top",
};

export function ReferenceSlot({
  label,
  materials,
  onChange,
  onMaterialCreated,
  reference,
  role,
}: {
  label: string;
  materials: MenswearMaterial[];
  onChange: (reference: DraftReference | null) => void;
  onMaterialCreated: (material: MenswearMaterial) => void;
  reference: DraftReference | null;
  role: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMaterial = materials.find((material) => material.id === reference?.materialId) ?? null;
  const isStrictProduct = strictProductRoles.has(role);

  function update(patch: Partial<DraftReference>) {
    if (!reference) return;
    onChange({ ...reference, ...patch });
  }

  function selectMaterial(material: MenswearMaterial) {
    onChange({
      allowedChanges: [],
      fidelity: isStrictProduct ? 100 : 70,
      materialId: material.id,
      policy: isStrictProduct ? "LOCKED" : "REPLACE",
      role,
    });
  }

  async function handleUpload(files: File[]) {
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("name", file.name.replace(/\.[^.]+$/, ""));
      formData.set("category", materialCategoryByRole[role] || "other");
      formData.set("tags", label);
      const response = await fetch("/api/tools/menswear/materials/upload", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        material?: MenswearMaterial;
      };
      if (!response.ok || !payload.material) {
        throw new Error(payload.error || "上传参考图失败");
      }

      onMaterialCreated(payload.material);
      selectMaterial(payload.material);
    } catch (caughtError) {
      setUploadError(caughtError instanceof Error ? caughtError.message : "上传参考图失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // 空状态：精简单行，只显示标题 + 上传 + 选择素材
  if (!selectedMaterial || !reference) {
    return (
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleUpload(Array.from(event.target.files ?? []))}
            />
            <button
              type="button"
              disabled={isUploading}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
              {isUploading ? "上传中" : "上传"}
            </button>
            <MaterialPickerDialog
              materials={materials}
              onSelect={selectMaterial}
              selectedId={reference?.materialId}
            />
          </div>
        </div>
        {uploadError ? (
          <p className="mt-1 text-xs leading-5 text-red-600">{uploadError}</p>
        ) : null}
      </div>
    );
  }

  // 选中状态：缩略图 + 名称 + 策略/保真度（商品类锁定不显示策略选择器）
  return (
    <div className="rounded-md border border-blue-100 bg-blue-50/40 p-2">
      <div className="flex items-start gap-2">
        <button
          aria-label={`预览${label}`}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white"
          onClick={() => setPreviewUrl(selectedMaterial.imageUrl)}
          type="button"
        >
          <Image
            alt={selectedMaterial.name}
            className="object-contain"
            fill
            sizes="48px"
            src={selectedMaterial.imageUrl}
            unoptimized
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{selectedMaterial.name}</p>
          {isStrictProduct ? (
            <p className="mt-0.5 text-xs text-slate-500">已锁定 · 保真 100%</p>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <select
                className="h-7 rounded border border-slate-200 bg-white px-1 text-xs text-slate-700"
                onChange={(event) => update({ policy: event.target.value as DraftReference["policy"] })}
                value={reference.policy}
              >
                {Object.entries(policyLabels).map(([value, text]) => (
                  <option key={value} value={value}>{text}</option>
                ))}
              </select>
              <input
                aria-label={`${label}保真强度`}
                className="h-7 w-14 rounded border border-slate-200 px-1 text-xs"
                disabled={reference.policy === "LOCKED"}
                max={100}
                min={0}
                onChange={(event) => update({ fidelity: Number(event.target.value) })}
                type="number"
                value={reference.policy === "LOCKED" ? 100 : reference.fidelity}
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
          )}
        </div>
        <button
          aria-label={`清除${label}`}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          onClick={() => onChange(null)}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {uploadError ? (
        <p className="mt-1 text-xs leading-5 text-red-600">{uploadError}</p>
      ) : null}
      <ImagePreviewDialog
        alt={selectedMaterial.name}
        imageUrl={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  );
}
