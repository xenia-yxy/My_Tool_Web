"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageReferenceUploader } from "@/components/tools/image-reference-uploader";
import type { MenswearModelProfile } from "@/components/tools/menswear/types";

export type ModelFaceReferenceSource = "system" | "profile" | "material" | "upload";

type ModelFaceReferenceSelectorProps = {
  files: File[];
  label?: string;
  onChange: (files: File[]) => void;
  onProfileChange?: (profileId: string) => void;
  onSourceChange?: (source: ModelFaceReferenceSource) => void;
  profileId?: string;
  source: ModelFaceReferenceSource;
};

const sourceOptions: Array<[ModelFaceReferenceSource, string]> = [
  ["system", "系统生成"],
  ["profile", "模特档案"],
  ["material", "素材库脸部"],
  ["upload", "上传脸部参考"],
];

export function ModelFaceReferenceSelector({
  files,
  label = "模特脸部",
  onChange,
  onProfileChange,
  onSourceChange,
  profileId = "",
  source,
}: ModelFaceReferenceSelectorProps) {
  const [profiles, setProfiles] = useState<MenswearModelProfile[]>([]);
  const readyProfiles = useMemo(
    () => profiles.filter((profile) => profile.status === "READY"),
    [profiles],
  );

  useEffect(() => {
    if (source !== "profile" || profiles.length > 0) return;
    const controller = new AbortController();
    void fetch("/api/tools/menswear/models", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ profiles?: MenswearModelProfile[] }> : { profiles: [] })
      .then((payload) => setProfiles(payload.profiles ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [profiles.length, source]);

  async function selectProfile(nextProfileId: string) {
    onProfileChange?.(nextProfileId);
    if (!nextProfileId) {
      onChange([]);
      return;
    }

    const profile = readyProfiles.find((item) => item.id === nextProfileId);
    const face = profile?.images?.find((image) => image.role === "face")?.material;
    if (!face) {
      onChange([]);
      return;
    }

    try {
      const response = await fetch(face.imageUrl);
      if (!response.ok) throw new Error("脸部素材不可用");
      const blob = await response.blob();
      const extension = blob.type.includes("jpeg") ? "jpg" : blob.type.includes("webp") ? "webp" : "png";
      onChange([new File([blob], `${profile?.name || "model-face"}.${extension}`, { type: blob.type || "image/png" })]);
    } catch {
      onChange([]);
    }
  }

  function selectSource(nextSource: ModelFaceReferenceSource) {
    onSourceChange?.(nextSource);
    if (nextSource === "system") {
      onProfileChange?.("");
      onChange([]);
    }
  }

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">脸部参考只用于人物身份与五官一致性，不会覆盖服装、身材、姿势、场景或画面风格。</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {sourceOptions.map(([value, text]) => (
          <button
            className={`h-9 rounded-md border px-2 text-xs font-medium ${source === value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
            key={value}
            onClick={() => selectSource(value)}
            type="button"
          >
            {text}
          </button>
        ))}
      </div>
      {source === "profile" ? (
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-700">选择模特档案</span>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => void selectProfile(event.target.value)} value={profileId}>
            <option value="">选择已生成脸部的模特档案</option>
            {readyProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>
        </label>
      ) : null}
      {source === "material" || source === "upload" ? (
        <ImageReferenceUploader
          emptyText={source === "material" ? "从素材库选择模特脸部" : "上传脸部参考图"}
          files={files}
          helper={source === "material" ? "只显示模特脸部分类，也可切换为本地上传" : "支持 JPG、PNG、WebP；仅用于脸部一致性"}
          label={source === "material" ? "素材库脸部" : "脸部参考图"}
          materialCategories={["model_face"]}
          maxFiles={1}
          onChange={onChange}
        />
      ) : null}
      {source === "profile" && profileId && files.length === 0 ? <p className="text-xs text-amber-700">该档案暂无可用脸部图，请先在模特档案中生成或上传脸部参考图。</p> : null}
    </section>
  );
}
