"use client";

import Image from "next/image";
import { Loader2, Sparkles, Trash2, UserRoundPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import { MaterialPickerDialog } from "@/components/tools/menswear/material-picker-dialog";
import type { MenswearMaterial, MenswearModelProfile } from "@/components/tools/menswear/types";

export function ModelProfileManager() {
  const [profiles, setProfiles] = useState<MenswearModelProfile[]>([]);
  const [materials, setMaterials] = useState<MenswearMaterial[]>([]);
  const [name, setName] = useState("");
  const [faceMaterialId, setFaceMaterialId] = useState("");
  const [bodyMaterialId, setBodyMaterialId] = useState("");
  const [faceUploadFiles, setFaceUploadFiles] = useState<File[]>([]);
  const [bodyUploadFiles, setBodyUploadFiles] = useState<File[]>([]);
  const [modelParameters, setModelParameters] = useState({
    ageFeeling: "20-28 岁年轻感",
    bodyType: "匀称修长",
    hairStyle: "自然短发",
    height: "178cm",
    skinTone: "自然肤色",
  });
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingProfileId, setGeneratingProfileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const faceMaterial = materials.find((item) => item.id === faceMaterialId) ?? null;
  const bodyMaterial = materials.find((item) => item.id === bodyMaterialId) ?? null;
  const faceMaterials = materials.filter((item) => item.category === "model_face");
  const bodyMaterials = materials.filter((item) => item.category === "model_body");
  const hasReference = Boolean(faceMaterialId || bodyMaterialId);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profilesResponse, materialsResponse] = await Promise.all([
        fetch("/api/tools/menswear/models"),
        fetch("/api/tools/menswear/materials"),
      ]);
      const profilePayload = (await profilesResponse.json()) as { error?: string; profiles?: MenswearModelProfile[] };
      const materialPayload = (await materialsResponse.json()) as { error?: string; materials?: MenswearMaterial[] };
      if (!profilesResponse.ok) throw new Error(profilePayload.error || "加载模特档案失败");
      if (!materialsResponse.ok) throw new Error(materialPayload.error || "加载公开素材失败");
      setProfiles(profilePayload.profiles ?? []);
      setMaterials(materialPayload.materials ?? []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "加载模特档案失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createProfile() {
    if (!name.trim()) {
      setError("请填写模特档案名称");
      return;
    }
    if (hasReference && !consentConfirmed) {
      setError("确认拥有该人物素材的使用许可后才能创建档案");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const images = [
        faceMaterialId ? { materialId: faceMaterialId, role: "face" } : null,
        bodyMaterialId ? { materialId: bodyMaterialId, role: "body" } : null,
      ].filter(Boolean);
      const response = await fetch("/api/tools/menswear/models", {
        body: JSON.stringify({ consentConfirmed: hasReference ? consentConfirmed : true, images, name: name.trim(), profile: modelParameters }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; profile?: MenswearModelProfile };
      if (!response.ok || !payload.profile) throw new Error(payload.error || "创建模特档案失败");
      setProfiles((current) => [payload.profile!, ...current]);
      setName("");
      setFaceMaterialId("");
      setBodyMaterialId("");
      setFaceUploadFiles([]);
      setBodyUploadFiles([]);
      setModelParameters({ ageFeeling: "20-28 岁年轻感", bodyType: "匀称修长", hairStyle: "自然短发", height: "178cm", skinTone: "自然肤色" });
      setConsentConfirmed(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "创建模特档案失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadProfileReference(files: File[], category: "model_face" | "model_body") {
    const file = files[0];
    if (!file) return;
    setIsSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("category", category);
      formData.set("name", file.name.replace(/\.[^.]+$/, ""));
      formData.set("tags", category === "model_face" ? "模特 脸部参考" : "模特 全身参考");
      const response = await fetch("/api/tools/menswear/materials/upload", { body: formData, method: "POST" });
      const payload = (await response.json()) as { error?: string; material?: MenswearMaterial };
      if (!response.ok || !payload.material) throw new Error(payload.error || "上传模特参考图失败");
      setMaterials((current) => [payload.material!, ...current.filter((item) => item.id !== payload.material?.id)]);
      if (category === "model_face") {
        setFaceMaterialId(payload.material.id);
        setFaceUploadFiles([]);
      } else {
        setBodyMaterialId(payload.material.id);
        setBodyUploadFiles([]);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "上传模特参考图失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProfile(profile: MenswearModelProfile) {
    if (!window.confirm(`停用并删除模特档案「${profile.name}」？`)) return;
    const response = await fetch(`/api/tools/menswear/models/${profile.id}`, { method: "DELETE" });
    if (response.ok) setProfiles((current) => current.filter((item) => item.id !== profile.id));
  }

  async function generateProfileImage(profile: MenswearModelProfile, output: "face" | "body") {
    setGeneratingProfileId(`${profile.id}:${output}`);
    setError(null);
    try {
      const response = await fetch(`/api/tools/menswear/models/${profile.id}/generate`, {
        body: JSON.stringify({ output }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        material?: MenswearMaterial;
        profile?: MenswearModelProfile;
      };
      if (!response.ok || !payload.profile || !payload.material) {
        throw new Error(payload.error || "生成模特图失败");
      }
      setProfiles((current) => current.map((item) => item.id === profile.id ? payload.profile! : item));
      setMaterials((current) => [payload.material!, ...current.filter((item) => item.id !== payload.material?.id)]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "生成模特图失败");
    } finally {
      setGeneratingProfileId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 border-b border-slate-200 pb-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <label className="grid gap-2"><span className="text-sm font-medium text-slate-700">档案名称</span><input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setName(event.target.value)} placeholder="例如：男模特 01" value={name} /></label>
        <ReferenceMaterialField
          label="脸部参考"
          material={faceMaterial}
          materials={faceMaterials}
          onClear={() => setFaceMaterialId("")}
          onPreview={setPreviewUrl}
          onSelect={(material) => setFaceMaterialId(material.id)}
        />
        <ReferenceMaterialField
          label="身体参考"
          material={bodyMaterial}
          materials={bodyMaterials}
          onClear={() => setBodyMaterialId("")}
          onPreview={setPreviewUrl}
          onSelect={(material) => setBodyMaterialId(material.id)}
        />
        <div className="grid gap-3 rounded-md border border-dashed border-slate-300 p-3 lg:col-span-3 lg:grid-cols-2">
          <ImageReferenceUploader emptyText="上传脸部照片或肖像参考" files={faceUploadFiles} helper="上传后自动存为公开脸部素材并选中" label="上传脸部参考图" maxFiles={1} onChange={(files) => { setFaceUploadFiles(files); void uploadProfileReference(files, "model_face"); }} />
          <ImageReferenceUploader emptyText="上传全身照或身材参考" files={bodyUploadFiles} helper="上传后自动存为公开全身素材并选中" label="上传全身参考图" maxFiles={1} onChange={(files) => { setBodyUploadFiles(files); void uploadProfileReference(files, "model_body"); }} />
        </div>
        <Button className="gap-2" disabled={isSaving} onClick={() => void createProfile()} type="button">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}创建模特档案</Button>
        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:col-span-4 lg:grid-cols-5">
          <p className="text-sm font-semibold text-slate-800 lg:col-span-5">模特参数</p>
          <ModelParameterSelect label="年龄感" options={["18-22 岁少年感", "20-28 岁年轻感", "28-35 岁成熟感", "35 岁以上沉稳感"]} onChange={(value) => setModelParameters((current) => ({ ...current, ageFeeling: value }))} value={modelParameters.ageFeeling} />
          <ModelParameterSelect label="身材" options={["匀称修长", "高挑偏瘦", "运动健壮", "自然微壮"]} onChange={(value) => setModelParameters((current) => ({ ...current, bodyType: value }))} value={modelParameters.bodyType} />
          <ModelParameterSelect label="发型" options={["自然短发", "干净寸头", "微卷短发", "中长层次发"]} onChange={(value) => setModelParameters((current) => ({ ...current, hairStyle: value }))} value={modelParameters.hairStyle} />
          <ModelParameterSelect label="肤色" options={["自然肤色", "白皙肤色", "健康小麦色", "冷白肤色"]} onChange={(value) => setModelParameters((current) => ({ ...current, skinTone: value }))} value={modelParameters.skinTone} />
          <ModelParameterSelect label="身高" options={["172cm", "178cm", "183cm", "188cm"]} onChange={(value) => setModelParameters((current) => ({ ...current, height: value }))} value={modelParameters.height} />
        </div>
        {hasReference ? <label className="flex items-center gap-2 text-xs text-slate-600 lg:col-span-4"><input checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} type="checkbox" />我确认拥有该人物素材用于一致性生成的许可</label> : <p className="text-xs text-slate-500 lg:col-span-4">未选择参考图时，将按以上参数创建可直接生成的系统模特。</p>}
      </section>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {isLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div> : null}
      {!isLoading && profiles.length === 0 ? <div className="grid min-h-48 place-items-center border border-dashed border-slate-300 px-5 text-center text-sm leading-6 text-slate-500">暂无模特档案。请在上方上传或从公开素材中选择脸部、身体参考图后创建档案；历史恢复图片显示为待分类时，先到素材中心改为脸部或身体分类。</div> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <article className="grid gap-3 rounded-md border border-slate-200 bg-white p-4" key={profile.id}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-950">{profile.name}</h2><p className="mt-1 text-xs text-slate-500">{profile.status === "READY" ? "可用于一致性生成" : "草稿"}</p></div><button aria-label={`删除${profile.name}`} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" onClick={() => void deleteProfile(profile)} type="button"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600"><span>脸部 {profile.faceLockStrength}</span><span>身材 {profile.bodyLockStrength}</span><span>发型 {profile.hairLockStrength}</span></div>
            {profile.images?.length ? <div className="grid grid-cols-4 gap-2">{profile.images.map((image, index) => image.material?.imageUrl ? <button aria-label={`预览${profile.name}参考图${index + 1}`} className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50" key={`${image.role}-${image.materialId}`} onClick={() => setPreviewUrl(image.material!.imageUrl)} type="button"><Image alt={`${profile.name} ${image.role}`} className="object-contain" fill sizes="80px" src={image.material.imageUrl} unoptimized /></button> : null)}</div> : <p className="text-xs text-slate-500">尚未添加参考图</p>}
            <div className="grid gap-2 sm:grid-cols-2"><Button className="h-9 gap-2 text-xs" disabled={generatingProfileId !== null} onClick={() => void generateProfileImage(profile, "face")} type="button" variant="secondary">{generatingProfileId === `${profile.id}:face` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}生成脸部参考图</Button><Button className="h-9 gap-2 text-xs" disabled={generatingProfileId !== null} onClick={() => void generateProfileImage(profile, "body")} type="button" variant="secondary">{generatingProfileId === `${profile.id}:body` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}生成全身模特图</Button></div>
          </article>
        ))}
      </div>
      <ImagePreviewDialog imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}

function ModelParameterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ReferenceMaterialField({
  label,
  material,
  materials,
  onClear,
  onPreview,
  onSelect,
}: {
  label: string;
  material: MenswearMaterial | null;
  materials: MenswearMaterial[];
  onClear: () => void;
  onPreview: (imageUrl: string) => void;
  onSelect: (material: MenswearMaterial) => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {material ? (
        <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-1.5">
          <button aria-label={`预览${label}`} className="relative aspect-square overflow-hidden rounded border border-slate-200 bg-white" onClick={() => onPreview(material.imageUrl)} type="button"><Image alt={material.name} className="object-contain" fill sizes="40px" src={material.imageUrl} unoptimized /></button>
          <p className="truncate text-xs font-medium text-slate-700">{material.name}</p>
          <button aria-label={`清除${label}`} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-800" onClick={onClear} type="button"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}
      <MaterialPickerDialog materials={materials} onSelect={onSelect} selectedId={material?.id} />
    </div>
  );
}
